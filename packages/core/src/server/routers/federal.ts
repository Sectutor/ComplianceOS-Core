import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { llmService } from "../../lib/llm/service";

import { t as tType, clientProcedure as cpType, checkPremiumAccess } from "../trpc";

export const createFederalRouter = (t: typeof tType, clientProcedure: typeof cpType) => {
    // Federal Compliance is a Premium Feature
    const premiumProcedure = clientProcedure.use(checkPremiumAccess);

    return t.router({
        // FIPS 199 Categorization
        getFipsCategorization: premiumProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.fipsCategorizations)
                    .where(eq(schema.fipsCategorizations.clientId, input.clientId))
                    .orderBy(desc(schema.fipsCategorizations.createdAt));
                return results[0] || null; // Return latest
            }),

        saveFipsCategorization: clientProcedure
            .input(z.object({
                clientId: z.number(),
                systemName: z.string().optional(),
                informationTypes: z.array(z.any()).optional(),
                confidentialityImpact: z.string().optional(),
                integrityImpact: z.string().optional(),
                availabilityImpact: z.string().optional(),
                highWaterMark: z.string().optional(),
                status: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [result] = await dbConn.insert(schema.fipsCategorizations).values({
                    ...input,
                    updatedAt: new Date(),
                }).returning();
                return result;
            }),

        // SSP (System Security Plan)
        listSSPs: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.federalSSPs)
                    .where(eq(schema.federalSSPs.clientId, input.clientId))
                    .orderBy(desc(schema.federalSSPs.updatedAt));

                // Normalize content to ensure it's always valid JSON string
                return results.map((ssp: any) => ({
                    ...ssp,
                    content: (ssp.content && ssp.content.trim()) ? ssp.content : '{}'
                }));
            }),

        getSSP: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const [ssp] = await dbConn.select().from(schema.federalSSPs)
                    .where(eq(schema.federalSSPs.id, input.id));

                if (ssp) {
                    ssp.content = (ssp.content && ssp.content.trim()) ? ssp.content : '{}';
                }
                return ssp;
            }),

        createSSP: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                framework: z.string(),
                systemName: z.string().optional(),
                systemType: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [ssp] = await dbConn.insert(schema.federalSSPs).values({
                    ...input,
                    content: '{}',
                    status: 'draft',
                }).returning();
                return ssp;
            }),

        updateSSP: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                content: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [ssp] = await dbConn.update(schema.federalSSPs)
                    .set({
                        content: input.content,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.federalSSPs.id, input.id))
                    .returning();
                return ssp;
            }),

        // SAR (Security Assessment Report)
        listSARs: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalSARs)
                    .where(eq(schema.federalSARs.clientId, input.clientId))
                    .orderBy(desc(schema.federalSARs.updatedAt));
            }),

        createSAR: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number().optional(),
                title: z.string(),
                assessorName: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [sar] = await dbConn.insert(schema.federalSARs).values({
                    ...input,
                    status: 'draft',
                }).returning();
                return sar;
            }),

        updateSAR: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                systemAcronym: z.string().optional(),
                systemIdentification: z.string().optional(),
                systemType: z.string().optional(),
                version: z.string().optional(),
                agency: z.string().optional(),
                assessmentCompletionDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                systemOwnerId: z.number().optional(),
                confidentiality: z.string().optional(),
                integrity: z.string().optional(),
                availability: z.string().optional(),
                impact: z.string().optional(),
                packageType: z.string().optional(),
                executiveSummary: z.string().optional(),
                assessorName: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...rest } = input;
                const updateData: any = { ...rest };

                const parseDate = (d?: string | Date | null) => {
                    if (d instanceof Date) return d;
                    if (!d) return null;
                    if (typeof d === 'string' && d.trim() === "") return null;
                    return new Date(d);
                };

                if (input.assessmentCompletionDate !== undefined) {
                    updateData.assessmentCompletionDate = parseDate(input.assessmentCompletionDate);
                }

                updateData.updatedAt = new Date();

                const [sar] = await dbConn.update(schema.federalSARs)
                    .set(updateData)
                    .where(eq(schema.federalSARs.id, id))
                    .returning();
                return sar;
            }),

        // POA&M
        listPoams: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalPoams)
                    .where(eq(schema.federalPoams.clientId, input.clientId))
                    .orderBy(desc(schema.federalPoams.updatedAt));
            }),

        getPoamWithItems: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const [poam] = await dbConn.select().from(schema.federalPoams)
                    .where(eq(schema.federalPoams.id, input.id));
                if (!poam) return null;

                const items = await dbConn.select({
                    ...schema.poamItems,
                    riskTitle: schema.riskAssessments.title,
                })
                    .from(schema.poamItems)
                    .leftJoin(schema.riskAssessments, eq(schema.poamItems.relatedRiskId, schema.riskAssessments.id))
                    .where(eq(schema.poamItems.poamId, input.id))
                    .orderBy(desc(schema.poamItems.updatedAt));

                return { poam, items };
            }),

        createPoam: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                sourceSspId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [poam] = await dbConn.insert(schema.federalPoams).values({
                    ...input,
                    status: 'active',
                }).returning();
                return poam;
            }),

        addPoamItem: clientProcedure
            .input(z.object({
                clientId: z.number(),
                poamId: z.number(),
                controlId: z.string().optional(),
                weaknessName: z.string(),
                weaknessDescription: z.string().optional(),
                weaknessDetectorSource: z.string().optional(),
                sourceIdentifier: z.string().optional(),
                assetIdentifier: z.string().optional(),
                pointOfContact: z.string().optional(),
                resourcesRequired: z.string().optional(),
                overallRemediationPlan: z.string().optional(),
                assigneeId: z.number().optional(),
                originalDetectionDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                scheduledCompletionDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                status: z.string().optional(),
                statusDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                vendorDependency: z.string().optional(),
                lastVendorCheckinDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                productName: z.string().optional(),
                originalRiskRating: z.string().optional(),
                adjustedRiskRating: z.string().optional(),
                riskAdjustment: z.string().optional(),
                falsePositive: z.boolean().optional(),
                operationalRequirement: z.string().optional(),
                deviationRationale: z.string().optional(),
                comments: z.string().optional(),
                autoApprove: z.boolean().optional(),
                relatedRiskId: z.number().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const values: any = { ...input };

                // Helper to parse dates robustly
                const parseDate = (d?: string | Date | null) => {
                    if (d instanceof Date) return d;
                    if (!d) return null;
                    if (typeof d === 'string' && d.trim() === "") return null;
                    return new Date(d);
                };

                // Convert date strings to Date objects
                values.originalDetectionDate = parseDate(input.originalDetectionDate);
                values.scheduledCompletionDate = parseDate(input.scheduledCompletionDate);
                values.statusDate = parseDate(input.statusDate);
                values.lastVendorCheckinDate = parseDate(input.lastVendorCheckinDate);

                const [item] = await dbConn.insert(schema.poamItems).values(values).returning();
                return item;
            }),

        updatePoamItem: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                controlId: z.string().optional(),
                weaknessName: z.string().optional(),
                weaknessDescription: z.string().optional(),
                weaknessDetectorSource: z.string().optional(),
                sourceIdentifier: z.string().optional(),
                assetIdentifier: z.string().optional(),
                pointOfContact: z.string().optional(),
                resourcesRequired: z.string().optional(),
                overallRemediationPlan: z.string().optional(),
                assigneeId: z.number().optional(),
                originalDetectionDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                scheduledCompletionDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                status: z.string().optional(),
                statusDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                vendorDependency: z.string().optional(),
                lastVendorCheckinDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
                productName: z.string().optional(),
                originalRiskRating: z.string().optional(),
                adjustedRiskRating: z.string().optional(),
                riskAdjustment: z.string().optional(),
                falsePositive: z.boolean().optional(),
                operationalRequirement: z.string().optional(),
                deviationRationale: z.string().optional(),
                comments: z.string().optional(),
                autoApprove: z.boolean().optional(),
                relatedRiskId: z.number().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...rest } = input;
                const updateData: any = { ...rest };

                // Helper to parse dates robustly
                const parseDate = (d?: string | Date | null) => {
                    if (d instanceof Date) return d;
                    if (!d) return null;
                    if (typeof d === 'string' && d.trim() === "") return null;
                    return new Date(d);
                };

                // Convert date strings to Date objects
                if (input.originalDetectionDate !== undefined) updateData.originalDetectionDate = parseDate(input.originalDetectionDate);
                if (input.scheduledCompletionDate !== undefined) updateData.scheduledCompletionDate = parseDate(input.scheduledCompletionDate);
                if (input.statusDate !== undefined) updateData.statusDate = parseDate(input.statusDate);
                if (input.lastVendorCheckinDate !== undefined) updateData.lastVendorCheckinDate = parseDate(input.lastVendorCheckinDate);

                updateData.updatedAt = new Date();

                const [item] = await dbConn.update(schema.poamItems)
                    .set(updateData)
                    .where(eq(schema.poamItems.id, id))
                    .returning();

                if (!item) throw new Error("POA&M item not found");
                return item;
            }),

        exportPoam: clientProcedure
            .input(z.object({
                clientId: z.number(),
                poamId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [poam] = await dbConn.select().from(schema.federalPoams)
                    .where(eq(schema.federalPoams.id, input.poamId));

                if (!poam) throw new Error("POA&M Plan not found");

                const items = await dbConn.select().from(schema.poamItems)
                    .where(eq(schema.poamItems.poamId, input.poamId))
                    .orderBy(desc(schema.poamItems.updatedAt));

                const { generatePoamCsv } = await import("../../lib/csv/generate-poam-csv");
                const csvContent = generatePoamCsv(poam, items);

                return {
                    base64: Buffer.from(csvContent).toString('base64'),
                    filename: `POAM-${poam.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
                };
            }),

        importSamplePoam: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                try {
                    console.log(`[ImportSamplePoam] Starting for clientId: ${input.clientId}`);
                    const dbConn = await getDb();
                    // Use process.cwd() for reliable path resolution in server environment
                    const rootDir = process.cwd();
                    const samplePath = path.join(rootDir, "data", "sample_poam_data.json");

                    console.log(`[ImportSamplePoam] Reading from: ${samplePath}`);

                    // Check if file exists
                    try {
                        await fs.access(samplePath);
                    } catch (e) {
                        console.error(`[ImportSamplePoam] Sample data file not found at: ${samplePath}`);
                        throw new Error(`Sample data file not found`);
                    }

                    const rawData = await fs.readFile(samplePath, "utf-8");
                    const samples = JSON.parse(rawData);
                    console.log(`[ImportSamplePoam] Loaded ${samples.length} samples`);

                    const [poam] = await dbConn.insert(schema.federalPoams).values({
                        clientId: input.clientId,
                        title: "Sample CMMC POA&M (Realistic)",
                        status: 'active',
                        updatedAt: new Date(),
                    }).returning();

                    console.log(`[ImportSamplePoam] Created POAM ${poam.id}`);

                    const itemsToInsert = samples.map((item: any) => ({
                        poamId: poam.id,
                        controlId: item.controlId,
                        weaknessName: item.weaknessName,
                        weaknessDescription: item.weaknessDescription,
                        pointOfContact: item.pointOfContact,
                        scheduledCompletionDate: item.scheduledCompletionDate ? new Date(item.scheduledCompletionDate) : null,
                        status: 'open',
                        updatedAt: new Date(),
                    }));

                    await dbConn.insert(schema.poamItems).values(itemsToInsert);
                    console.log(`[ImportSamplePoam] Inserted ${itemsToInsert.length} items`);

                    return poam;
                } catch (error: any) {
                    console.error("[ImportSamplePoam] FATAL ERROR:", error);
                    throw error;
                }
            }),


        // SSP Sections
        getSspSections: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalSspSections)
                    .where(eq(schema.federalSspSections.sspId, input.sspId));
            }),

        saveSspSection: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number(),
                sectionKey: z.string(),
                content: z.any(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                // Upsert: check if exists
                const existing = await dbConn.select().from(schema.federalSspSections)
                    .where(and(
                        eq(schema.federalSspSections.sspId, input.sspId),
                        eq(schema.federalSspSections.sectionKey, input.sectionKey)
                    ));
                if (existing.length > 0) {
                    await dbConn.update(schema.federalSspSections)
                        .set({ content: input.content, updatedAt: new Date() })
                        .where(eq(schema.federalSspSections.id, existing[0].id));
                    return existing[0];
                } else {
                    const [section] = await dbConn.insert(schema.federalSspSections).values(input).returning();
                    return section;
                }
            }),

        // SSP Controls
        getControlsByFramework: clientProcedure
            .input(z.object({
                clientId: z.number(),
                framework: z.string()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.controls)
                    .where(eq(schema.controls.framework, input.framework))
                    .orderBy(schema.controls.controlId);
            }),

        createControl: clientProcedure
            .input(z.object({
                controlId: z.string(),
                name: z.string(),
                description: z.string().optional(),
                framework: z.string(),
                category: z.string().optional(),
                owner: z.string().optional(),
                frequency: z.string().optional(),
                clientId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [control] = await dbConn.insert(schema.controls).values(input).returning();
                return control;
            }),

        getSspControls: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalSspControls)
                    .where(eq(schema.federalSspControls.sspId, input.sspId));
            }),

        saveSspControl: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number(),
                controlId: z.string(),
                implementationStatus: z.string().optional(),
                implementationDescription: z.string().optional(),
                responsibleRole: z.string().optional(),
                evidenceLinks: z.array(z.object({
                    id: z.string().optional(),
                    url: z.string().optional(),
                    name: z.string(),
                    type: z.enum(['link', 'file']).optional()
                })).optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const existing = await dbConn.select().from(schema.federalSspControls)
                    .where(and(
                        eq(schema.federalSspControls.sspId, input.sspId),
                        eq(schema.federalSspControls.controlId, input.controlId)
                    ));
                if (existing.length > 0) {
                    await dbConn.update(schema.federalSspControls)
                        .set({
                            implementationStatus: input.implementationStatus,
                            implementationDescription: input.implementationDescription,
                            responsibleRole: input.responsibleRole,
                            evidenceLinks: input.evidenceLinks,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.federalSspControls.id, existing[0].id));
                    return existing[0];
                } else {
                    const [ctrl] = await dbConn.insert(schema.federalSspControls).values(input).returning();
                    return ctrl;
                }
            }),

        // SSP-linked FIPS Categorization
        getSspFipsCategorization: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const [cat] = await dbConn.select().from(schema.federalFipsCategorizations)
                    .where(eq(schema.federalFipsCategorizations.sspId, input.sspId));
                return cat || null;
            }),

        saveSspFipsCategorization: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number(),
                securityObjectiveConfidentiality: z.string().optional(),
                securityObjectiveIntegrity: z.string().optional(),
                securityObjectiveAvailability: z.string().optional(),
                rationaleConfidentiality: z.string().optional(),
                rationaleIntegrity: z.string().optional(),
                rationaleAvailability: z.string().optional(),
                informationTypes: z.array(z.object({
                    type: z.string(),
                    impact: z.enum(['low', 'moderate', 'high']),
                    description: z.string().optional()
                })).optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const existing = await dbConn.select().from(schema.federalFipsCategorizations)
                    .where(eq(schema.federalFipsCategorizations.sspId, input.sspId));

                if (existing.length > 0) {
                    await dbConn.update(schema.federalFipsCategorizations)
                        .set({
                            ...input,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.federalFipsCategorizations.id, existing[0].id));
                    return existing[0];
                } else {
                    const [cat] = await dbConn.insert(schema.federalFipsCategorizations)
                        .values(input)
                        .returning();
                    return cat;
                }
            }),

        deleteSspControl: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number(),
                controlId: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.federalSspControls)
                    .where(and(
                        eq(schema.federalSspControls.sspId, input.sspId),
                        eq(schema.federalSspControls.controlId, input.controlId)
                    ));
                return { success: true };
            }),

        // Sync SSP to POA&M
        syncSspToPoam: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Get SSP details to find/create POA&M
                const [ssp] = await dbConn.select().from(schema.federalSSPs).where(eq(schema.federalSSPs.id, input.sspId));
                if (!ssp) throw new Error("SSP not found");

                // 2. Find or create a POA&M for this SSP
                let poamId: number;
                const existingPoams = await dbConn.select().from(schema.federalPoams)
                    .where(and(
                        eq(schema.federalPoams.clientId, input.clientId),
                        eq(schema.federalPoams.title, `${ssp.framework} - Remediation Plan`)
                    ))
                    .limit(1);

                if (existingPoams.length > 0) {
                    poamId = existingPoams[0].id;
                } else {
                    const [newPoam] = await dbConn.insert(schema.federalPoams).values({
                        clientId: input.clientId,
                        title: `${ssp.framework} - Remediation Plan`,
                        status: 'active',
                        updatedAt: new Date()
                    }).returning();
                    poamId = newPoam.id;
                }

                // 3. Get non-compliant SSP controls
                const controls = await dbConn.select().from(schema.federalSspControls)
                    .where(and(
                        eq(schema.federalSspControls.sspId, input.sspId)
                    ));

                const gaps = controls.filter((c: any) =>
                    c.implementationStatus === 'planned' ||
                    c.implementationStatus === 'partial' ||
                    c.implementationStatus === 'not_implemented'
                );

                // 4. Insert into POA&M if not exists
                let addedCount = 0;
                for (const gap of gaps) {
                    const existingItem = await dbConn.select().from(schema.poamItems)
                        .where(and(
                            eq(schema.poamItems.poamId, poamId),
                            eq(schema.poamItems.controlId, gap.controlId)
                        ))
                        .limit(1);

                    if (existingItem.length === 0) {
                        await dbConn.insert(schema.poamItems).values({
                            poamId,
                            controlId: gap.controlId,
                            weaknessName: `Control ${gap.controlId} is ${gap.implementationStatus}`,
                            weaknessDescription: gap.implementationDescription || "No implementation details provided.",
                            status: 'open',
                            originalDetectionDate: new Date(),
                            originalRiskRating: 'moderate',
                            updatedAt: new Date()
                        });
                        addedCount++;
                    }
                }

                return { success: true, addedCount, poamId };
            }),

        // SAR Findings
        getSarFindings: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sarId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalSarFindings)
                    .where(eq(schema.federalSarFindings.sarId, input.sarId));
            }),

        saveSarFinding: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sarId: z.number(),
                controlId: z.string(),
                result: z.string().optional(),
                observation: z.string().optional(),
                riskLevel: z.string().optional(),
                remediationPlan: z.string().optional(),
                overlay: z.string().optional(),
                naJustification: z.string().optional(),
                vulnerabilitySummary: z.string().optional(),
                vulnerabilitySeverity: z.string().optional(),
                residualRiskLevel: z.string().optional(),
                recommendations: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const existing = await dbConn.select().from(schema.federalSarFindings)
                    .where(and(
                        eq(schema.federalSarFindings.sarId, input.sarId),
                        eq(schema.federalSarFindings.controlId, input.controlId)
                    ));
                if (existing.length > 0) {
                    await dbConn.update(schema.federalSarFindings)
                        .set({
                            result: input.result,
                            observation: input.observation,
                            riskLevel: input.riskLevel,
                            remediationPlan: input.remediationPlan,
                            overlay: input.overlay,
                            naJustification: input.naJustification,
                            vulnerabilitySummary: input.vulnerabilitySummary,
                            vulnerabilitySeverity: input.vulnerabilitySeverity,
                            residualRiskLevel: input.residualRiskLevel,
                            recommendations: input.recommendations,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.federalSarFindings.id, existing[0].id));
                    return existing[0];
                } else {
                    const [finding] = await dbConn.insert(schema.federalSarFindings).values(input).returning();
                    return finding;
                }
            }),

        // FedRAMP Packages
        listFedrampPackages: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalFedrampPackages)
                    .where(eq(schema.federalFedrampPackages.clientId, input.clientId))
                    .orderBy(desc(schema.federalFedrampPackages.updatedAt));
            }),

        getFedrampPackage: clientProcedure
            .input(z.object({ clientId: z.number(), packageId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.federalFedrampPackages)
                    .where(and(
                        eq(schema.federalFedrampPackages.clientId, input.clientId),
                        eq(schema.federalFedrampPackages.id, input.packageId)
                    ));
                return results[0] || null;
            }),

        deleteFedrampPackage: clientProcedure
            .input(z.object({ clientId: z.number(), packageId: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Delete associated assessments
                await dbConn.delete(schema.federalNist80053Assessments)
                    .where(and(
                        eq(schema.federalNist80053Assessments.clientId, input.clientId),
                        eq(schema.federalNist80053Assessments.sspId, input.packageId)
                    ));

                // 2. Delete associated SARs and their findings
                const sars = await dbConn.select({ id: schema.federalSARs.id })
                    .from(schema.federalSARs)
                    .where(and(
                        eq(schema.federalSARs.clientId, input.clientId),
                        eq(schema.federalSARs.sspId, input.packageId)
                    ));

                if (sars.length > 0) {
                    const sarIds = sars.map((s: { id: number }) => s.id);
                    // Findings linked to these SARs
                    await dbConn.delete(schema.federalSarFindings)
                        .where(inArray(schema.federalSarFindings.sarId, sarIds));

                    // Then the SARs themselves
                    await dbConn.delete(schema.federalSARs)
                        .where(inArray(schema.federalSARs.id, sarIds));
                }

                // 3. Delete associated POA&Ms
                await dbConn.delete(schema.federalPoams)
                    .where(and(
                        eq(schema.federalPoams.clientId, input.clientId),
                        eq(schema.federalPoams.sourceSspId, input.packageId)
                    ));

                // 4. Finally delete the package
                const [deleted] = await dbConn.delete(schema.federalFedrampPackages)
                    .where(and(
                        eq(schema.federalFedrampPackages.clientId, input.clientId),
                        eq(schema.federalFedrampPackages.id, input.packageId)
                    ))
                    .returning();

                return deleted;
            }),

        createFedrampPackage: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                impactLevel: z.string().optional(),
                authorizationType: z.string().optional(),
                agencyName: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [pkg] = await dbConn.insert(schema.federalFedrampPackages).values({
                    ...input,
                    provisioningStatus: 'In-Process',
                }).returning();
                return pkg;
            }),

        updateFedrampPackage: clientProcedure
            .input(z.object({
                clientId: z.number(),
                packageId: z.number(),
                title: z.string().optional(),
                impactLevel: z.string().optional(),
                authorizationType: z.string().optional(),
                agencyName: z.string().optional(),
                provisioningStatus: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { clientId, packageId, ...updates } = input;
                const [pkg] = await dbConn.update(schema.federalFedrampPackages)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(and(
                        eq(schema.federalFedrampPackages.clientId, clientId),
                        eq(schema.federalFedrampPackages.id, packageId)
                    ))
                    .returning();
                return pkg;
            }),

        // SAR Findings Management
        listPackageSarFindings: clientProcedure
            .input(z.object({ clientId: z.number(), packageId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                // Get SARs for this package
                const sars = await dbConn.select().from(schema.federalSARs)
                    .where(and(
                        eq(schema.federalSARs.clientId, input.clientId),
                        eq(schema.federalSARs.sspId, input.packageId)
                    ));

                if (sars.length === 0) return [];

                const sarIds = sars.map((s: { id: number }) => s.id);
                return await dbConn.select().from(schema.federalSarFindings)
                    .where(inArray(schema.federalSarFindings.sarId, sarIds));
            }),

        // POA&M Management
        listPackagePoams: clientProcedure
            .input(z.object({ clientId: z.number(), packageId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const poams = await dbConn.select().from(schema.federalPoams)
                    .where(and(
                        eq(schema.federalPoams.clientId, input.clientId),
                        eq(schema.federalPoams.sourceSspId, input.packageId)
                    ));

                if (poams.length === 0) return [];

                const poamIds = poams.map((p: { id: number }) => p.id);
                return await dbConn.select().from(schema.poamItems)
                    .where(inArray(schema.poamItems.poamId, poamIds));
            }),

        // Partner Inheritance (Real Implementation)
        getInheritances: clientProcedure
            .input(z.object({ clientId: z.number(), packageId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalInheritances)
                    .where(and(
                        eq(schema.federalInheritances.clientId, input.clientId),
                        eq(schema.federalInheritances.packageId, input.packageId)
                    ))
                    .orderBy(desc(schema.federalInheritances.updatedAt));
            }),

        createInheritance: clientProcedure
            .input(z.object({
                clientId: z.number(),
                packageId: z.number(),
                partnerName: z.string(),
                controlId: z.string(),
                description: z.string().optional(),
                status: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [inh] = await dbConn.insert(schema.federalInheritances).values({
                    ...input,
                    updatedAt: new Date(),
                }).returning();
                return inh;
            }),

        updateInheritance: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                partnerName: z.string().optional(),
                controlId: z.string().optional(),
                description: z.string().optional(),
                status: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...updates } = input;
                const [inh] = await dbConn.update(schema.federalInheritances)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(and(
                        eq(schema.federalInheritances.id, id),
                        eq(schema.federalInheritances.clientId, input.clientId)
                    ))
                    .returning();
                return inh;
            }),

        deleteInheritance: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.federalInheritances)
                    .where(and(
                        eq(schema.federalInheritances.id, input.id),
                        eq(schema.federalInheritances.clientId, input.clientId)
                    ));
                return { success: true };
            }),

        // RMF Workflows
        listRmfWorkflows: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalRmfWorkflows)
                    .where(eq(schema.federalRmfWorkflows.clientId, input.clientId))
                    .orderBy(desc(schema.federalRmfWorkflows.updatedAt));
            }),

        createRmfWorkflow: clientProcedure
            .input(z.object({
                clientId: z.number(),
                systemName: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [workflow] = await dbConn.insert(schema.federalRmfWorkflows).values({
                    ...input,
                    currentStep: 1,
                    stepStatus: {
                        1: 'in_progress',
                        2: 'not_started',
                        3: 'not_started',
                        4: 'not_started',
                        5: 'not_started',
                        6: 'not_started',
                        7: 'not_started'
                    },
                }).returning();
                return workflow;
            }),

        updateRmfStep: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                step: z.number(),
                status: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.federalRmfWorkflows)
                    .where(eq(schema.federalRmfWorkflows.id, input.id));

                const existing = results[0];
                if (!existing) throw new Error("Workflow not found");

                const newStatus = { ...(existing.stepStatus as any), [input.step]: input.status };
                const [updated] = await dbConn.update(schema.federalRmfWorkflows)
                    .set({
                        stepStatus: newStatus,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.federalRmfWorkflows.id, input.id))
                    .returning();
                return updated;
            }),

        deleteRmfWorkflow: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                // Delete associated assessments
                await dbConn.delete(schema.federalNist80053Assessments)
                    .where(and(
                        eq(schema.federalNist80053Assessments.clientId, input.clientId),
                        eq(schema.federalNist80053Assessments.rmfWorkflowId, input.id)
                    ));

                // Delete the workflow
                const [deleted] = await dbConn.delete(schema.federalRmfWorkflows)
                    .where(and(
                        eq(schema.federalRmfWorkflows.clientId, input.clientId),
                        eq(schema.federalRmfWorkflows.id, input.id)
                    ))
                    .returning();
                return deleted;
            }),

        // DFARS / SPRS Scoring
        listSprsAssessments: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalSprsAssessments)
                    .where(eq(schema.federalSprsAssessments.clientId, input.clientId))
                    .orderBy(desc(schema.federalSprsAssessments.updatedAt));
            }),

        createSprsAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                scopeDescription: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.insert(schema.federalSprsAssessments).values({
                    ...input,
                    score: 110, // Start with perfect score
                    status: 'Active',
                    assessmentDate: new Date(),
                }).returning();
                return assessment;
            }),

        deleteSprsAssessment: clientProcedure
            .input(z.object({ clientId: z.number(), assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                // Delete associated controls first
                await dbConn.delete(schema.federalNist80053Assessments)
                    .where(and(
                        eq(schema.federalNist80053Assessments.clientId, input.clientId),
                        eq(schema.federalNist80053Assessments.sprsAssessmentId, input.assessmentId)
                    ));

                // Delete the assessment
                const [deleted] = await dbConn.delete(schema.federalSprsAssessments)
                    .where(and(
                        eq(schema.federalSprsAssessments.clientId, input.clientId),
                        eq(schema.federalSprsAssessments.id, input.assessmentId)
                    ))
                    .returning();
                return deleted;
            }),

        updateSprsScore: clientProcedure
            .input(z.object({ clientId: z.number(), assessmentId: z.number(), score: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [updated] = await dbConn.update(schema.federalSprsAssessments)
                    .set({
                        score: input.score,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(schema.federalSprsAssessments.clientId, input.clientId),
                        eq(schema.federalSprsAssessments.id, input.assessmentId)
                    ))
                    .returning();
                return updated;
            }),

        // FISMA Systems Management
        listFismaSystems: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalFismaSystems)
                    .where(eq(schema.federalFismaSystems.clientId, input.clientId))
                    .orderBy(desc(schema.federalFismaSystems.updatedAt));
            }),

        createFismaSystem: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                fips199Overall: z.string().optional(),
                description: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [system] = await dbConn.insert(schema.federalFismaSystems).values({
                    ...input,
                    status: 'Active',
                }).returning();
                return system;
            }),

        deleteFismaSystem: clientProcedure
            .input(z.object({ clientId: z.number(), systemId: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                // Delete associated assessments
                await dbConn.delete(schema.federalNist80053Assessments)
                    .where(and(
                        eq(schema.federalNist80053Assessments.clientId, input.clientId),
                        eq(schema.federalNist80053Assessments.fismaSystemId, input.systemId)
                    ));

                // Delete the system
                const [deleted] = await dbConn.delete(schema.federalFismaSystems)
                    .where(and(
                        eq(schema.federalFismaSystems.clientId, input.clientId),
                        eq(schema.federalFismaSystems.id, input.systemId)
                    ))
                    .returning();
                return deleted;
            }),

        // FISMA Reporting
        listFismaReports: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalFismaReports)
                    .where(eq(schema.federalFismaReports.clientId, input.clientId))
                    .orderBy(desc(schema.federalFismaReports.updatedAt));
            }),

        // NIST 800-53
        getNist80053Assessments: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number().optional(),
                fismaSystemId: z.number().optional(),
                sprsAssessmentId: z.number().optional(),
                rmfWorkflowId: z.number().optional(),
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                let query: any = dbConn.select().from(schema.federalNist80053Assessments)
                    .where(eq(schema.federalNist80053Assessments.clientId, input.clientId));

                if (input.sspId) {
                    query = query.where(eq(schema.federalNist80053Assessments.sspId, input.sspId));
                }
                if (input.fismaSystemId) {
                    query = query.where(eq(schema.federalNist80053Assessments.fismaSystemId, input.fismaSystemId));
                }
                if (input.sprsAssessmentId) {
                    query = query.where(eq(schema.federalNist80053Assessments.sprsAssessmentId, input.sprsAssessmentId));
                }
                if (input.rmfWorkflowId) {
                    query = query.where(eq(schema.federalNist80053Assessments.rmfWorkflowId, input.rmfWorkflowId));
                }

                return await query;
            }),

        saveNist80053Assessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number().optional(),
                fismaSystemId: z.number().optional(),
                sprsAssessmentId: z.number().optional(),
                rmfWorkflowId: z.number().optional(),
                controlId: z.string(),
                implementationStatus: z.string().optional(),
                implementationDescription: z.string().optional(),
                testResults: z.string().optional(),
                complianceStatus: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                const conditions = [
                    eq(schema.federalNist80053Assessments.clientId, input.clientId),
                    eq(schema.federalNist80053Assessments.controlId, input.controlId),
                ];

                if (input.sspId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sspId, input.sspId));
                } else if (input.fismaSystemId) {
                    conditions.push(eq(schema.federalNist80053Assessments.fismaSystemId, input.fismaSystemId));
                } else if (input.sprsAssessmentId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sprsAssessmentId, input.sprsAssessmentId));
                } else if (input.rmfWorkflowId) {
                    conditions.push(eq(schema.federalNist80053Assessments.rmfWorkflowId, input.rmfWorkflowId));
                }

                const existing = await dbConn.select().from(schema.federalNist80053Assessments)
                    .where(and(...conditions));

                if (existing.length > 0) {
                    const [updated] = await dbConn.update(schema.federalNist80053Assessments)
                        .set({
                            ...input,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.federalNist80053Assessments.id, existing[0].id))
                        .returning();
                    return updated;
                } else {
                    const [created] = await dbConn.insert(schema.federalNist80053Assessments).values({
                        ...input,
                    }).returning();
                    return created;
                }
            }),

        // DISA STIGs
        listDisaStigChecklists: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalDisaStigChecklists)
                    .where(eq(schema.federalDisaStigChecklists.clientId, input.clientId))
                    .orderBy(desc(schema.federalDisaStigChecklists.updatedAt));
            }),

        getDisaStigChecklist: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.federalDisaStigChecklists)
                    .where(and(
                        eq(schema.federalDisaStigChecklists.clientId, input.clientId),
                        eq(schema.federalDisaStigChecklists.id, input.id)
                    ));
                return results[0];
            }),

        createDisaStigChecklist: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                category: z.string().optional(),
                assetIdentifier: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [checklist] = await dbConn.insert(schema.federalDisaStigChecklists).values({
                    ...input,
                    overallStatus: 'Pending',
                }).returning();
                return checklist;
            }),

        deleteDisaStigChecklist: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                // Delete items first
                await dbConn.delete(schema.federalDisaStigItems)
                    .where(eq(schema.federalDisaStigItems.checklistId, input.id));

                // Delete checklist
                const [deleted] = await dbConn.delete(schema.federalDisaStigChecklists)
                    .where(and(
                        eq(schema.federalDisaStigChecklists.clientId, input.clientId),
                        eq(schema.federalDisaStigChecklists.id, input.id)
                    ))
                    .returning();
                return deleted;
            }),

        // STIG Items
        listDisaStigItems: clientProcedure
            .input(z.object({ checklistId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.federalDisaStigItems)
                    .where(eq(schema.federalDisaStigItems.checklistId, input.checklistId))
                    .orderBy(schema.federalDisaStigItems.ruleId);
            }),

        updateDisaStigItem: clientProcedure
            .input(z.object({
                id: z.number(),
                status: z.string().optional(),
                comments: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [updated] = await dbConn.update(schema.federalDisaStigItems)
                    .set({
                        status: input.status,
                        comments: input.comments,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.federalDisaStigItems.id, input.id))
                    .returning();
                return updated;
            }),

        createDisaStigItem: clientProcedure
            .input(z.object({
                checklistId: z.number(),
                ruleId: z.string(),
                title: z.string(),
                description: z.string().optional(),
                severity: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [item] = await dbConn.insert(schema.federalDisaStigItems)
                    .values({
                        checklistId: input.checklistId,
                        ruleId: input.ruleId,
                        title: input.title,
                        description: input.description,
                        severity: input.severity,
                        status: "Open",
                    })
                    .returning();
                return item;
            }),

        // FIPS 140 Tracking
        listFips140Modules: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const modules = await dbConn.select().from(schema.federalFips140Modules)
                    .where(eq(schema.federalFips140Modules.clientId, input.clientId))
                    .orderBy(desc(schema.federalFips140Modules.updatedAt));

                // Fetch assets for these modules
                const moduleIds = modules.map((m: any) => m.id);
                if (moduleIds.length === 0) return [];

                const linkedAssets = await dbConn.select({
                    fipsModuleId: schema.federalFips140ModuleAssets.fipsModuleId,
                    assetId: schema.assets.id,
                    assetName: schema.assets.name,
                    assetType: schema.assets.type
                })
                    .from(schema.federalFips140ModuleAssets)
                    .leftJoin(schema.assets, eq(schema.federalFips140ModuleAssets.assetId, schema.assets.id))
                    .where(inArray(schema.federalFips140ModuleAssets.fipsModuleId, moduleIds));

                // Group assets by module
                const assetsByModule = linkedAssets.reduce((acc: any, curr: any) => {
                    if (!acc[curr.fipsModuleId]) acc[curr.fipsModuleId] = [];
                    if (curr.assetId) {
                        acc[curr.fipsModuleId].push({
                            id: curr.assetId,
                            name: curr.assetName,
                            type: curr.assetType
                        });
                    }
                    return acc;
                }, {});

                return modules.map((m: any) => ({
                    ...m,
                    assets: assetsByModule[m.id] || []
                }));
            }),

        createFips140Module: clientProcedure
            .input(z.object({
                clientId: z.number(),
                moduleName: z.string(),
                vendor: z.string().optional(),
                certificateNumber: z.string().optional(),
                validationLevel: z.string().optional(),
                validationVersion: z.string().optional(),
                assetIds: z.array(z.number()).optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { assetIds, ...rest } = input;

                const [mod] = await dbConn.insert(schema.federalFips140Modules).values({
                    ...rest,
                    status: 'Active',
                }).returning();

                if (assetIds && assetIds.length > 0) {
                    await dbConn.insert(schema.federalFips140ModuleAssets).values(
                        assetIds.map((assetId: number) => ({
                            fipsModuleId: mod.id,
                            assetId
                        }))
                    );
                }

                return mod;
            }),

        updateFips140Module: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                moduleName: z.string().optional(),
                vendor: z.string().optional(),
                certificateNumber: z.string().optional(),
                validationLevel: z.string().optional(),
                validationVersion: z.string().optional(),
                status: z.string().optional(),
                assetIds: z.array(z.number()).optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, assetIds, ...updates } = input;

                const [mod] = await dbConn.update(schema.federalFips140Modules)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(and(
                        eq(schema.federalFips140Modules.id, id),
                        eq(schema.federalFips140Modules.clientId, input.clientId)
                    ))
                    .returning();

                if (assetIds !== undefined) {
                    // Sync assets: Delete existing, Insert new
                    await dbConn.delete(schema.federalFips140ModuleAssets)
                        .where(eq(schema.federalFips140ModuleAssets.fipsModuleId, id));

                    if (assetIds.length > 0) {
                        await dbConn.insert(schema.federalFips140ModuleAssets).values(
                            assetIds.map((assetId: number) => ({
                                fipsModuleId: id,
                                assetId
                            }))
                        );
                    }
                }

                return mod;
            }),

        deleteFips140Module: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [deleted] = await dbConn.delete(schema.federalFips140Modules)
                    .where(and(
                        eq(schema.federalFips140Modules.clientId, input.clientId),
                        eq(schema.federalFips140Modules.id, input.id)
                    ))
                    .returning();
                return deleted;
            }),

        // AI Guidance for NIST 800-53
        generateNist80053Guidance: clientProcedure
            .input(z.object({
                clientId: z.number(),
                controlId: z.string(),
                controlTitle: z.string(),
                controlDescription: z.string().optional(),
                bypassCache: z.boolean().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                // 1. Check for cached global guidance first unless bypassCache is requested
                if (!input.bypassCache) {
                    const [existingControl] = await dbConn.select({
                        aiGuidance: schema.controls.aiGuidance,
                        id: schema.controls.id
                    })
                        .from(schema.controls)
                        .where(and(
                            eq(schema.controls.controlId, input.controlId),
                            eq(schema.controls.framework, "NIST SP 800-53 Rev 5")
                        ))
                        .limit(1);

                    if (existingControl?.aiGuidance) {
                        console.log(`[FederalRouter] Returning cached AI guidance for ${input.controlId}`);
                        return { guidance: existingControl.aiGuidance };
                    }
                }

                // 2. Fetch client context for high-quality generation if cache is empty
                const [client] = await dbConn.select().from(schema.clients).where(eq(schema.clients.id, input.clientId));
                const clientContext = client ? ` for ${client.name} (Industry: ${client.industry || 'General'}, Size: ${client.size || 'Unknown'})` : "";

                const systemPrompt = `You are a NIST 800-53 Compliance Expert${clientContext}. Provide concise, actionable implementation guidance for the specified control. Focus on modern, cloud-native best practices where applicable. Keep the guidance relatively general so it can be useful for others, but use the provided context to ensure practical depth.`;
                const userPrompt = `Control: ${input.controlId} - ${input.controlTitle}\nDescription: ${input.controlDescription}\n\nProvide:\n1. Implementation Guidance (Practical steps)\n2. Evidence Artifacts (What to collect)\n3. Common Pitfalls`;

                const response = await llmService.generate({
                    systemPrompt,
                    userPrompt,
                    feature: 'compliance_guidance',
                    temperature: 0.3,
                }, { clientId: input.clientId, userId: ctx?.user?.id || 0, endpoint: 'generateNist80053Guidance' });

                if (!response || !response.text) {
                    throw new Error("Empty response from AI service");
                }

                // 3. Save result back to global cache in the controls table
                try {
                    await dbConn.update(schema.controls)
                        .set({ aiGuidance: response.text })
                        .where(and(
                            eq(schema.controls.controlId, input.controlId),
                            eq(schema.controls.framework, "NIST SP 800-53 Rev 5")
                        ));
                    console.log(`[FederalRouter] Cached new AI guidance for ${input.controlId}`);
                } catch (cacheError) {
                    console.error("[FederalRouter] Failed to cache AI guidance:", cacheError);
                    // Continue returning the guidance even if caching fails
                }

                return { guidance: response.text };
            }),

        // Export NIST 800-53 Package
        exportNist80053Package: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number().optional(),
                fismaSystemId: z.number().optional(),
                sprsAssessmentId: z.number().optional(),
                rmfWorkflowId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                const conditions = [
                    eq(schema.federalNist80053Assessments.clientId, input.clientId)
                ];

                if (input.sspId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sspId, input.sspId));
                }
                if (input.fismaSystemId) {
                    conditions.push(eq(schema.federalNist80053Assessments.fismaSystemId, input.fismaSystemId));
                }
                if (input.sprsAssessmentId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sprsAssessmentId, input.sprsAssessmentId));
                }
                if (input.rmfWorkflowId) {
                    conditions.push(eq(schema.federalNist80053Assessments.rmfWorkflowId, input.rmfWorkflowId));
                }

                // Fetch assessments and join with controls to get names
                const assessments = await dbConn.select({
                    controlId: schema.federalNist80053Assessments.controlId,
                    implementationStatus: schema.federalNist80053Assessments.implementationStatus,
                    complianceStatus: schema.federalNist80053Assessments.complianceStatus,
                    implementationDescription: schema.federalNist80053Assessments.implementationDescription,
                    testResults: schema.federalNist80053Assessments.testResults,
                    updatedAt: schema.federalNist80053Assessments.updatedAt,
                    controlName: schema.controls.name
                })
                    .from(schema.federalNist80053Assessments)
                    .leftJoin(schema.controls, and(
                        eq(schema.federalNist80053Assessments.controlId, schema.controls.controlId),
                        eq(schema.controls.framework, "NIST SP 800-53 Rev 5")
                    ))
                    .where(and(...conditions));

                // Generate CSV
                const headers = ["Control ID", "Control Name", "Implementation Status", "Compliance Status", "Description", "Test Results", "Updated At"];
                const rows = assessments.map((a: any) => [
                    a.controlId,
                    `"${(a.controlName || "").replace(/"/g, '""')}"`,
                    a.implementationStatus || "Not Started",
                    a.complianceStatus || "Unknown",
                    `"${(a.implementationDescription || "").replace(/"/g, '""')}"`,
                    `"${(a.testResults || "").replace(/"/g, '""')}"`,
                    a.updatedAt ? new Date(a.updatedAt).toISOString() : ""
                ]);

                const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

                return {
                    filename: `NIST_800-53_Assessment_${new Date().toISOString().split('T')[0]}.csv`,
                    base64: Buffer.from(csvContent).toString('base64')
                };
            }),

        getNonCompliantMetrics: clientProcedure
            .input(z.object({
                clientId: z.number(),
                sspId: z.number().optional(),
                fismaSystemId: z.number().optional(),
                sprsAssessmentId: z.number().optional(),
                rmfWorkflowId: z.number().optional(),
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const conditions = [eq(schema.federalNist80053Assessments.clientId, input.clientId)];
                if (input.sspId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sspId, input.sspId));
                }
                if (input.fismaSystemId) {
                    conditions.push(eq(schema.federalNist80053Assessments.fismaSystemId, input.fismaSystemId));
                }
                if (input.sprsAssessmentId) {
                    conditions.push(eq(schema.federalNist80053Assessments.sprsAssessmentId, input.sprsAssessmentId));
                }
                if (input.rmfWorkflowId) {
                    conditions.push(eq(schema.federalNist80053Assessments.rmfWorkflowId, input.rmfWorkflowId));
                }

                const assessments = await dbConn.select()
                    .from(schema.federalNist80053Assessments)
                    .where(and(...conditions));

                const nonCompliant = assessments.filter((a: any) => a.complianceStatus === 'Non-Compliant');
                const partial = assessments.filter((a: any) => a.complianceStatus === 'Partial');
                const compliant = assessments.filter((a: any) => a.complianceStatus === 'Compliant');

                // Group by family (optional, but good for reporting)
                const familySummary: Record<string, { total: number, nonCompliant: number, partial: number }> = {};

                nonCompliant.concat(partial).forEach((a: any) => {
                    const familyPrefix = a.controlId.split('-')[0];
                    if (!familySummary[familyPrefix]) {
                        familySummary[familyPrefix] = { total: 0, nonCompliant: 0, partial: 0 };
                    }
                    familySummary[familyPrefix].total++;
                    if (a.complianceStatus === 'Non-Compliant') familySummary[familyPrefix].nonCompliant++;
                    if (a.complianceStatus === 'Partial') familySummary[familyPrefix].partial++;
                });

                return {
                    summary: {
                        nonCompliant: nonCompliant.length,
                        partial: partial.length,
                        compliant: compliant.length,
                        totalAssessments: assessments.length
                    },
                    familySummary: Object.entries(familySummary).map(([family, stats]) => ({
                        family,
                        ...stats
                    })).sort((a, b) => b.nonCompliant - a.nonCompliant),
                    recentWeaknesses: assessments
                        .filter((a: any) => a.complianceStatus === 'Non-Compliant' || a.complianceStatus === 'Partial')
                        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .slice(0, 5)
                };
            }),
    });
