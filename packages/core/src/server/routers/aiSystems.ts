
import { z } from "zod";
import * as schema from "../../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "../../db";

export const createAiSystemsRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        list: protectedProcedure
            .input(z.object({
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.query.aiSystems.findMany({
                    where: eq(schema.aiSystems.clientId, input.clientId),
                    with: {
                        // We will add the relation in schema if needed, for now just join manually or return raw
                    },
                    orderBy: [desc(schema.aiSystems.createdAt)]
                });
            }),

        create: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string().min(1),
                description: z.string().optional(),
                purpose: z.string().optional(),
                intendedUsers: z.string().optional(),
                deploymentContext: z.string().optional(),
                type: z.string().optional(),
                riskLevel: z.enum(["low", "medium", "high", "critical", "unacceptable"]).optional(),
                status: z.enum(["evaluation", "development", "production", "monitoring", "retired"]).optional(),
                owner: z.string().optional(),
                vendorId: z.number().optional(),
                dataSensitivity: z.string().optional(),
                technicalConstraints: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [newSystem] = await dbConn.insert(schema.aiSystems).values({
                    clientId: input.clientId,
                    name: input.name,
                    description: input.description,
                    purpose: input.purpose,
                    intendedUsers: input.intendedUsers,
                    deploymentContext: input.deploymentContext,
                    type: input.type,
                    riskLevel: input.riskLevel as any,
                    status: input.status as any,
                    owner: input.owner,
                    vendorId: input.vendorId,
                    dataSensitivity: input.dataSensitivity,
                    technicalConstraints: input.technicalConstraints
                }).returning();
                return newSystem;
            }),

        update: protectedProcedure
            .input(z.object({
                id: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                purpose: z.string().optional(),
                status: z.enum(["evaluation", "development", "production", "monitoring", "retired"]).optional(),
                riskLevel: z.enum(["low", "medium", "high", "critical", "unacceptable"]).optional(),
                vendorId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [updated] = await dbConn.update(schema.aiSystems)
                    .set({
                        ...input,
                        updatedAt: new Date()
                    })
                    .where(eq(schema.aiSystems.id, input.id))
                    .returning();
                return updated;
                return updated;
            }),

        delete: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.aiSystems).where(eq(schema.aiSystems.id, input.id));
                return { success: true };
            }),

        getWithAssessments: protectedProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const system = await dbConn.query.aiSystems.findFirst({
                    where: eq(schema.aiSystems.id, input.id),
                });

                if (!system) throw new Error("AI System not found");

                const assessments = await dbConn.query.aiImpactAssessments.findMany({
                    where: eq(schema.aiImpactAssessments.aiSystemId, input.id),
                    orderBy: [desc(schema.aiImpactAssessments.createdAt)]
                });

                let vendor = null;
                if (system.vendorId) {
                    vendor = await dbConn.query.vendors.findFirst({
                        where: eq(schema.vendors.id, system.vendorId)
                    });
                }

                return { ...system, assessments, vendor };
            }),

        addImpactAssessment: protectedProcedure
            .input(z.object({
                aiSystemId: z.number(),
                safetyImpact: z.string().optional(),
                biasImpact: z.string().optional(),
                privacyImpact: z.string().optional(),
                securityImpact: z.string().optional(),
                overallRiskScore: z.number().optional(),
                recommendations: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.insert(schema.aiImpactAssessments).values({
                    aiSystemId: input.aiSystemId,
                    assessorId: ctx.user.id,
                    safetyImpact: input.safetyImpact,
                    biasImpact: input.biasImpact,
                    privacyImpact: input.privacyImpact,
                    securityImpact: input.securityImpact,
                    overallRiskScore: input.overallRiskScore,
                    recommendations: input.recommendations
                }).returning();
                return assessment;
            }),

        mapControl: protectedProcedure
            .input(z.object({
                aiSystemId: z.number(),
                controlId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [mapping] = await dbConn.insert(schema.aiSystemControls).values({
                    aiSystemId: input.aiSystemId,
                    controlId: input.controlId,
                    status: "mapped"
                }).returning();
                return mapping;
            }),

        unmapControl: protectedProcedure
            .input(z.object({
                aiSystemId: z.number(),
                controlId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.aiSystemControls)
                    .where(and(
                        eq(schema.aiSystemControls.aiSystemId, input.aiSystemId),
                        eq(schema.aiSystemControls.controlId, input.controlId)
                    ));
                return { success: true };
            }),

        updateControlStatus: protectedProcedure
            .input(z.object({
                aiSystemId: z.number(),
                controlId: z.number(),
                status: z.string()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.update(schema.aiSystemControls)
                    .set({ status: input.status })
                    .where(and(
                        eq(schema.aiSystemControls.aiSystemId, input.aiSystemId),
                        eq(schema.aiSystemControls.controlId, input.controlId)
                    ));
                return { success: true };
            }),

        getMappedControls: protectedProcedure
            .input(z.object({
                aiSystemId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select({
                    mappingId: schema.aiSystemControls.id,
                    controlId: schema.controls.id,
                    name: schema.controls.name,
                    controlIdString: schema.controls.controlId,
                    framework: schema.controls.framework,
                    status: schema.aiSystemControls.status
                })
                    .from(schema.aiSystemControls)
                    .innerJoin(schema.controls, eq(schema.aiSystemControls.controlId, schema.controls.id))
                    .where(eq(schema.aiSystemControls.aiSystemId, input.aiSystemId));
            }),

        exportModelCard: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const system = await dbConn.query.aiSystems.findFirst({
                    where: eq(schema.aiSystems.id, input.id)
                });

                if (!system) throw new Error("AI System not found");

                const assessments = await dbConn.query.aiImpactAssessments.findMany({
                    where: eq(schema.aiImpactAssessments.aiSystemId, input.id),
                    orderBy: [desc(schema.aiImpactAssessments.createdAt)]
                });

                const controls = await dbConn.select({
                    controlId: schema.controls.controlId,
                    name: schema.controls.name,
                    framework: schema.controls.framework
                })
                    .from(schema.aiSystemControls)
                    .innerJoin(schema.controls, eq(schema.aiSystemControls.controlId, schema.controls.id))
                    .where(eq(schema.aiSystemControls.aiSystemId, input.id));

                // Standardized Model Card Format
                return {
                    version: "1.0",
                    generatedAt: new Date(),
                    modelDetails: {
                        name: system.name,
                        description: system.description,
                        purpose: system.purpose,
                        type: system.type,
                        owner: system.owner,
                        intendedUsers: system.intendedUsers
                    },
                    riskManagement: {
                        overallRiskLevel: system.riskLevel,
                        impactAssessments: assessments.map((a: any) => ({
                            date: a.createdAt,
                            safetyImpact: a.safetyImpact,
                            biasImpact: a.biasImpact,
                            privacyImpact: a.privacyImpact,
                            riskScore: a.overallRiskScore
                        })),
                        complianceMapping: controls
                    },
                    technicalContext: {
                        constraints: system.technicalConstraints || "Not documented",
                        deploymentContext: system.deploymentContext || "Not documented"
                    }
                };
            }),

        getStats: protectedProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Total AI Systems
                const systems = await dbConn.select().from(schema.aiSystems)
                    .where(eq(schema.aiSystems.clientId, input.clientId));

                const totalSystems = systems.length;

                // 2. High Risk Systems
                const highRiskSystems = systems.filter((s: any) =>
                    s.riskLevel === "high" ||
                    s.riskLevel === "critical" ||
                    s.riskLevel === "unacceptable"
                ).length;

                // 3. Active Assessments (total for now)
                const assessmentsResult = await dbConn.select({ count: sql<number>`count(*)` })
                    .from(schema.aiImpactAssessments)
                    .innerJoin(schema.aiSystems, eq(schema.aiImpactAssessments.aiSystemId, schema.aiSystems.id))
                    .where(eq(schema.aiSystems.clientId, input.clientId));

                const totalAssessments = Number(assessmentsResult[0]?.count) || 0;

                // 4. NIST Compliance
                const mappedControlsResult = await dbConn.selectDistinct({ controlId: schema.aiSystemControls.controlId })
                    .from(schema.aiSystemControls)
                    .innerJoin(schema.aiSystems, eq(schema.aiSystemControls.aiSystemId, schema.aiSystems.id))
                    .where(eq(schema.aiSystems.clientId, input.clientId));

                const nistControlsResult = await dbConn.select({ count: sql<number>`count(*)` })
                    .from(schema.controls)
                    .where(eq(schema.controls.framework, "NIST AI RMF"));

                const mappedCount = mappedControlsResult.length;
                const totalNistCount = Number(nistControlsResult[0]?.count) || 72;

                // 5. Category Breakdown for NIST AI RMF
                const nistCategories = ["GOVERN", "MAP", "MEASURE", "MANAGE"];
                const categoryStats = await Promise.all(nistCategories.map(async (cat) => {
                    const totalInCatResult = await dbConn.select({ count: sql<number>`count(*)` })
                        .from(schema.controls)
                        .where(and(
                            eq(schema.controls.framework, "NIST AI RMF"),
                            eq(schema.controls.category, cat)
                        ));

                    const mappedInCatResult = await dbConn.selectDistinct({ controlId: schema.aiSystemControls.controlId })
                        .from(schema.aiSystemControls)
                        .innerJoin(schema.aiSystems, eq(schema.aiSystemControls.aiSystemId, schema.aiSystems.id))
                        .innerJoin(schema.controls, eq(schema.aiSystemControls.controlId, schema.controls.id))
                        .where(and(
                            eq(schema.aiSystems.clientId, input.clientId),
                            eq(schema.controls.framework, "NIST AI RMF"),
                            eq(schema.controls.category, cat)
                        ));

                    const total = Number(totalInCatResult[0]?.count) || 0;
                    const mapped = mappedInCatResult.length;

                    return {
                        category: cat,
                        total,
                        mapped,
                        percentage: total > 0 ? Math.round((mapped / total) * 100) : 0
                    };
                }));

                return {
                    totalSystems,
                    highRiskSystems,
                    totalAssessments,
                    nistCompliance: {
                        percentage: totalNistCount > 0 ? Math.round((mappedCount / totalNistCount) * 100) : 0,
                        mappedCount,
                        totalCount: totalNistCount
                    },
                    categoryBreakdown: categoryStats
                };
            }),

        listAllAssessments: protectedProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select({
                    id: schema.aiImpactAssessments.id,
                    aiSystemId: schema.aiImpactAssessments.aiSystemId,
                    systemName: schema.aiSystems.name,
                    overallRiskScore: schema.aiImpactAssessments.overallRiskScore,
                    createdAt: schema.aiImpactAssessments.createdAt,
                    assessorName: schema.users.name
                })
                    .from(schema.aiImpactAssessments)
                    .innerJoin(schema.aiSystems, eq(schema.aiImpactAssessments.aiSystemId, schema.aiSystems.id))
                    .leftJoin(schema.users, eq(schema.aiImpactAssessments.assessorId, schema.users.id))
                    .where(eq(schema.aiSystems.clientId, input.clientId))
                    .orderBy(desc(schema.aiImpactAssessments.createdAt));
            }),

        downloadAssessmentReport: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const { generateAIImpactAssessmentPdf } = await import('../../lib/reporting');
                const pdfBuffer = await generateAIImpactAssessmentPdf(input.id);
                return {
                    pdfBase64: pdfBuffer.toString('base64'),
                    filename: `AI_Impact_Assessment_${input.id}.pdf`
                };
            })
    });
};

