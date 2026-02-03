
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { taskAssignments, users } from "../../schema";

export const createTaskAssignmentsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // Get assignments for a specific task
        summary: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                taskType: z.string(), // 'control', etc.
                taskId: z.number(),
            }))
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();
                const clientId = input.clientId || ctx.clientId; // Should usually be present via clientProcedure

                const assignments = await db.select({
                    id: taskAssignments.id,
                    userId: taskAssignments.userId,
                    role: taskAssignments.raciRole,
                    firstName: users.name, // We'll parse name or just return name
                    lastName: sql<string>`''`, // users table only has 'name', so we'll mock lastName or split it
                    email: users.email
                })
                    .from(taskAssignments)
                    .innerJoin(users, eq(taskAssignments.userId, users.id))
                    .where(and(
                        eq(taskAssignments.taskType, input.taskType),
                        eq(taskAssignments.taskId, input.taskId),
                        // Optional: filter by clientId if tasks are global but assignments are client specific?
                        // taskAssignments has clientId, so yes.
                        clientId ? eq(taskAssignments.clientId, clientId) : undefined
                    ));

                // Group by role
                const result = {
                    responsible: [] as any[],
                    accountable: [] as any[],
                    consulted: [] as any[],
                    informed: [] as any[]
                };

                for (const assign of assignments) {
                    // Split name for frontend compatibility if needed, or just use name
                    const names = (assign.firstName || "").split(' ');
                    const firstName = names[0] || "";
                    const lastName = names.length > 1 ? names.slice(1).join(' ') : "";

                    const userObj = {
                        id: assign.userId,
                        firstName: firstName,
                        lastName: lastName,
                        email: assign.email,
                        assignmentId: assign.id
                    };

                    if (assign.role === 'responsible') result.responsible.push(userObj);
                    else if (assign.role === 'accountable') result.accountable.push(userObj);
                    else if (assign.role === 'consulted') result.consulted.push(userObj);
                    else if (assign.role === 'informed') result.informed.push(userObj);
                }

                return result;
            }),

        // Assign a user to a role
        assignUser: clientProcedure
            .input(z.object({
                clientId: z.number(),
                taskType: z.string(),
                taskId: z.number(),
                userId: z.number(), // Changed from employeeId to userId
                raciRole: z.enum(['responsible', 'accountable', 'consulted', 'informed']),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Upsert? Or just insert (unique index handles duplicates)
                // If unique index exists, we can ignore conflict or do nothing
                await db.insert(taskAssignments)
                    .values({
                        clientId: input.clientId,
                        taskType: input.taskType,
                        taskId: input.taskId,
                        userId: input.userId,
                        raciRole: input.raciRole,
                        assignedBy: ctx.user?.id
                    })
                    .onConflictDoNothing(); // Prevent duplicate errors

                return { success: true };
            }),

        // Remove an assignment
        remove: clientProcedure
            .input(z.object({
                assignmentId: z.number().optional(), // If we have the ID
                // Or by composite key
                taskType: z.string().optional(),
                taskId: z.number().optional(),
                userId: z.number().optional(),
                raciRole: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                if (input.assignmentId) {
                    await db.delete(taskAssignments).where(eq(taskAssignments.id, input.assignmentId));
                } else if (input.taskType && input.taskId && input.userId && input.raciRole) {
                    await db.delete(taskAssignments)
                        .where(and(
                            eq(taskAssignments.taskType, input.taskType),
                            eq(taskAssignments.taskId, input.taskId),
                            eq(taskAssignments.userId, input.userId),
                            // @ts-ignore
                            eq(taskAssignments.raciRole, input.raciRole)
                        ));
                } else {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing parameters for removal' });
                }

                return { success: true };
            }),
    });
};
