import { z } from "zod";
import { trainingModules, trainingAssignments, employees } from "../../schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../lib/audit";
import fs from "fs";

export const createTrainingRouter = (t: any, clientProcedure: any, clientEditorProcedure: any) => {
    return t.router({
        /**
         * List all training modules for a client
         */
        list: clientProcedure
            .input(z.object({
                clientId: z.number(),
                includeInactive: z.boolean().optional().default(false),
                employeeId: z.number().optional(), // If provided, only return modules assigned to OR completed by this employee
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId, includeInactive, employeeId } = input;

                let query = db.select()
                    .from(trainingModules)
                    .where(eq(trainingModules.clientId, clientId));

                if (!includeInactive) {
                    query = query.where(eq(trainingModules.active, true));
                }

                const modules = await query.orderBy(asc(trainingModules.order));

                if (employeeId) {
                    // Filter modules based on assignments for this employee
                    const assignments = await db.select()
                        .from(trainingAssignments)
                        .where(and(
                            eq(trainingAssignments.employeeId, employeeId),
                            eq(trainingAssignments.clientId, clientId)
                        ));

                    const assignedModuleIds = assignments.map((a: any) => a.moduleId);
                    return modules.filter((m: any) => assignedModuleIds.includes(m.id));
                }

                return modules;
            }),

        /**
         * Get a single training module with assignment/completion status
         */
        get: clientProcedure
            .input(z.object({
                clientId: z.number(),
                moduleId: z.number(),
                employeeId: z.number().optional(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId, moduleId, employeeId } = input;

                const [module] = await db.select()
                    .from(trainingModules)
                    .where(and(
                        eq(trainingModules.id, moduleId),
                        eq(trainingModules.clientId, clientId)
                    ))
                    .limit(1);

                if (!module) throw new TRPCError({ code: "NOT_FOUND", message: "Training module not found" });

                let assignment = null;
                if (employeeId) {
                    const [record] = await db.select()
                        .from(trainingAssignments)
                        .where(and(
                            eq(trainingAssignments.moduleId, moduleId),
                            eq(trainingAssignments.employeeId, employeeId)
                        ))
                        .limit(1);
                    assignment = record || null;
                }

                return {
                    module,
                    assignment
                };
            }),

        /**
         * Assign training modules to employees (Admin only)
         */
        assign: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                moduleId: z.number(),
                employeeIds: z.array(z.number()),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    const db = await getDb();
                    const { clientId, moduleId, employeeIds } = input;

                    console.log(`[TrainingAssign] Assigning module ${moduleId} to ${employeeIds.length} employees for client ${clientId}`);

                    // Filter out existing assignments
                    const existing = await db.select()
                        .from(trainingAssignments)
                        .where(and(
                            eq(trainingAssignments.moduleId, moduleId),
                            inArray(trainingAssignments.employeeId, employeeIds)
                        ));

                    const existingIds = existing.map((a: any) => a.employeeId);
                    const newEmployeeIds = employeeIds.filter((id: number) => !existingIds.includes(id));

                    if (newEmployeeIds.length === 0) {
                        return { success: true, count: 0 };
                    }

                    const newAssignments = newEmployeeIds.map((id: number) => ({
                        clientId,
                        moduleId,
                        employeeId: id,
                        status: 'pending',
                        assignedAt: new Date()
                    }));

                    await db.insert(trainingAssignments).values(newAssignments);

                    await logActivity({
                        clientId,
                        userId: ctx.user.id,
                        action: "assign",
                        entityType: "training_module",
                        entityId: moduleId,
                        details: { employeeCount: newEmployeeIds.length }
                    });

                    return { success: true, count: newEmployeeIds.length };
                } catch (error: any) {
                    console.error("[TrainingAssign] Error:", error);
                    // Also log to a file we can definitely read
                    fs.appendFileSync('trpc-debug.log', `[${new Date().toISOString()}] training.assign Error: ${error.message}\n${error.stack}\n`);
                    throw error;
                }
            }),

        /**
         * Get all assignments for a specific module (Admin only)
         */
        getAssignments: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                moduleId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select({
                    id: trainingAssignments.id,
                    employeeId: trainingAssignments.employeeId,
                    status: trainingAssignments.status,
                    assignedAt: trainingAssignments.assignedAt,
                    completedAt: trainingAssignments.completedAt,
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    email: employees.email,
                })
                    .from(trainingAssignments)
                    .innerJoin(employees, eq(trainingAssignments.employeeId, employees.id))
                    .where(and(
                        eq(trainingAssignments.moduleId, input.moduleId),
                        eq(trainingAssignments.clientId, input.clientId)
                    ));
            }),

        /**
         * Create a new training module (Admin only)
         */
        create: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string().min(1),
                description: z.string().optional(),
                type: z.enum(['video', 'text']),
                videoUrl: z.string().optional(),
                thumbnailUrl: z.string().optional(),
                content: z.string().optional(),
                durationMinutes: z.number().optional(),
                order: z.number().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Get next order if not provided
                let order = input.order;
                if (order === undefined) {
                    const [last] = await db.select({ order: trainingModules.order })
                        .from(trainingModules)
                        .where(eq(trainingModules.clientId, input.clientId))
                        .orderBy(desc(trainingModules.order))
                        .limit(1);
                    order = (last?.order || 0) + 1;
                }

                const [module] = await db.insert(trainingModules)
                    .values({
                        clientId: input.clientId,
                        title: input.title,
                        description: input.description,
                        type: input.type,
                        videoUrl: input.videoUrl,
                        thumbnailUrl: input.thumbnailUrl,
                        content: input.content,
                        durationMinutes: input.durationMinutes,
                        order
                    })
                    .returning();

                await logActivity({
                    clientId: input.clientId,
                    userId: ctx.user.id,
                    action: "create",
                    entityType: "training_module",
                    entityId: module.id,
                    details: { title: input.title }
                });

                return module;
            }),

        /**
         * Update a training module (Admin only)
         */
        update: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                type: z.enum(['video', 'text']).optional(),
                videoUrl: z.string().optional(),
                thumbnailUrl: z.string().optional(),
                content: z.string().optional(),
                durationMinutes: z.number().optional(),
                active: z.boolean().optional(),
                order: z.number().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [updated] = await db.update(trainingModules)
                    .set({
                        ...input,
                        updatedAt: new Date(),
                    })
                    .where(and(
                        eq(trainingModules.id, input.id),
                        eq(trainingModules.clientId, input.clientId)
                    ))
                    .returning();

                if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

                await logActivity({
                    clientId: input.clientId,
                    userId: ctx.user.id,
                    action: "update",
                    entityType: "training_module",
                    entityId: updated.id,
                    details: { title: updated.title }
                });

                return updated;
            }),

        /**
         * Delete a training module (Admin only)
         */
        delete: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Delete assignments first
                await db.delete(trainingAssignments)
                    .where(eq(trainingAssignments.moduleId, input.id));

                await db.delete(trainingModules)
                    .where(and(
                        eq(trainingModules.id, input.id),
                        eq(trainingModules.clientId, input.clientId)
                    ));

                return { success: true };
            }),

        /**
         * Complete a training module (Employee)
         */
        complete: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                moduleId: z.number(),
                score: z.number().optional(),
                feedback: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { clientId, employeeId, moduleId, score, feedback } = input;

                // Check if assignment exists
                const [existing] = await db.select()
                    .from(trainingAssignments)
                    .where(and(
                        eq(trainingAssignments.moduleId, moduleId),
                        eq(trainingAssignments.employeeId, employeeId)
                    ))
                    .limit(1);

                if (existing) {
                    const [updated] = await db.update(trainingAssignments)
                        .set({
                            status: 'completed',
                            completedAt: new Date(),
                            score: score !== undefined ? score : existing.score,
                            feedback: feedback !== undefined ? feedback : existing.feedback,
                            updatedAt: new Date()
                        })
                        .where(eq(trainingAssignments.id, existing.id))
                        .returning();
                    return updated;
                }

                // If no assignment exists, create one as completed (for optional self-started modules)
                const [record] = await db.insert(trainingAssignments)
                    .values({
                        clientId,
                        employeeId,
                        moduleId,
                        status: 'completed',
                        score,
                        feedback,
                        assignedAt: new Date(),
                        completedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .returning();

                return record;
            }),

        /**
         * Get client training statistics (Admin only)
         */
        getStats: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Get all assignments for this client
                const assignments = await db.select()
                    .from(trainingAssignments)
                    .where(eq(trainingAssignments.clientId, input.clientId));

                // Group by module
                const statsByModule = assignments.reduce((acc: Record<number, { assignments: number, completions: number }>, record: any) => {
                    if (!acc[record.moduleId]) {
                        acc[record.moduleId] = { assignments: 0, completions: 0 };
                    }
                    acc[record.moduleId].assignments++;
                    if (record.status === 'completed') {
                        acc[record.moduleId].completions++;
                    }
                    return acc;
                }, {});

                return {
                    totalAssignments: assignments.length,
                    totalCompletions: assignments.filter((a: any) => a.status === 'completed').length,
                    statsByModule
                };
            }),
    });
};
