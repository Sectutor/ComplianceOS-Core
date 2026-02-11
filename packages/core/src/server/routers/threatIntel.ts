import { z } from "zod";
import * as threatIntel from "../../lib/threatIntelligence";
import { sendThreatAlert } from "../../emailNotification";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import * as db from "../../db";
import { TRPCError } from "@trpc/server";

export const createThreatIntelRouter = (t: any, adminProcedure: any, publicProcedure: any, protectedProcedure: any, clientProcedure: any) => t.router({
    // Scan a single asset for CVE matches
    scanAsset: clientProcedure
        .input(z.object({
            clientId: z.number(),
            assetId: z.number(),
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { assets } = await import("../../schema");

            const asset = await dbConn.select().from(assets)
                .where(eq(assets.id, input.assetId))
                .limit(1);

            if (!asset[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

            const suggestions = await threatIntel.scanAssetForCves(asset[0]);
            return { suggestions, scannedAt: new Date() };
        }),

    scanAllAssets: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .mutation(async ({ input }: any) => {
            try {
                console.log(`[TRPC] Starting scanAllAssets for client: ${input.clientId}`);
                const startTime = new Date();

                // Run the scan
                const results = await threatIntel.scanAllAssetsForClient(input.clientId);

                console.log(`[TRPC] scanAllAssets completed for client: ${input.clientId}`);

                // Check for new High Severity vulnerabilities to alert
                const dbConn = await db.getDb();
                const { assetCveMatches, nvdCveCache, assets } = await import("../../schema");

                const newHighSevMatches = await dbConn.select({
                    cveId: assetCveMatches.cveId,
                    assetName: assets.name,
                    description: nvdCveCache.description,
                    score: nvdCveCache.cvssScore,
                    discoveredAt: assetCveMatches.discoveredAt
                })
                    .from(assetCveMatches)
                    .innerJoin(assets, eq(assetCveMatches.assetId, assets.id))
                    .innerJoin(nvdCveCache, eq(assetCveMatches.cveId, nvdCveCache.cveId))
                    .where(and(
                        eq(assetCveMatches.clientId, input.clientId),
                        gte(assetCveMatches.discoveredAt, startTime)
                    ));

                // Filter for High/Critical (Score >= 7.0)
                const criticalThreats = newHighSevMatches.filter(m => {
                    const score = parseFloat(m.score || '0');
                    return score >= 7.0;
                });

                if (criticalThreats.length > 0) {
                    console.log(`[TRPC] Sending alert for ${criticalThreats.length} new critical threats`);
                    await sendThreatAlert(input.clientId, criticalThreats);
                }

                return { results, scannedAt: new Date() };
            } catch (error: any) {
                console.error(`[TRPC Error] scanAllAssets failed for client ${input.clientId}:`, error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Internal error during bulk scan: ${error.message}`,
                    cause: error,
                });
            }
        }),

    // Get CVE suggestions for an asset (from cache)
    getAssetSuggestions: clientProcedure
        .input(z.object({ assetId: z.number() }))
        .query(async ({ input }: any) => {
            const suggestions = await threatIntel.getAssetCveSuggestions(input.assetId);
            return suggestions;
        }),

    // Get CVE details (from cache or fetch)
    getCveDetails: publicProcedure
        .input(z.object({ cveId: z.string() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { nvdCveCache } = await import("../../schema");

            const cached = await dbConn.select().from(nvdCveCache)
                .where(eq(nvdCveCache.cveId, input.cveId))
                .limit(1);

            if (cached[0]) {
                return cached[0];
            }

            const nvdResult = await threatIntel.getCveById(input.cveId);
            if (nvdResult?.vulnerabilities?.[0]) {
                await threatIntel.cacheCveData(nvdResult.vulnerabilities[0].cve);
                const newCached = await dbConn.select().from(nvdCveCache)
                    .where(eq(nvdCveCache.cveId, input.cveId))
                    .limit(1);
                return newCached[0] || null;
            }

            return null;
        }),

    // Lookup a CVE by ID (mutation for Vulnerability Editor)
    lookupCve: publicProcedure
        .input(z.object({ cveId: z.string() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { nvdCveCache } = await import("../../schema");

            if (dbConn) {
                const cached = await dbConn.select().from(nvdCveCache)
                    .where(eq(nvdCveCache.cveId, input.cveId))
                    .limit(1);

                if (cached[0]) {
                    return { cve: cached[0], source: 'cache' };
                }
            }

            const nvdResult = await threatIntel.getCveById(input.cveId);
            if (nvdResult?.vulnerabilities?.[0]) {
                const cve = nvdResult.vulnerabilities[0].cve;

                if (dbConn) {
                    await threatIntel.cacheCveData(cve);
                }

                const cvssV31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
                const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
                const cvssScore = cvssV31?.baseScore?.toString() || cvssV2?.baseScore?.toString() || null;

                return {
                    cve: {
                        cveId: cve.id,
                        description: cve.descriptions.find((d: any) => d.lang === 'en')?.value || cve.descriptions[0]?.value || '',
                        cvssScore,
                        cvssVector: cvssV31?.vectorString || cvssV2?.vectorString || null,
                    },
                    source: 'nvd'
                };
            }

            return { cve: null, source: 'not_found' };
        }),

    // Scan a single vendor for CVE matches
    scanVendor: clientProcedure
        .input(z.object({
            clientId: z.number(),
            vendorId: z.number(),
        }))
        .mutation(async ({ input }: any) => {
            const suggestions = await threatIntel.scanVendorForCves(input.vendorId);
            return { suggestions, scannedAt: new Date() };
        }),

    // Get CVE suggestions for a vendor (from cache)
    getVendorSuggestions: clientProcedure
        .input(z.object({ vendorId: z.number() }))
        .query(async ({ input }: any) => {
            const suggestions = await threatIntel.getVendorCveSuggestions(input.vendorId);
            return suggestions;
        }),

    // Sync CISA KEV catalog
    syncKevCatalog: adminProcedure
        .mutation(async () => {
            const count = await threatIntel.syncCisaKevCatalog();
            return { synced: count, syncedAt: new Date() };
        }),

    // Get KEV catalog stats
    getKevStats: publicProcedure
        .query(async () => {
            const dbConn = await db.getDb();
            const { cisaKevCache, threatIntelSyncLog } = await import("../../schema");

            const countResult = await dbConn.select({ count: sql<number>`count(*)` })
                .from(cisaKevCache);

            const lastSync = await dbConn.select().from(threatIntelSyncLog)
                .where(eq(threatIntelSyncLog.source, 'cisa_kev'))
                .orderBy(desc(threatIntelSyncLog.completedAt))
                .limit(1);

            return {
                total: countResult[0]?.count || 0,
                lastSync: lastSync[0]?.completedAt || null,
            };
        }),

    // Get ALL CVE suggestions for a client
    getClientSuggestions: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { assetCveMatches, nvdCveCache, assets } = await import("../../schema");

            const matches = await dbConn.select({
                matchId: assetCveMatches.id,
                cveId: assetCveMatches.cveId,
                assetId: assetCveMatches.assetId,
                assetName: assets.name,
                matchScore: assetCveMatches.matchScore,
                isKev: assetCveMatches.isKev,
                status: assetCveMatches.status,
                discoveredAt: assetCveMatches.discoveredAt,
                description: nvdCveCache.description,
                cvssScore: nvdCveCache.cvssScore,
            })
                .from(assetCveMatches)
                .innerJoin(assets, eq(assetCveMatches.assetId, assets.id))
                .leftJoin(nvdCveCache, eq(assetCveMatches.cveId, nvdCveCache.cveId))
                .where(eq(assetCveMatches.clientId, input.clientId))
                .orderBy(desc(assetCveMatches.discoveredAt));

            return matches;
        }),

    // Update match status (accept/dismiss/import)
    updateMatchStatus: clientProcedure
        .input(z.object({
            matchId: z.number(),
            status: z.enum(['suggested', 'accepted', 'dismissed', 'imported']),
        }))
        .mutation(async ({ input, ctx }: any) => {
            await threatIntel.updateMatchStatus(input.matchId, input.status, ctx.user?.id);
            return { success: true };
        }),

    // Bulk update match status
    bulkUpdateMatchStatus: clientProcedure
        .input(z.object({
            matchIds: z.array(z.number()),
            status: z.enum(['accepted', 'dismissed']),
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            const { assetCveMatches } = await import("../../schema");

            await dbConn.update(assetCveMatches)
                .set({
                    status: input.status,
                    reviewedAt: new Date(),
                    reviewedBy: ctx.user?.id,
                })
                .where(sql`${assetCveMatches.id} IN (${sql.join(input.matchIds, sql`, `)})`);

            return { success: true, count: input.matchIds.length };
        }),

    // Import CVE as vulnerability
    importCveAsVulnerability: clientProcedure
        .input(z.object({
            clientId: z.number(),
            assetId: z.number(),
            cveId: z.string(),
            matchId: z.number().optional(),
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { nvdCveCache, vulnerabilities, assetCveMatches } = await import("../../schema");

            const cached = await dbConn.select().from(nvdCveCache)
                .where(eq(nvdCveCache.cveId, input.cveId))
                .limit(1);

            if (!cached[0]) {
                throw new TRPCError({ code: "NOT_FOUND", message: "CVE not found in cache" });
            }

            const cve = cached[0];
            const isKev = await threatIntel.isInKevCatalog(input.cveId);

            const cvssNum = parseFloat(cve.cvssScore || '0');
            const cvssInt = Math.round(cvssNum * 10);

            const [newVuln] = await dbConn.insert(vulnerabilities).values({
                clientId: input.clientId,
                vulnerabilityId: input.cveId,
                name: `${input.cveId}: ${cve.description?.substring(0, 100)}...`,
                description: cve.description,
                cveId: input.cveId,
                severity: cvssNum >= 9 ? 'Critical' :
                    cvssNum >= 7 ? 'High' :
                        cvssNum >= 4 ? 'Medium' : 'Low',
                cvssScore: cvssInt,
                affectedAssets: [],
                source: 'NVD',
                status: 'open',
                discoveryDate: new Date(),
            }).returning();

            if (input.matchId) {
                await dbConn.update(assetCveMatches)
                    .set({
                        status: 'imported',
                        importedVulnerabilityId: newVuln.id,
                        reviewedAt: new Date(),
                    })
                    .where(eq(assetCveMatches.id, input.matchId));
            }

            return { vulnerability: newVuln, isKev };
        }),

    // Get daily briefing for a client
    getDailyBriefing: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            return await threatIntel.getDailyBriefing(input.clientId);
        }),

    // Get MITRE ATT&CK Matrix (Exposure Focus)
    getMITREMatrix: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { adversaries, adversaryTactics, adversaryTechniques } = await import("../../schema");

            // Simplified: return tactics and techniques for visualization
            const tactics = await dbConn.select().from(adversaryTactics).orderBy(adversaryTactics.order);
            const techniques = await dbConn.select().from(adversaryTechniques);

            return { tactics, techniques };
        }),
});
