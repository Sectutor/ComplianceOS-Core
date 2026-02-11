import { z } from "zod";
import { router, clientProcedure } from "../trpc";
import * as db from "../../db";
import { sammMaturityAssessments } from "../../schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createSammRouter = (t: any, clientProcedure: any) => {
    return t.router({
        getMaturity: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: { input: { clientId: number } }) => {
                const dbConn = await db.getDb();
                const scores = await dbConn.select().from(sammMaturityAssessments)
                    .where(eq(sammMaturityAssessments.clientId, input.clientId));

                return scores;
            }),

        updateMaturity: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string(),
                maturityLevel: z.number().min(0).max(3).optional(),
                targetLevel: z.number().min(0).max(3).optional(),
                evidenceLinks: z.array(z.number()).optional(),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();
                const { clientId, practiceId, ...updates } = input;

                // Check if existing
                const existing = await dbConn.select().from(sammMaturityAssessments)
                    .where(and(
                        eq(sammMaturityAssessments.clientId, clientId),
                        eq(sammMaturityAssessments.practiceId, practiceId)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    await dbConn.update(sammMaturityAssessments)
                        .set({ ...updates, updatedAt: new Date() })
                        .where(eq(sammMaturityAssessments.id, existing[0].id));
                    return { success: true, id: existing[0].id };
                } else {
                    const [inserted] = await dbConn.insert(sammMaturityAssessments).values({
                        clientId,
                        practiceId,
                        maturityLevel: updates.maturityLevel ?? 0,
                        targetLevel: updates.targetLevel ?? 1,
                        evidenceLinks: updates.evidenceLinks ?? [],
                        notes: updates.notes ?? "",
                    }).returning();
                    return { success: true, id: inserted.id };
                }
            }),

        getGuidance: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string(),
            }))
            .query(async ({ input }: { input: { clientId: number, practiceId: string } }) => {
                // Placeholder for AI guidance logic
                // In a real implementation, this would call llmService.generate
                return {
                    guidance: `AI guidance for ${input.practiceId} based on your current policies...`,
                    suggestions: [
                        "Implement automated secure code review",
                        "Establish a clear vulnerability disclosure policy",
                    ]
                };
            }),

        generateImprovementPlan: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .mutation(async ({ input, ctx }: { input: { clientId: number }, ctx: any }) => {
                const dbConn = await db.getDb();

                // 1. Get all SAMM maturity scores
                const scores = await dbConn.select().from(sammMaturityAssessments)
                    .where(eq(sammMaturityAssessments.clientId, input.clientId));

                if (!scores || scores.length === 0) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'No SAMM assessment found. Please complete the assessment first.'
                    });
                }

                // 2. Identify gaps - only for practices that have been assessed (have explicit records)
                // A gap exists when:
                // - The practice has been assessed (exists in DB)
                // - Current maturity is below target level
                const gaps = scores.filter((s: any) => {
                    // Must have a gap
                    const hasGap = s.maturityLevel < s.targetLevel;
                    // Must have been assessed (either maturity or target was set by user)
                    // We assume if a record exists, the user intended to assess it
                    const wasAssessed = s.maturityLevel !== null || s.targetLevel !== null;

                    return hasGap && wasAssessed;
                });

                if (gaps.length === 0) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'No improvement gaps found. All assessed practices are at or above target level. Complete more assessments or adjust target levels to generate a plan.'
                    });
                }

                // 3. Create Implementation Plan
                const { implementationPlans, implementationTasks } = await import('../../schema');

                const [plan] = await dbConn.insert(implementationPlans).values({
                    clientId: input.clientId,
                    title: 'SAMM Improvement Plan',
                    description: `Generated from SAMM assessment. ${gaps.length} ${gaps.length === 1 ? 'practice' : 'practices'} identified for improvement out of ${scores.length} assessed.`,
                    status: 'planning',
                    priority: 'high',
                    createdById: ctx.user?.id || 1
                }).returning();

                // 4. Create tasks for each gap
                const tasksToInsert = gaps.map((gap: any) => {
                    const levelDiff = gap.targetLevel - gap.maturityLevel;
                    const practiceId = gap.practiceId;

                    return {
                        implementationPlanId: plan.id,
                        clientId: input.clientId,
                        title: `${practiceId}: Improve to Level ${gap.targetLevel}`,
                        description: `Current Level: ${gap.maturityLevel} | Target: ${gap.targetLevel} | Gap: ${levelDiff} level(s)\n\n${gap.notes || 'Review SAMM practice requirements and implement necessary improvements.'}`,
                        status: 'backlog',
                        priority: levelDiff > 1 ? 'high' : 'medium',
                        pdca: 'Plan',
                        tags: [practiceId, 'SAMM', `L${gap.targetLevel}`],
                        createdById: ctx.user?.id || 1
                    };
                });

                await dbConn.insert(implementationTasks).values(tasksToInsert);

                return {
                    success: true,
                    planId: plan.id,
                    taskCount: tasksToInsert.length,
                    gaps: gaps.length,
                    totalAssessed: scores.length
                };
            }),
    });
};
