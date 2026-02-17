import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, asc, sql } from 'drizzle-orm';
import * as db from '../../db';
import * as maturitySchema from '../../db/maturity-schema';

export const createMaturityRouter = (t: any, clientProcedure: any) => {
    return t.router({
        /**
         * Get all available maturity frameworks
         */
        getFrameworks: clientProcedure
            .query(async () => {
                const dbConn = await db.getDb();
                return await dbConn.select().from(maturitySchema.maturityFrameworks).where(eq(maturitySchema.maturityFrameworks.status, 'active'));
            }),

        /**
         * Get full structure for a framework (Categories + Requirements)
         */
        getFrameworkData: clientProcedure
            .input(z.object({
                frameworkId: z.string(),
            }))
            .query(async ({ input }: { input: { frameworkId: string } }) => {
                const dbConn = await db.getDb();

                const rawCategories = await dbConn.select()
                    .from(maturitySchema.maturityCategories)
                    .where(eq(maturitySchema.maturityCategories.frameworkId, input.frameworkId))
                    .orderBy(asc(maturitySchema.maturityCategories.order));

                const categories = rawCategories.map((c: any) => ({
                    id: c.id,
                    frameworkId: c.frameworkId,
                    parentId: c.parentId || null,
                    code: c.code,
                    name: c.name,
                    description: c.description,
                    icon: c.icon,
                    order: c.order
                }));

                console.log(`[TRPC] Fetched ${categories.length} categories for ${input.frameworkId}`);
                const parents = categories.filter((c: any) => !c.parentId);
                const children = categories.filter((c: any) => c.parentId);
                console.log(`[TRPC] Structure: ${parents.length} parents, ${children.length} children`);

                const requirements = await dbConn.select()
                    .from(maturitySchema.maturityRequirements)
                    .where(eq(maturitySchema.maturityRequirements.frameworkId, input.frameworkId))
                    .orderBy(asc(maturitySchema.maturityRequirements.order));

                return { categories, requirements };
            }),

        /**
         * Get client assessments for a framework
         */
        getAssessments: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string(),
            }))
            .query(async ({ input }: { input: { clientId: number, frameworkId: string } }) => {
                const dbConn = await db.getDb();

                return await dbConn.select()
                    .from(maturitySchema.maturityAssessments)
                    .where(and(
                        eq(maturitySchema.maturityAssessments.clientId, input.clientId),
                        eq(maturitySchema.maturityAssessments.frameworkId, input.frameworkId)
                    ));
            }),

        /**
         * Update an assessment item
         */
        updateAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string(),
                requirementId: z.number(),
                isAchieved: z.boolean().optional(),
                isTarget: z.boolean().optional(),
                notes: z.string().optional(),
                evidence: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
                const dbConn = await db.getDb();

                return await dbConn.insert(maturitySchema.maturityAssessments).values({
                    clientId: input.clientId,
                    frameworkId: input.frameworkId,
                    requirementId: input.requirementId,
                    isAchieved: input.isAchieved,
                    isTarget: input.isTarget,
                    notes: input.notes,
                    evidence: input.evidence,
                    assessedBy: ctx.user?.id,
                    assessmentDate: new Date(),
                }).onConflictDoUpdate({
                    target: [
                        maturitySchema.maturityAssessments.clientId,
                        maturitySchema.maturityAssessments.frameworkId,
                        maturitySchema.maturityAssessments.requirementId
                    ],
                    set: {
                        isAchieved: input.isAchieved,
                        isTarget: input.isTarget,
                        notes: input.notes,
                        evidence: input.evidence,
                        assessedBy: ctx.user?.id,
                        updatedAt: new Date(),
                    }
                });
            }),

        /**
         * Simulation Procedures
         */
        runSimulation: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string(),
                config: z.object({
                    targetLevel: z.number().optional(),
                    categoryIds: z.array(z.number()).optional(),
                })
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                // 1. Get current assessments
                const currentAssessments = await dbConn.select()
                    .from(maturitySchema.maturityAssessments)
                    .where(and(
                        eq(maturitySchema.maturityAssessments.clientId, input.clientId),
                        eq(maturitySchema.maturityAssessments.frameworkId, input.frameworkId)
                    ));

                const achievedIds = new Set(currentAssessments.filter((a: any) => a.isAchieved).map((a: any) => a.requirementId));

                // 2. Get all requirements
                const requirements = await dbConn.select()
                    .from(maturitySchema.maturityRequirements)
                    .where(eq(maturitySchema.maturityRequirements.frameworkId, input.frameworkId));

                // 3. Filter requirements that would be addressed by the simulation
                const simulationRequirements = requirements.filter((req: any) => {
                    // Skip if already achieved
                    if (achievedIds.has(req.id)) return false;

                    // Level match
                    if (input.config.targetLevel && req.level > input.config.targetLevel) return false;

                    // Category match
                    if (input.config.categoryIds?.length && !input.config.categoryIds.includes(req.categoryId)) return false;

                    return true;
                });

                // 4. Calculate stats
                const total = requirements.length;
                const currentAchieved = achievedIds.size;
                const projectedAchieved = currentAchieved + simulationRequirements.length;

                // Heuristic Effort: Level 1 = 8h, Level 2 = 16h, Level 3 = 40h, etc.
                const estimatedEffort = simulationRequirements.reduce((acc: number, req: any) => {
                    return acc + (req.level * 16);
                }, 0);

                const projectedScore = total > 0 ? (projectedAchieved / total) * 100 : 0;
                const currentScore = total > 0 ? (currentAchieved / total) * 100 : 0;
                const impactScore = projectedScore - currentScore;

                return {
                    currentScore,
                    projectedScore,
                    impactScore,
                    gapCount: simulationRequirements.length,
                    estimatedEffort,
                    simulationRequirements: simulationRequirements.map((r: any) => ({ id: r.id, title: r.title, code: r.code, level: r.level }))
                };
            }),

        saveSimulation: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string(),
                name: z.string(),
                description: z.string().optional(),
                config: z.any(),
                results: z.any()
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();
                return await dbConn.insert(maturitySchema.maturitySimulations).values({
                    clientId: input.clientId,
                    frameworkId: input.frameworkId,
                    name: input.name,
                    description: input.description,
                    config: input.config,
                    results: input.results,
                }).returning();
            }),

        getSimulations: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string(),
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();
                return await dbConn.select()
                    .from(maturitySchema.maturitySimulations)
                    .where(and(
                        eq(maturitySchema.maturitySimulations.clientId, input.clientId),
                        eq(maturitySchema.maturitySimulations.frameworkId, input.frameworkId)
                    ))
                    .orderBy(asc(maturitySchema.maturitySimulations.createdAt));
            }),

        /**
         * Seed a framework (Admin only)
         */
        seedFramework: clientProcedure
            .input(z.object({
                framework: z.any(), // Framework definition
                categories: z.array(z.any()),
                requirements: z.array(z.any()),
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                // Upsert framework
                await dbConn.insert(maturitySchema.maturityFrameworks)
                    .values(input.framework)
                    .onConflictDoUpdate({
                        target: maturitySchema.maturityFrameworks.id,
                        set: input.framework
                    });

                // Clear old categories/requirements for this framework to avoid duplicates
                await dbConn.delete(maturitySchema.maturityCategories).where(eq(maturitySchema.maturityCategories.frameworkId, input.framework.id));
                await dbConn.delete(maturitySchema.maturityRequirements).where(eq(maturitySchema.maturityRequirements.frameworkId, input.framework.id));

                if (input.categories.length > 0) {
                    await dbConn.insert(maturitySchema.maturityCategories).values(input.categories);
                }

                // Need to map category codes to IDs for requirements
                const insertedCats = await dbConn.select().from(maturitySchema.maturityCategories).where(eq(maturitySchema.maturityCategories.frameworkId, input.framework.id));
                const catMap = new Map(insertedCats.map((c: any) => [c.code, c.id]));

                const reqsToInsert = input.requirements.map((r: any) => ({
                    ...r,
                    categoryId: catMap.get(r.categoryCode) || 0,
                }));

                // Omit categoryCode before insert if it's not in schema
                const finalReqs = reqsToInsert.map(({ categoryCode, ...rest }: any) => rest);

                if (finalReqs.length > 0) {
                    await dbConn.insert(maturitySchema.maturityRequirements).values(finalReqs);
                }

                return { success: true };
            }),

        /**
         * NIST Tiers (Organizational Profiles)
         */
        getNistTiers: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: { input: { clientId: number } }) => {
                const dbConn = await db.getDb();
                return await dbConn.select()
                    .from(maturitySchema.nistTiers)
                    .where(eq(maturitySchema.nistTiers.clientId, input.clientId));
            }),

        saveNistTier: clientProcedure
            .input(z.object({
                clientId: z.number(),
                functionCode: z.string(),
                currentTier: z.number(),
                targetTier: z.number(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                console.log('[TRPC] saveNistTier called with:', input);
                try {
                    const dbConn = await db.getDb();
                    const result = await dbConn.insert(maturitySchema.nistTiers).values({
                        clientId: input.clientId,
                        functionCode: input.functionCode,
                        currentTier: input.currentTier,
                        targetTier: input.targetTier,
                    }).onConflictDoUpdate({
                        target: [maturitySchema.nistTiers.clientId, maturitySchema.nistTiers.functionCode],
                        set: {
                            currentTier: input.currentTier,
                            targetTier: input.targetTier,
                            updatedAt: new Date(),
                        }
                    }).returning();
                    console.log('[TRPC] saveNistTier success:', result);
                    return result;
                } catch (e) {
                    console.error('[TRPC] saveNistTier error:', e);
                    throw e;
                }
            }),
    });
};


