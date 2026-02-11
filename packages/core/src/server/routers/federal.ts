import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, desc } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export const createFederalRouter = (t: any, clientProcedure: any) => t.router({
    // FIPS 199 Categorization
    getFipsCategorization: clientProcedure
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

    // FIPS Categorization
    getFipsCategorization: clientProcedure
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

    saveFipsCategorization: clientProcedure
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
});
