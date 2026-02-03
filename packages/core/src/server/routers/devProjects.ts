
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { devProjects, threatModels, riskScenarios, riskTreatments } from "../../schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { logActivity } from "../../lib/audit";



export const createDevProjectsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const projects = await db.select({
                    ...devProjects,
                    threatModelCount: sql<number>`count(${threatModels.id})`.mapWith(Number),
                })
                    .from(devProjects)
                    .leftJoin(threatModels, eq(threatModels.devProjectId, devProjects.id))
                    .where(eq(devProjects.clientId, input.clientId))
                    .groupBy(devProjects.id)
                    .orderBy(desc(devProjects.updatedAt));

                return projects;
            }),

        get: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [project] = await db.select()
                    .from(devProjects)
                    .where(and(eq(devProjects.id, input.id), eq(devProjects.clientId, input.clientId)));

                if (!project) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
                }

                const models = await db.select()
                    .from(threatModels)
                    .where(eq(threatModels.devProjectId, input.id))
                    .orderBy(desc(threatModels.updatedAt));

                return { ...project, threatModels: models };
            }),

        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string().min(1),
                description: z.string().optional(),
                repositoryUrl: z.string().url().optional().or(z.literal("")),
                techStack: z.array(z.string()).optional(),
                owner: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const [newProject] = await db.insert(devProjects)
                    .values({
                        ...input,
                        techStack: input.techStack || [],
                    } as any)
                    .returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "create",
                    entityType: "dev_project",
                    entityId: newProject.id,
                    details: { name: newProject.name }
                });

                return newProject;
            }),

        update: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                repositoryUrl: z.string().url().optional().or(z.literal("")),
                techStack: z.array(z.string()).optional(),
                owner: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { id, clientId, ...updates } = input;

                const [updated] = await db.update(devProjects)
                    .set({ ...updates, updatedAt: new Date() } as any)
                    .where(and(eq(devProjects.id, id), eq(devProjects.clientId, clientId)))
                    .returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: clientId,
                    action: "update",
                    entityType: "dev_project",
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

                // Check permissions?

                await db.delete(devProjects)
                    .where(and(eq(devProjects.id, input.id), eq(devProjects.clientId, input.clientId)));

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "delete",
                    entityType: "dev_project",
                    entityId: input.id,
                    details: {}
                });

                return { success: true };
            }),

        getRisks: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(riskScenarios)
                    .where(and(
                        eq(riskScenarios.clientId, input.clientId),
                        eq(riskScenarios.devProjectId, input.devProjectId)
                    ))
                    .orderBy(desc(riskScenarios.createdAt));
            }),

        getTreatments: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                // Join treatments with scenarios to filter by devProjectId
                return await db.select({
                    treatment: riskTreatments,
                    riskTitle: riskScenarios.title,
                })
                    .from(riskTreatments)
                    .innerJoin(riskScenarios, eq(riskTreatments.riskScenarioId, riskScenarios.id))
                    .where(and(
                        eq(riskScenarios.clientId, input.clientId),
                        eq(riskScenarios.devProjectId, input.devProjectId)
                    ))
                    .orderBy(desc(riskTreatments.updatedAt));
            }),

        updateRisk: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                status: z.string().optional(),
                threatCategory: z.string().optional(),
                owner: z.string().optional(),
                // Add scoring fields if allowed to edit manually
                inherentScore: z.number().optional(),
                inherentRisk: z.string().optional(),
                likelihood: z.number().optional(),
                impact: z.number().optional(),
                residualLikelihood: z.number().optional(),
                residualImpact: z.number().optional(),
                residualScore: z.number().optional(),
                residualRisk: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { id, clientId, ...updates } = input;
                console.log(`[updateRisk] Input:`, { id, clientId, updates });

                // Calculate Inherent Risk based on Likelihood/Impact
                if (updates.likelihood !== undefined && updates.impact !== undefined) {
                    const score = updates.likelihood * updates.impact;
                    updates.inherentScore = score;
                    // Standard matrix (1-25)
                    if (score >= 15) updates.inherentRisk = "Critical";
                    else if (score >= 9) updates.inherentRisk = "High";
                    else if (score >= 4) updates.inherentRisk = "Medium";
                    else updates.inherentRisk = "Low";
                }
                console.log(`[updateRisk] Calculated updates:`, updates);

                // Calculate Residual Risk based on Likelihood/Impact
                if (updates.residualLikelihood !== undefined && updates.residualImpact !== undefined) {
                    const score = updates.residualLikelihood * updates.residualImpact;
                    updates.residualScore = score;
                    if (score >= 15) updates.residualRisk = "Critical";
                    else if (score >= 9) updates.residualRisk = "High";
                    else if (score >= 4) updates.residualRisk = "Medium";
                    else updates.residualRisk = "Low";
                } else if (updates.residualScore !== undefined) {
                    // Fallback to manual score calculation if only score is provided
                    const score = updates.residualScore;
                    if (score >= 15) updates.residualRisk = "Critical";
                    else if (score >= 9) updates.residualRisk = "High";
                    else if (score >= 4) updates.residualRisk = "Medium";
                    else updates.residualRisk = "Low";
                }

                const [updated] = await db.update(riskScenarios)
                    .set({
                        title: updates.title,
                        description: updates.description,
                        status: updates.status,
                        threatCategory: updates.threatCategory,
                        owner: updates.owner,
                        likelihood: updates.likelihood,
                        impact: updates.impact,
                        inherentScore: updates.inherentScore,
                        inherentRisk: updates.inherentRisk,
                        inherentRiskScore: updates.inherentScore, // For backward compatibility
                        residualLikelihood: updates.residualLikelihood,
                        residualImpact: updates.residualImpact,
                        residualScore: updates.residualScore,
                        residualRisk: updates.residualRisk,
                        updatedAt: new Date()
                    } as any)
                    .where(and(
                        eq(riskScenarios.id, id),
                        eq(riskScenarios.clientId, clientId)
                    ))
                    .returning();

                if (!updated) {
                    console.error(`[updateRisk] Update failed - no record found for id=${id}, clientId=${clientId}`);
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Risk record not found or update failed'
                    });
                }

                console.log(`[updateRisk] Successfully updated risk ${id}. Result:`, JSON.stringify({
                    id: updated.id,
                    likelihood: updated.likelihood,
                    impact: updated.impact,
                    inherentScore: updated.inherentScore,
                    inherentRisk: updated.inherentRisk,
                }, null, 2));

                await logActivity({
                    userId: ctx.user.id,
                    clientId: clientId,
                    action: "update",
                    entityType: "risk",
                    entityId: id,
                    details: { changes: updates }
                });
                return updated;
            }),

        deleteRisk: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                // Delete treatments first (manual cascade)
                await db.delete(riskTreatments)
                    .where(eq(riskTreatments.riskScenarioId, input.id));

                await db.delete(riskScenarios)
                    .where(and(eq(riskScenarios.id, input.id), eq(riskScenarios.clientId, input.clientId)));

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "delete",
                    entityType: "risk",
                    entityId: input.id,
                    details: {}
                });
                return { success: true };
            }),
    });
};
