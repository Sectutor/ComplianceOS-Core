
import { z } from "zod";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
// import { generateGapAnalysisDocx } from "../lib/reporting/gapAnalysisReport";
// import { llmService } from "../../lib/llm/service";



export const createGapAnalysisRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.gapAssessments)
                    .where(eq(schema.gapAssessments.clientId, input.clientId))
                    .orderBy(desc(schema.gapAssessments.updatedAt));
                return results;
            }),

        get: clientProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.select().from(schema.gapAssessments).where(eq(schema.gapAssessments.id, input.id));
                if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
                const responses = await dbConn.select().from(schema.gapResponses).where(eq(schema.gapResponses.assessmentId, input.id));
                return { assessment, responses };
            }),

        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                framework: z.string(),
                scope: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.insert(schema.gapAssessments).values({
                    clientId: input.clientId,
                    name: input.name,
                    framework: input.framework,
                    scope: input.scope,
                    status: 'draft',
                }).returning();
                return assessment;
            }),

        updateResponse: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                controlId: z.string(),
                currentStatus: z.string().optional(),
                targetStatus: z.string().optional(),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // Check if response exists
                const existing = await dbConn.select().from(schema.gapResponses).where(and(
                    eq(schema.gapResponses.assessmentId, input.assessmentId),
                    eq(schema.gapResponses.controlId, input.controlId)
                ));

                if (existing.length === 0) {
                    // Create if not exists (lazy creation)
                    await dbConn.insert(schema.gapResponses).values({
                        assessmentId: input.assessmentId,
                        controlId: input.controlId,
                        currentStatus: input.currentStatus,
                        targetStatus: input.targetStatus,
                        notes: input.notes
                    });
                } else {
                    await dbConn.update(schema.gapResponses)
                        .set({
                            currentStatus: input.currentStatus,
                            targetStatus: input.targetStatus,
                            notes: input.notes,
                            updatedAt: new Date()
                        })
                        .where(and(
                            eq(schema.gapResponses.assessmentId, input.assessmentId),
                            eq(schema.gapResponses.controlId, input.controlId)
                        ));
                }

                // Update assessment updated_at
                await dbConn.update(schema.gapAssessments)
                    .set({ updatedAt: new Date() })
                    .where(eq(schema.gapAssessments.id, input.assessmentId));

                return { success: true };
            }),

        complete: clientProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.update(schema.gapAssessments)
                    .set({ status: 'completed', updatedAt: new Date() })
                    .where(eq(schema.gapAssessments.id, input.id));
                return { success: true };
            }),

        calculatePriorities: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const responses = await dbConn.select().from(schema.gapResponses)
                    .where(and(
                        eq(schema.gapResponses.assessmentId, input.assessmentId),
                        eq(schema.gapResponses.currentStatus, 'not_implemented')
                    ));

                // Simulating AI/Scoring logic for now
                for (const r of responses) {
                    const score = Math.floor(Math.random() * 100);
                    await dbConn.update(schema.gapResponses)
                        .set({
                            priorityScore: score,
                            gapSeverity: score > 80 ? 'critical' : score > 50 ? 'high' : 'medium'
                        })
                        .where(eq(schema.gapResponses.id, r.id));
                }
                return { success: true };
            }),

        exportReport: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                throw new Error("Gap Analysis Export is a Premium feature.");
            }),

        updateReportDetails: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                executiveSummary: z.string().optional(),
                introduction: z.string().optional(),
                keyRecommendations: z.array(z.string()).optional(),
                scope: z.string().optional(),
                methodology: z.string().optional(),
                assumptions: z.string().optional(),
                references: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.update(schema.gapAssessments)
                    .set({
                        executiveSummary: input.executiveSummary,
                        introduction: input.introduction,
                        keyRecommendations: input.keyRecommendations,
                        scope: input.scope,
                        methodology: input.methodology,
                        assumptions: input.assumptions,
                        references: input.references,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.gapAssessments.id, input.assessmentId));
                return { success: true };
            }),


        generateReportContent: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                return {
                    executiveSummary: "Assessment completed. Upgrade to Premium for AI-generated insights.",
                    keyRecommendations: ["Review high priority gaps.", "Allocate budget for remediation."]
                };
            }),

        convertFindingToTask: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                controlId: z.string(),
                clientId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                ownerId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Verify existence
                const [assessment] = await dbConn.select().from(schema.gapAssessments).where(eq(schema.gapAssessments.id, input.assessmentId));
                if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

                // 2. Create the project task
                const [task] = await dbConn.insert(schema.projectTasks).values({
                    clientId: input.clientId,
                    title: `REMEDIATION: ${input.title}`,
                    description: input.description || `Closes gap for control ${input.controlId} discovered in assessment ${assessment.name}`,
                    status: 'todo',
                    priority: 'high',
                    sourceType: 'gap_analysis',
                    sourceId: input.assessmentId.toString(),
                    category: 'Remediation'
                }).returning();

                // 3. Update the gap response to link to the task
                await dbConn.update(schema.gapResponses)
                    .set({
                        remediationPlan: `Assigned as task #${task.id}: ${task.title}`,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(schema.gapResponses.assessmentId, input.assessmentId),
                        eq(schema.gapResponses.controlId, input.controlId)
                    ));

                return { success: true, taskId: task.id };
            }),
    });
};
