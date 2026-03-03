import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import { programGuideAssignments, users } from "../../schema";

export const createProgramGuidesRouter = (t: any, clientProcedure: any) => {
    return t.router({
        getAssignments: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                guideType: z.string(),
            }))
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();
                const clientId = input.clientId || ctx.clientId; // Should usually be present via clientProcedure

                const assignments = await db.select({
                    id: programGuideAssignments.id,
                    guideType: programGuideAssignments.guideType,
                    stepId: programGuideAssignments.stepId,
                    userId: programGuideAssignments.userId,
                    targetDate: programGuideAssignments.targetDate,
                    firstName: users.name, // We'll parse name or just return name
                    email: users.email
                })
                    .from(programGuideAssignments)
                    .innerJoin(users, eq(programGuideAssignments.userId, users.id))
                    .where(and(
                        eq(programGuideAssignments.clientId, clientId),
                        eq(programGuideAssignments.guideType, input.guideType)
                    ));

                // Return a map of stepId -> assignment details
                const result: Record<string, any> = {};
                for (const assign of assignments) {
                    result[assign.stepId] = {
                        owner: assign.firstName,
                        ownerId: assign.userId,
                        targetDate: assign.targetDate,
                    };
                }

                return result;
            }),

        upsertAssignment: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                guideType: z.string(),
                stepId: z.string(),
                userId: z.number(),
                targetDate: z.string().optional().nullable(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const clientId = input.clientId || ctx.clientId;

                await db.insert(programGuideAssignments)
                    .values({
                        clientId: clientId,
                        guideType: input.guideType,
                        stepId: input.stepId,
                        userId: input.userId,
                        targetDate: input.targetDate ? new Date(input.targetDate) : null,
                        assignedBy: ctx.user?.id
                    })
                    .onConflictDoUpdate({
                        target: [programGuideAssignments.clientId, programGuideAssignments.guideType, programGuideAssignments.stepId],
                        set: {
                            userId: input.userId,
                            targetDate: input.targetDate ? new Date(input.targetDate) : null,
                            updatedAt: new Date()
                        }
                    });

                return { success: true };
            }),
    });
};