/**
 * Helper to update client framework progress stats
 */
async function updateClientFrameworkStats(dbConn: any, clientId: number, frameworkId: string) {
    const assessments = await dbConn.select()
        .from(maturitySchema.maturityAssessments)
        .where(and(
            eq(maturitySchema.maturityAssessments.clientId, clientId),
            eq(maturitySchema.maturityAssessments.frameworkId, frameworkId)
        ));

    const requirements = await dbConn.select()
        .from(maturitySchema.maturityRequirements)
        .where(eq(maturitySchema.maturityRequirements.frameworkId, frameworkId));

    const total = requirements.length;
    const achieved = assessments.filter((a: any) => a.isAchieved).length;
    const target = assessments.filter((a: any) => a.isTarget).length;

    const overallScore = total > 0 ? Math.round((achieved / total) * 100) : 0;
    const targetScore = total > 0 ? Math.round((target / total) * 100) : 0;

    await dbConn.insert(maturitySchema.maturityClientFrameworks).values({
        clientId,
        frameworkId,
        overallScore,
        targetScore,
        status: achieved === total ? 'completed' : achieved > 0 ? 'in_progress' : 'not_started',
        lastAssessedAt: new Date(),
    }).onConflictDoUpdate({
        target: [maturitySchema.maturityClientFrameworks.clientId, maturitySchema.maturityClientFrameworks.frameworkId],
        set: {
            overallScore,
            targetScore,
            status: achieved === total ? 'completed' : achieved > 0 ? 'in_progress' : 'not_started',
            lastAssessedAt: new Date(),
            updatedAt: new Date(),
        }
    });
}
