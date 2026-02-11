import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import * as db from '../../db';

export const createSammV2Router = (t: any, clientProcedure: any) => {
    return t.router({
        // ============================================================================
        // PRACTICES & REFERENCE DATA
        // ============================================================================

        /**
         * Get all SAMM practices with their stream definitions
         */
        getPractices: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                businessFunction: z.string().optional(), // Filter by function
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammPractices } = await import('../../schema');

                let query = dbConn.select().from(sammPractices);

                if (input.businessFunction) {
                    query = query.where(eq(sammPractices.businessFunction, input.businessFunction)) as any;
                }

                const practices = await query.orderBy(sammPractices.order);

                return practices;
            }),

        /**
         * Get stream questions for a specific practice stream and level
         */
        getStreamQuestions: clientProcedure
            .input(z.object({
                practiceId: z.string(),
                streamId: z.enum(['A', 'B']),
                level: z.number().min(0).max(3).optional(), // If not provided, get all levels
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamQuestions } = await import('../../schema');

                let query = dbConn.select().from(sammStreamQuestions)
                    .where(and(
                        eq(sammStreamQuestions.practiceId, input.practiceId),
                        eq(sammStreamQuestions.streamId, input.streamId)
                    ));

                if (input.level !== undefined) {
                    query = query.where(and(
                        eq(sammStreamQuestions.practiceId, input.practiceId),
                        eq(sammStreamQuestions.streamId, input.streamId),
                        eq(sammStreamQuestions.level, input.level)
                    )) as any;
                }

                const questions = await query.orderBy(sammStreamQuestions.level);

                return questions;
            }),

        /**
         * Get all questions for a practice (both streams, all levels)
         */
        getPracticeQuestions: clientProcedure
            .input(z.object({
                practiceId: z.string(),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamQuestions } = await import('../../schema');

                const questions = await dbConn.select()
                    .from(sammStreamQuestions)
                    .where(eq(sammStreamQuestions.practiceId, input.practiceId))
                    .orderBy(sammStreamQuestions.streamId, sammStreamQuestions.level);

                // Group by stream
                const streamA = questions.filter((q: any) => q.streamId === 'A');
                const streamB = questions.filter((q: any) => q.streamId === 'B');

                return {
                    practiceId: input.practiceId,
                    streamA,
                    streamB,
                };
            }),

        // ============================================================================
        // ASSESSMENTS - CRUD Operations
        // ============================================================================

        /**
         * Get all stream assessments for a client
         */
        getAssessments: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string().optional(),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments } = await import('../../schema');

                let query = dbConn.select()
                    .from(sammStreamAssessments)
                    .where(eq(sammStreamAssessments.clientId, input.clientId));

                if (input.practiceId) {
                    query = query.where(and(
                        eq(sammStreamAssessments.clientId, input.clientId),
                        eq(sammStreamAssessments.practiceId, input.practiceId)
                    )) as any;
                }

                const assessments = await query;

                return assessments;
            }),

        /**
         * Get assessment for a specific stream
         */
        getStreamAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string(),
                streamId: z.enum(['A', 'B']),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments } = await import('../../schema');

                const [assessment] = await dbConn.select()
                    .from(sammStreamAssessments)
                    .where(and(
                        eq(sammStreamAssessments.clientId, input.clientId),
                        eq(sammStreamAssessments.practiceId, input.practiceId),
                        eq(sammStreamAssessments.streamId, input.streamId)
                    ));

                return assessment || null;
            }),

        /**
         * Update or create a stream assessment
         */
        updateStreamAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string(),
                streamId: z.enum(['A', 'B']),
                maturityLevel: z.number().min(0).max(3),
                targetLevel: z.number().min(0).max(3),
                assessmentAnswers: z.record(z.boolean()).optional(),
                qualityCriteria: z.record(z.record(z.boolean())).optional(),
                evidence: z.array(z.string()).optional(),
                notes: z.string().optional(),
                improvementNotes: z.string().optional(),
                levelNotes: z.record(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments } = await import('../../schema');

                // Check if assessment exists
                const [existing] = await dbConn.select()
                    .from(sammStreamAssessments)
                    .where(and(
                        eq(sammStreamAssessments.clientId, input.clientId),
                        eq(sammStreamAssessments.practiceId, input.practiceId),
                        eq(sammStreamAssessments.streamId, input.streamId)
                    ));

                if (existing) {
                    // Update existing
                    await dbConn.update(sammStreamAssessments)
                        .set({
                            maturityLevel: input.maturityLevel,
                            targetLevel: input.targetLevel,
                            assessmentAnswers: input.assessmentAnswers as any,
                            qualityCriteria: input.qualityCriteria as any,
                            evidence: input.evidence as any,
                            notes: input.notes,
                            improvementNotes: input.improvementNotes,
                            levelNotes: input.levelNotes as any,
                            assessmentDate: new Date(),
                            assessedBy: ctx.user?.id,
                            updatedAt: new Date(),
                        })
                        .where(eq(sammStreamAssessments.id, existing.id));

                    return { success: true, id: existing.id, action: 'updated' };
                } else {
                    // Create new
                    const [inserted] = await dbConn.insert(sammStreamAssessments)
                        .values({
                            clientId: input.clientId,
                            practiceId: input.practiceId,
                            streamId: input.streamId,
                            maturityLevel: input.maturityLevel,
                            targetLevel: input.targetLevel,
                            assessmentAnswers: input.assessmentAnswers as any,
                            qualityCriteria: input.qualityCriteria as any,
                            evidence: input.evidence as any,
                            notes: input.notes,
                            improvementNotes: input.improvementNotes,
                            levelNotes: input.levelNotes as any,
                            assessmentDate: new Date(),
                            assessedBy: ctx.user?.id,
                        })
                        .returning();

                    return { success: true, id: inserted.id, action: 'created' };
                }
            }),

        // ============================================================================
        // SCORING & CALCULATIONS
        // ============================================================================

        /**
         * Calculate practice score (average of two streams)
         */
        calculatePracticeScore: clientProcedure
            .input(z.object({
                clientId: z.number(),
                practiceId: z.string(),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments } = await import('../../schema');

                const streams = await dbConn.select()
                    .from(sammStreamAssessments)
                    .where(and(
                        eq(sammStreamAssessments.clientId, input.clientId),
                        eq(sammStreamAssessments.practiceId, input.practiceId)
                    ));

                if (streams.length === 0) {
                    return {
                        practiceId: input.practiceId,
                        score: 0,
                        targetScore: 0,
                        streamA: null,
                        streamB: null,
                    };
                }

                const streamA = streams.find((s: any) => s.streamId === 'A');
                const streamB = streams.find((s: any) => s.streamId === 'B');

                const scoreA = streamA?.maturityLevel || 0;
                const scoreB = streamB?.maturityLevel || 0;
                const targetA = streamA?.targetLevel || 0;
                const targetB = streamB?.targetLevel || 0;

                // Practice score = average of both streams
                const practiceScore = (scoreA + scoreB) / 2;
                const practiceTarget = (targetA + targetB) / 2;

                return {
                    practiceId: input.practiceId,
                    score: practiceScore,
                    targetScore: practiceTarget,
                    streamA: { level: scoreA, target: targetA },
                    streamB: { level: scoreB, target: targetB },
                };
            }),

        /**
         * Calculate overall SAMM maturity score
         */
        calculateOverallScore: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments, sammPractices } = await import('../../schema');

                // Get all assessments
                const assessments = await dbConn.select()
                    .from(sammStreamAssessments)
                    .where(eq(sammStreamAssessments.clientId, input.clientId));

                // Get all practices
                const practices = await dbConn.select().from(sammPractices);

                if (assessments.length === 0) {
                    return {
                        overallScore: 0,
                        overallTarget: 0,
                        businessFunctions: {},
                        practiceScores: {},
                        assessedStreams: 0,
                        totalStreams: 30,
                    };
                }

                // Group assessments by practice
                const practiceScores: Record<string, { current: number; target: number }> = {};

                practices.forEach((practice: any) => {
                    const streamA = assessments.find((a: any) => a.practiceId === practice.practiceId && a.streamId === 'A');
                    const streamB = assessments.find((a: any) => a.practiceId === practice.practiceId && a.streamId === 'B');

                    const scoreA = streamA?.maturityLevel || 0;
                    const scoreB = streamB?.maturityLevel || 0;
                    const targetA = streamA?.targetLevel || 0;
                    const targetB = streamB?.targetLevel || 0;

                    // Practice score = average of streams
                    practiceScores[practice.practiceId] = {
                        current: (scoreA + scoreB) / 2,
                        target: (targetA + targetB) / 2,
                    };
                });

                // Group by business function
                const functionScores: Record<string, { current: number; target: number; count: number }> = {};

                practices.forEach(practice => {
                    const func = practice.businessFunction;
                    if (!functionScores[func]) {
                        functionScores[func] = { current: 0, target: 0, count: 0 };
                    }

                    const score = practiceScores[practice.practiceId];
                    if (score) {
                        functionScores[func].current += score.current;
                        functionScores[func].target += score.target;
                        functionScores[func].count += 1;
                    }
                });

                // Calculate function averages
                const businessFunctions: Record<string, { score: number; target: number }> = {};
                Object.entries(functionScores).forEach(([func, data]) => {
                    businessFunctions[func] = {
                        score: data.count > 0 ? data.current / data.count : 0,
                        target: data.count > 0 ? data.target / data.count : 0,
                    };
                });

                // Calculate overall (average of all functions)
                const functionValues = Object.values(businessFunctions);
                const overallScore = functionValues.length > 0
                    ? functionValues.reduce((sum, f) => sum + f.score, 0) / functionValues.length
                    : 0;
                const overallTarget = functionValues.length > 0
                    ? functionValues.reduce((sum, f) => sum + f.target, 0) / functionValues.length
                    : 0;

                return {
                    overallScore,
                    overallTarget,
                    businessFunctions,
                    practiceScores,
                    assessedStreams: assessments.length,
                    totalStreams: 30,
                };
            }),

        // ============================================================================
        // IMPROVEMENT PLANNING
        // ============================================================================

        /**
         * Generate improvement plan from stream-based assessment gaps
         */
        generateImprovementPlan: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .mutation(async ({ input, ctx }) => {
                const dbConn = await db.getDb();
                const { sammStreamAssessments, sammStreamQuestions, implementationPlans, implementationTasks } = await import('../../schema');

                // Get all assessments
                const assessments = await dbConn.select()
                    .from(sammStreamAssessments)
                    .where(eq(sammStreamAssessments.clientId, input.clientId));

                if (assessments.length === 0) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'No SAMM assessments found. Please complete stream assessments first.',
                    });
                }

                // Identify gaps (stream level < target level)
                const gaps = assessments.filter((a: any) => a.maturityLevel < a.targetLevel);

                if (gaps.length === 0) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'No improvement gaps found. All assessed streams are at or above target level.',
                    });
                }

                // Get questions for gap streams to extract activities
                const tasks = [];

                for (const gap of gaps) {
                    // Get questions for the target level
                    const questions = await dbConn.select()
                        .from(sammStreamQuestions)
                        .where(and(
                            eq(sammStreamQuestions.practiceId, gap.practiceId),
                            eq(sammStreamQuestions.streamId, gap.streamId),
                            eq(sammStreamQuestions.level, gap.targetLevel)
                        ));

                    const question = questions[0];
                    const levelDiff = gap.targetLevel - gap.maturityLevel;

                    // Create task with detailed information
                    let levelNotesStr = '';
                    if (gap.levelNotes && typeof gap.levelNotes === 'object') {
                        const notes = Object.entries(gap.levelNotes as Record<string, string>)
                            .filter(([lvl, txt]) => txt && txt.trim())
                            .map(([lvl, txt]) => `**Level ${lvl} Notes:** ${txt}`)
                            .join('\n');
                        if (notes) levelNotesStr = `\n\n**Assessment Level Findings:**\n${notes}`;
                    }

                    tasks.push({
                        title: `${gap.practiceId}-${gap.streamId}: Improve to Level ${gap.targetLevel}`,
                        description: question
                            ? `**Stream:** ${question.streamName}\n**Question:** ${question.question}\n\n**Current Level:** ${gap.maturityLevel}\n**Target Level:** ${gap.targetLevel}\n**Gap:** ${levelDiff} level(s)\n\n**Required Activities:**\n${(question.activities as string[])?.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Review SAMM practice requirements'}\n\n**Quality Criteria:**\n${(question.qualityCriteria as string[])?.map((c, i) => `☐ ${c}`).join('\n') || 'See SAMM documentation'}\n\n${gap.notes ? `**General Notes:** ${gap.notes}` : ''}${levelNotesStr}`
                            : `**Current Level:** ${gap.maturityLevel} | **Target:** ${gap.targetLevel} | **Gap:** ${levelDiff} | **Improvement:** ${levelDiff} level(s)\n\n${gap.notes || 'Review SAMM practice requirements and implement necessary improvements.'}${levelNotesStr}`,
                        practiceId: gap.practiceId,
                        streamId: gap.streamId,
                        currentLevel: gap.maturityLevel,
                        targetLevel: gap.targetLevel,
                        priority: levelDiff > 1 ? ('high' as const) : ('medium' as const),
                    });
                }

                // Create implementation plan
                const [plan] = await dbConn.insert(implementationPlans).values({
                    clientId: input.clientId,
                    title: 'SAMM v2 Improvement Plan',
                    description: `Generated from SAMM v2 stream-based assessment. ${gaps.length} ${gaps.length === 1 ? 'stream' : 'streams'} identified for improvement out of ${assessments.length} assessed streams.`,
                    status: 'planning',
                    priority: 'high',
                    createdById: ctx.user?.id || 1,
                }).returning();

                // Create tasks
                const tasksToInsert = tasks.map(t => ({
                    implementationPlanId: plan.id,
                    clientId: input.clientId,
                    title: t.title,
                    description: t.description,
                    status: 'backlog' as const,
                    priority: t.priority,
                    pdca: 'Plan' as const,
                    tags: [t.practiceId, t.streamId, 'SAMM-v2', `L${t.targetLevel}`],
                    createdById: ctx.user?.id || 1,
                }));

                await dbConn.insert(implementationTasks).values(tasksToInsert);

                return {
                    success: true,
                    planId: plan.id,
                    taskCount: tasksToInsert.length,
                    gaps: gaps.length,
                    totalAssessed: assessments.length,
                };
            }),
    });
};
