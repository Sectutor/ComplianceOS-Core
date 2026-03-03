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

    // Get assets affected by a specific threat
    getThreatAffectedAssets: clientProcedure
        .input(z.object({
            threatId: z.number()
        }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings, assets } = await import("../../schema");

            const mappings = await dbConn.select({
                mappingId: threatAssetMappings.id,
                assetId: threatAssetMappings.assetId,
                assetName: assets.name,
                assetType: assets.type,
                confidence: threatAssetMappings.confidence,
                impactLevel: threatAssetMappings.impactLevel,
                status: threatAssetMappings.status,
                mappingMethod: threatAssetMappings.mappingMethod,
                createdAt: threatAssetMappings.createdAt
            })
                .from(threatAssetMappings)
                .innerJoin(assets, eq(threatAssetMappings.assetId, assets.id))
                .where(eq(threatAssetMappings.threatId, input.threatId));

            return mappings;
        }),

    // Get threats affecting a specific asset
    getAssetThreats: clientProcedure
        .input(z.object({
            assetId: z.number()
        }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings, threats } = await import("../../schema");

            const mappings = await dbConn.select({
                mappingId: threatAssetMappings.id,
                threatId: threatAssetMappings.threatId,
                threatName: threats.name,
                threatCategory: threats.category,
                likelihood: threats.likelihood,
                confidence: threatAssetMappings.confidence,
                impactLevel: threatAssetMappings.impactLevel,
                status: threatAssetMappings.status,
                createdAt: threatAssetMappings.createdAt
            })
                .from(threatAssetMappings)
                .innerJoin(threats, eq(threatAssetMappings.threatId, threats.id))
                .where(eq(threatAssetMappings.assetId, input.assetId));

            return mappings;
        }),

    // Get all threat-asset mappings for a client (for dashboard)
    getClientThreatAssetMappings: clientProcedure
        .input(z.object({
            clientId: z.number()
        }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings, threats, assets } = await import("../../schema");

            const mappings = await dbConn.select({
                mappingId: threatAssetMappings.id,
                threatId: threatAssetMappings.threatId,
                threatName: threats.name,
                threatCategory: threats.category,
                threatLikelihood: threats.likelihood,
                assetId: threatAssetMappings.assetId,
                assetName: assets.name,
                assetType: assets.type,
                confidence: threatAssetMappings.confidence,
                impactLevel: threatAssetMappings.impactLevel,
                status: threatAssetMappings.status,
                createdAt: threatAssetMappings.createdAt
            })
                .from(threatAssetMappings)
                .innerJoin(threats, eq(threatAssetMappings.threatId, threats.id))
                .innerJoin(assets, eq(threatAssetMappings.assetId, assets.id))
                .where(eq(threatAssetMappings.clientId, input.clientId))
                .orderBy(desc(threatAssetMappings.createdAt));

            return mappings;
        }),

    // Link an asset to a threat
    linkAssetToThreat: clientProcedure
        .input(z.object({
            clientId: z.number(),
            threatId: z.number(),
            assetId: z.number(),
            confidence: z.number().optional().default(100),
            impactLevel: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
            mappingMethod: z.enum(['manual', 'automated', 'ai_suggested']).optional().default('manual'),
            notes: z.string().optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings } = await import("../../schema");

            // Check if mapping already exists
            const existing = await dbConn.select()
                .from(threatAssetMappings)
                .where(sql`${threatAssetMappings.threatId} = ${input.threatId} AND ${threatAssetMappings.assetId} = ${input.assetId}`)
                .limit(1);

            if (existing.length > 0) {
                // Update existing mapping
                const [updated] = await dbConn.update(threatAssetMappings)
                    .set({
                        confidence: input.confidence,
                        impactLevel: input.impactLevel,
                        mappingMethod: input.mappingMethod,
                        notes: input.notes,
                        updatedAt: new Date()
                    })
                    .where(sql`${threatAssetMappings.threatId} = ${input.threatId} AND ${threatAssetMappings.assetId} = ${input.assetId}`)
                    .returning();
                return { mapping: updated, created: false };
            }

            // Create new mapping
            const [mapping] = await dbConn.insert(threatAssetMappings).values({
                clientId: input.clientId,
                threatId: input.threatId,
                assetId: input.assetId,
                confidence: input.confidence,
                impactLevel: input.impactLevel,
                mappingMethod: input.mappingMethod,
                notes: input.notes,
                mappedBy: ctx.user?.id,
                status: 'active'
            }).returning();

            return { mapping, created: true };
        }),

    // Remove a threat-asset mapping
    unlinkAssetFromThreat: clientProcedure
        .input(z.object({
            mappingId: z.number()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings } = await import("../../schema");

            await dbConn.delete(threatAssetMappings)
                .where(eq(threatAssetMappings.id, input.mappingId));

            return { success: true };
        }),

    // Update threat-asset mapping status
    updateThreatAssetMapping: clientProcedure
        .input(z.object({
            mappingId: z.number(),
            status: z.enum(['active', 'mitigated', 'false_positive']),
            impactLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            notes: z.string().optional()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings } = await import("../../schema");

            const updateData: any = {
                status: input.status,
                updatedAt: new Date()
            };

            if (input.impactLevel) updateData.impactLevel = input.impactLevel;
            if (input.notes) updateData.notes = input.notes;

            const [updated] = await dbConn.update(threatAssetMappings)
                .set(updateData)
                .where(eq(threatAssetMappings.id, input.mappingId))
                .returning();

            return { mapping: updated };
        }),

    // Get affected assets summary for dashboard
    getAffectedAssetsSummary: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { threatAssetMappings, assets, threats } = await import("../../schema");

            // Get total affected assets count
            const affectedAssetsResult = await dbConn.select({
                assetId: threatAssetMappings.assetId
            })
                .from(threatAssetMappings)
                .where(and(
                    eq(threatAssetMappings.clientId, input.clientId),
                    eq(threatAssetMappings.status, 'active')
                ))
                .groupBy(threatAssetMappings.assetId);

            const affectedAssetsCount = affectedAssetsResult.length;

            // Get total active threats affecting assets
            const activeThreatsResult = await dbConn.select({
                threatId: threatAssetMappings.threatId
            })
                .from(threatAssetMappings)
                .where(and(
                    eq(threatAssetMappings.clientId, input.clientId),
                    eq(threatAssetMappings.status, 'active')
                ))
                .groupBy(threatAssetMappings.threatId);

            const activeThreatsCount = activeThreatsResult.length;

            // Get assets by impact level
            const byImpactLevel = await dbConn.select({
                impactLevel: threatAssetMappings.impactLevel,
                count: sql<number>`count(*)`.mapWith(Number)
            })
                .from(threatAssetMappings)
                .where(and(
                    eq(threatAssetMappings.clientId, input.clientId),
                    eq(threatAssetMappings.status, 'active')
                ))
                .groupBy(threatAssetMappings.impactLevel);

            // Get recent mappings
            const recentMappings = await dbConn.select({
                mappingId: threatAssetMappings.id,
                threatId: threatAssetMappings.threatId,
                threatName: threats.name,
                assetId: threatAssetMappings.assetId,
                assetName: assets.name,
                impactLevel: threatAssetMappings.impactLevel,
                createdAt: threatAssetMappings.createdAt
            })
                .from(threatAssetMappings)
                .innerJoin(threats, eq(threatAssetMappings.threatId, threats.id))
                .innerJoin(assets, eq(threatAssetMappings.assetId, assets.id))
                .where(and(
                    eq(threatAssetMappings.clientId, input.clientId),
                    eq(threatAssetMappings.status, 'active')
                ))
                .orderBy(desc(threatAssetMappings.createdAt))
                .limit(10);

            return {
                affectedAssetsCount,
                activeThreatsCount,
                byImpactLevel,
                recentMappings
            };
        }),
});
