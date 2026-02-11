
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, or, asc, desc, sql } from 'drizzle-orm';
import * as db from '../../db';

export const createAsvsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // ============================================================================
        // REFERENCE DATA
        // ============================================================================

        /**
         * Get all ASVS Categories
         */
        getCategories: clientProcedure
            .query(async () => {
                const dbConn = await db.getDb();
                const { asvsCategories } = await import('../../schema');
                return dbConn.select().from(asvsCategories).orderBy(asc(asvsCategories.order));
            }),

        /**
         * Get requirements for a specific category
         */
        getRequirements: clientProcedure
            .input(z.object({
                categoryCode: z.string(),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { asvsRequirements } = await import('../../schema');

                const reqs = await dbConn.select()
                    .from(asvsRequirements)
                    .where(eq(asvsRequirements.categoryCode, input.categoryCode))
                    .orderBy(asc(asvsRequirements.requirementId)); // 1.1.1, 1.1.2...

                return reqs;
            }),

        // ============================================================================
        // ASSESSMENTS
        // ============================================================================

        /**
         * Get assessments for a specific category + client
         */
        getCategoryAssessment: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                categoryCode: z.string(),
            }))
            .query(async ({ input, ctx }) => {
                const clientId = input.clientId || ctx.client.id;
                const dbConn = await db.getDb();
                const { asvsRequirements, asvsAssessments } = await import('../../schema');

                // Get all requirements for this category
                const reqs = await dbConn.select()
                    .from(asvsRequirements)
                    .where(eq(asvsRequirements.categoryCode, input.categoryCode))
                    .orderBy(asc(asvsRequirements.requirementId));

                // Get existing assessments
                const assessments = await dbConn.select()
                    .from(asvsAssessments)
                    .where(and(
                        eq(asvsAssessments.clientId, clientId),
                        // Ideally filter by category requirement IDs, but fetching all for client is fine given volume
                    ));

                // Merge
                const clientAssessments = new Map(assessments.map(a => [a.requirementId, a]));

                return reqs.map(r => ({
                    ...r,
                    assessment: clientAssessments.get(r.requirementId) || null,
                }));
            }),

        /**
        * Update a single requirement assessment
        */
        updateAssessment: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                requirementId: z.string(),
                status: z.enum(['unanswered', 'pass', 'fail', 'na']),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }) => {
                const clientId = input.clientId || ctx.client.id;
                const dbConn = await db.getDb();
                const { asvsAssessments } = await import('../../schema');

                // Check if exists
                const existing = await dbConn.select()
                    .from(asvsAssessments)
                    .where(and(
                        eq(asvsAssessments.clientId, clientId),
                        eq(asvsAssessments.requirementId, input.requirementId)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    await dbConn.update(asvsAssessments)
                        .set({
                            status: input.status,
                            notes: input.notes,
                            assessedBy: ctx.user?.id,
                            updatedAt: new Date(),
                        })
                        .where(eq(asvsAssessments.id, existing[0].id));
                } else {
                    await dbConn.insert(asvsAssessments).values({
                        clientId,
                        requirementId: input.requirementId,
                        status: input.status,
                        notes: input.notes,
                        assessedBy: ctx.user?.id,
                        assessmentDate: new Date(),
                    });
                }

                return { success: true };
            }),

        /**
         * Push gaps to implementation plan
         */
        pushGapsToImplementation: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
            }))
            .mutation(async ({ input, ctx }) => {
                const clientId = input.clientId || ctx.client.id;
                const dbConn = await db.getDb();
                const { asvsRequirements, asvsAssessments, implementationPlans, implementationTasks } = await import('../../schema');

                // 1. Get all assessments that are gaps (failed or unanswered explicitly)
                const assessments = await dbConn.select()
                    .from(asvsAssessments)
                    .where(and(
                        eq(asvsAssessments.clientId, clientId),
                        or(
                            eq(asvsAssessments.status, 'fail'),
                            eq(asvsAssessments.status, 'unanswered')
                        )
                    ));

                // 2. Get all requirements to find missing assessments (implicitly unanswered)
                const allReqs = await dbConn.select().from(asvsRequirements);
                const assessmentMap = new Map(assessments.map(a => [a.requirementId, a]));

                // Gaps are: failed, explicitly unanswered, or no record at all
                const gaps = allReqs.filter(r => {
                    const a = assessmentMap.get(r.requirementId);
                    return !a || a.status === 'fail' || a.status === 'unanswered';
                });

                if (gaps.length === 0) {
                    return { success: true, message: "No security gaps found in current assessment." };
                }

                // 3. Find or Create the ASVS Remediation Plan
                let [plan] = await dbConn.select()
                    .from(implementationPlans)
                    .where(and(
                        eq(implementationPlans.clientId, clientId),
                        eq(implementationPlans.title, "ASVS Remediation Plan")
                    ))
                    .limit(1);

                if (!plan) {
                    [plan] = await dbConn.insert(implementationPlans).values({
                        clientId,
                        title: "ASVS Remediation Plan",
                        description: "Tactical remediation plan derived from OWASP ASVS assessment gaps. This plan follows a PDCA (Plan-Do-Check-Act) lifecycle for continuous improvement.",
                        status: 'not_started',
                        priority: 'high',
                        createdById: ctx.user?.id || 1
                    }).returning();
                }

                // 4. Create tasks for each gap, avoiding duplicates
                const existingTasks = await dbConn.select({ controlId: implementationTasks.controlId })
                    .from(implementationTasks)
                    .where(eq(implementationTasks.implementationPlanId, plan.id));

                const existingReqIds = new Set(existingTasks.map(t => t.controlId));

                const tasksToInsert = gaps
                    .filter(g => !existingReqIds.has(g.requirementId))
                    .map(g => ({
                        implementationPlanId: plan.id,
                        clientId,
                        title: `Remediate ASVS ${g.requirementId}: ${g.description.length > 80 ? g.description.substring(0, 80) + '...' : g.description}`,
                        description: `ASVS Requirement ${g.requirementId}: ${g.description}`,
                        status: 'todo',
                        priority: 'high',
                        controlId: g.requirementId,
                        pdca: 'Plan',
                        createdById: ctx.user?.id || 1
                    }));

                if (tasksToInsert.length > 0) {
                    await dbConn.insert(implementationTasks).values(tasksToInsert);
                }

                return {
                    success: true,
                    message: `Identified ${gaps.length} gaps. Added ${tasksToInsert.length} new tasks to 'ASVS Remediation Plan'.`,
                    planId: plan.id,
                    totalGaps: gaps.length,
                    newTasks: tasksToInsert.length
                };
            }),

        /**
        * Reset/Seed Initial Data (Admin/Dev helper)
        */
        seedData: clientProcedure
            .mutation(async () => {
                const dbConn = await db.getDb();
                const { asvsCategories, asvsRequirements } = await import('../../schema');
                const { ASVS_CATEGORIES, ASVS_REQUIREMENTS_SAMPLE } = await import('../../pages/assurance/ASVS_CONTENT');

                // Upsert Categories
                for (const cat of ASVS_CATEGORIES) {
                    await dbConn.insert(asvsCategories)
                        .values(cat as any)
                        .onConflictDoUpdate({
                            target: asvsCategories.code,
                            set: cat
                        });
                }

                // Upsert Requirements
                for (const req of ASVS_REQUIREMENTS_SAMPLE) {
                    await dbConn.insert(asvsRequirements)
                        .values(req as any)
                        .onConflictDoUpdate({
                            target: asvsRequirements.requirementId,
                            set: req
                        });
                }

                return { success: true, message: "ASVS Seeding Complete" };
            })
    });
};
