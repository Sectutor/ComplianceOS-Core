
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { logActivity } from "../../lib/audit";
import * as schema from "../../schema";
import { projects, riskScenarios, threatModels, projectComplianceMappings } from "../../schema";

export const createProjectsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const result = await db.select({
                    ...projects,
                    riskCount: sql<number>`count(DISTINCT ${riskScenarios.id})`.mapWith(Number),
                    threatModelCount: sql<number>`count(DISTINCT ${threatModels.id})`.mapWith(Number),
                })
                    .from(projects)
                    .leftJoin(riskScenarios, eq(riskScenarios.projectId, projects.id))
                    .leftJoin(threatModels, eq(threatModels.projectId, projects.id))
                    .where(eq(projects.clientId, input.clientId))
                    .groupBy(projects.id)
                    .orderBy(desc(projects.updatedAt));

                return result;
            }),

        get: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [project] = await db.select()
                    .from(projects)
                    .where(and(eq(projects.id, input.id), eq(projects.clientId, input.clientId)));

                if (!project) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
                }

                return project;
            }),

        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string().min(1),
                description: z.string().optional(),
                projectType: z.enum(["it", "ai", "infra", "privacy"]).default("it"),
                owner: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                securityCriticality: z.enum(["low", "medium", "high", "critical"]).default("medium"),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                console.log("[ProjectsRouter] Creating project with input:", JSON.stringify(input, null, 2));

                try {
                    const [newProject] = await db.insert(projects)
                        .values({
                            ...input,
                            startDate: input.startDate ? new Date(input.startDate) : null,
                            endDate: input.endDate ? new Date(input.endDate) : null,
                        } as any)
                        .returning();

                    console.log("[ProjectsRouter] Project created successfully:", newProject.id);

                    await logActivity({
                        userId: ctx.user.id,
                        clientId: input.clientId,
                        action: "create",
                        entityType: "project",
                        entityId: newProject.id,
                        details: { name: newProject.name, type: newProject.projectType }
                    });

                    return newProject;
                } catch (error: any) {
                    console.error("[ProjectsRouter] FATAL ERROR creating project:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to create project: ${error.message || 'Unknown error'}`
                    });
                }
            }),

        update: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                status: z.string().optional(),
                projectType: z.string().optional(),
                owner: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                securityCriticality: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { id, clientId, ...updates } = input;

                const formattedUpdates: any = { ...updates, updatedAt: new Date() };
                if (updates.startDate) formattedUpdates.startDate = new Date(updates.startDate);
                if (updates.endDate) formattedUpdates.endDate = new Date(updates.endDate);

                const [updated] = await db.update(projects)
                    .set(formattedUpdates)
                    .where(and(eq(projects.id, id), eq(projects.clientId, clientId)))
                    .returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: clientId,
                    action: "update",
                    entityType: "project",
                    entityId: id,
                    details: { changes: updates }
                });

                return updated;
            }),

        delete: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Check dependencies or handle cascade in application logic if needed
                // For now, simple delete
                await db.delete(projects)
                    .where(and(eq(projects.id, input.id), eq(projects.clientId, input.clientId)));

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "delete",
                    entityType: "project",
                    entityId: input.id,
                    details: {}
                });

                return { success: true };
            }),

        getProjectSecurityPosture: clientProcedure
            .input(z.object({
                projectId: z.number(),
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                try {
                    const db = await getDb();

                    const assessments = await db.select()
                        .from(schema.riskAssessments)
                        .where(eq(schema.riskAssessments.projectId, input.projectId));

                    const compliance = await db.select()
                        .from(schema.projectComplianceMappings)
                        .where(eq(schema.projectComplianceMappings.projectId, input.projectId));

                    const models = await db.select()
                        .from(schema.threatModels)
                        .where(eq(schema.threatModels.projectId, input.projectId));

                    // Fetch treatments for all assessments in this project
                    const assessmentIds = assessments.map(a => a.id);
                    let treatments: any[] = [];
                    if (assessmentIds.length > 0) {
                        treatments = await db.select()
                            .from(schema.riskTreatments)
                            .where(inArray(schema.riskTreatments.riskAssessmentId, assessmentIds));
                    }

                    // Aggregation logic
                    const riskStats = {
                        total: assessments.length,
                        high: assessments.filter((r: any) => r.inherentRisk === 'High' || r.inherentRisk === 'Critical' || (r.inherentScore || 0) >= 15).length,
                        resolved: assessments.filter((r: any) => r.status === 'approved' || r.status === 'reviewed').length,
                        privacyRisks: assessments.filter((r: any) => r.privacyImpact === true).length,
                    };

                    const treatmentStats = {
                        total: treatments.length,
                        implemented: treatments.filter((t: any) => t.status === 'implemented' || t.status === 'completed').length,
                        averageCompletion: treatments.length > 0
                            ? Math.round(treatments.reduce((acc: number, t: any) => acc + (t.completionPercentage || 0), 0) / treatments.length)
                            : 0
                    };

                    const complianceStats = {
                        total: compliance.length,
                        implemented: compliance.filter((c: any) => c.status === 'implemented' || c.status === 'verified').length,
                        pending: compliance.filter((c: any) => c.status === 'pending' || c.status === 'in_progress').length,
                    };

                    // CSF Stats (Identify, Protect, Detect, Respond, Recover)
                    const csfFunctions = ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
                    const csfStats = csfFunctions.map(func => {
                        const funcRisks = assessments.filter((r: any) => r.csfFunction === func);
                        const avgRisk = funcRisks.length > 0
                            ? 100 - (funcRisks.reduce((acc: number, r: any) => acc + (r.inherentScore || 0), 0) / (funcRisks.length * 25)) * 100
                            : 100; // No risks = 100% maturity for now
                        return { subject: func, A: Math.max(0, Math.min(100, Math.round(avgRisk))) };
                    });

                    // OWASP Stats
                    const owaspCategories = [
                        "Broken Access Control",
                        "Cryptographic Failures",
                        "Injection",
                        "Insecure Design",
                        "Vulnerable Components"
                    ];
                    const owaspStats = owaspCategories.map(cat => {
                        const catRisks = assessments.filter((r: any) => r.owaspCategory === cat);
                        const riskLevel = catRisks.length > 0
                            ? (catRisks.reduce((acc: number, r: any) => acc + (r.inherentScore || 0), 0) / (catRisks.length * 25)) * 100
                            : 0;
                        return { name: cat, score: Math.round(riskLevel) };
                    });

                    // AI RMF Stats
                    const aiRmfCategories = ["Govern", "Map", "Measure", "Manage"];
                    const aiRmfStats = aiRmfCategories.map(cat => {
                        const catRisks = assessments.filter((r: any) => r.aiRmfCategory === cat);
                        const riskLevel = catRisks.length > 0
                            ? (catRisks.reduce((acc: number, r: any) => acc + (r.inherentScore || 0), 0) / (catRisks.length * 25)) * 100
                            : 0;
                        return { name: cat, score: Math.round(riskLevel) };
                    });

                    // Residual Risk Profile
                    const residualStats = {
                        critical: assessments.filter((r: any) => r.residualRisk === 'Critical').length,
                        high: assessments.filter((r: any) => r.residualRisk === 'High').length,
                        medium: assessments.filter((r: any) => r.residualRisk === 'Medium').length,
                        low: assessments.filter((r: any) => r.residualRisk === 'Low').length,
                    };

                    // Calculate Overall Posture
                    const complianceRate = complianceStats.total > 0 ? (complianceStats.implemented / complianceStats.total) : 0;
                    const treatmentRate = treatmentStats.total > 0 ? (treatmentStats.implemented / treatmentStats.total) : 1;
                    const riskFactor = riskStats.total > 0 ? (1 - (riskStats.high / riskStats.total)) : 1;
                    const overallPosture = Math.round((complianceRate * 40) + (riskFactor * 30) + (treatmentRate * 30));

                    return {
                        riskStats,
                        treatmentStats,
                        complianceStats,
                        csfStats,
                        owaspStats,
                        aiRmfStats,
                        residualStats,
                        overallPosture,
                        threatModelCount: models.length,
                        lastAssessment: assessments.length > 0 ? assessments[0].updatedAt : null,
                    };
                } catch (error: any) {
                    console.error("[ProjectsRouter] Error fetching security posture:", error);
                    // Return zeroed out stats on error to prevent UI crash
                    return {
                        riskStats: { total: 0, high: 0, resolved: 0, privacyRisks: 0 },
                        treatmentStats: { total: 0, implemented: 0, averageCompletion: 0 },
                        complianceStats: { total: 0, implemented: 0, pending: 0 },
                        csfStats: [],
                        owaspStats: [],
                        aiRmfStats: [],
                        residualStats: { critical: 0, high: 0, medium: 0, low: 0 },
                        overallPosture: 0,
                        threatModelCount: 0,
                        lastAssessment: null,
                    };
                }
            }),

        upsertComplianceMapping: clientProcedure
            .input(z.object({
                projectId: z.number(),
                clientId: z.number(),
                framework: z.string(),
                requirementId: z.string(),
                status: z.string(),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                const existing = await db.select().from(projectComplianceMappings)
                    .where(and(
                        eq(projectComplianceMappings.projectId, input.projectId),
                        eq(projectComplianceMappings.framework, input.framework),
                        eq(projectComplianceMappings.requirementId, input.requirementId)
                    )).limit(1);

                if (existing.length > 0) {
                    return await db.update(projectComplianceMappings)
                        .set({
                            status: input.status,
                            notes: input.notes,
                            updatedAt: new Date()
                        })
                        .where(eq(projectComplianceMappings.id, existing[0].id))
                        .returning();
                } else {
                    return await db.insert(projectComplianceMappings)
                        .values(input as any)
                        .returning();
                }
            }),

        getComplianceMappings: clientProcedure
            .input(z.object({
                projectId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(projectComplianceMappings)
                    .where(eq(projectComplianceMappings.projectId, input.projectId));
            })
    });
};
