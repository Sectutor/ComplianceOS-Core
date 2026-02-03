
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../../db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { policyAssignments, policyExceptions, clientPolicies, employees } from "../../schema";
// import { Context } from "../../routers";

// Define local context to avoid circular dependency
interface Context {
    user?: {
        id: number;
        role: string;
        email: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export const createPolicyManagementRouter = (
    t: any,
    clientProcedure: any,
    clientEditorProcedure: any,
    adminProcedure: any
) => {
    return t.router({
        // --- Assignments & Distribution ---

        // Assign a policy to multiple employees
        assignPolicy: clientEditorProcedure
            .input(z.object({
                policyId: z.number(),
                employeeIds: z.array(z.number()),
            }))
            .mutation(async ({ input, ctx }: { input: any, ctx: Context }) => {
                const dbConn = await db.getDb();

                // Filter out existing assignments to avoid duplicates
                const existing = await dbConn.select().from(policyAssignments)
                    .where(and(
                        eq(policyAssignments.policyId, input.policyId),
                        inArray(policyAssignments.employeeId, input.employeeIds)
                    ));

                const existingIds = existing.map((a: { employeeId: number }) => a.employeeId);
                const newIds = input.employeeIds.filter((id: number) => !existingIds.includes(id));

                if (newIds.length === 0) {
                    return { success: true, count: 0 };
                }

                await dbConn.insert(policyAssignments).values(
                    newIds.map((id: number) => ({
                        policyId: input.policyId,
                        employeeId: id,
                        status: "pending"
                    }))
                );

                return { success: true, count: newIds.length };
            }),

        // Get assignments for a policy (Admin view)
        getAssignments: clientProcedure
            .input(z.object({
                policyId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                const assignments = await dbConn.select({
                    id: policyAssignments.id,
                    status: policyAssignments.status,
                    attestedAt: policyAssignments.attestedAt,
                    assignedAt: policyAssignments.assignedAt,
                    viewedAt: policyAssignments.viewedAt,
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    email: employees.email,
                    jobTitle: employees.jobTitle
                })
                    .from(policyAssignments)
                    .leftJoin(employees, eq(policyAssignments.employeeId, employees.id))
                    .where(eq(policyAssignments.policyId, input.policyId));

                return assignments;
            }),

        // Attest to a policy (Employee action)
        attestPolicy: clientProcedure
            .input(z.object({
                assignmentId: z.number()
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                await dbConn.update(policyAssignments)
                    .set({
                        status: "attested",
                        attestedAt: new Date()
                    })
                    .where(eq(policyAssignments.id, input.assignmentId));

                return { success: true };
            }),

        // Mark as viewed
        viewPolicy: clientProcedure
            .input(z.object({
                assignmentId: z.number()
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();
                // Only update if currently pending
                const [current] = await dbConn.select().from(policyAssignments).where(eq(policyAssignments.id, input.assignmentId));
                if (current && current.status === 'pending') {
                    await dbConn.update(policyAssignments)
                        .set({
                            status: "viewed",
                            viewedAt: new Date()
                        })
                        .where(eq(policyAssignments.id, input.assignmentId));
                }
                return { success: true };
            }),

        // --- Exceptions ---

        // Request an exception
        requestException: clientProcedure
            .input(z.object({
                policyId: z.number(),
                employeeId: z.number(), // The requester
                reason: z.string(),
                expirationDate: z.string().optional() // ISO date string
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                await dbConn.insert(policyExceptions).values({
                    policyId: input.policyId,
                    employeeId: input.employeeId,
                    reason: input.reason,
                    expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
                    status: "pending"
                });

                return { success: true };
            }),

        // Review exception (Approve/Reject)
        reviewException: clientEditorProcedure
            .input(z.object({
                exceptionId: z.number(),
                status: z.enum(["approved", "rejected"]),
                rejectionReason: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: { input: any, ctx: Context }) => {
                const dbConn = await db.getDb();

                await dbConn.update(policyExceptions)
                    .set({
                        status: input.status,
                        approvedBy: input.status === 'approved' ? ctx.user?.id : null,
                        approvedAt: input.status === 'approved' ? new Date() : null,
                        rejectionReason: input.rejectionReason,
                        updatedAt: new Date()
                    })
                    .where(eq(policyExceptions.id, input.exceptionId));

                return { success: true };
            }),

        // Get exceptions for a policy
        getExceptions: clientProcedure
            .input(z.object({
                policyId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                const exceptions = await dbConn.select({
                    id: policyExceptions.id,
                    reason: policyExceptions.reason,
                    status: policyExceptions.status,
                    expirationDate: policyExceptions.expirationDate,
                    createdAt: policyExceptions.createdAt,
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    jobTitle: employees.jobTitle
                })
                    .from(policyExceptions)
                    .leftJoin(employees, eq(policyExceptions.employeeId, employees.id))
                    .where(eq(policyExceptions.policyId, input.policyId))
                    .orderBy(desc(policyExceptions.createdAt));

                return exceptions;
            }),

        // Get My Policies (for a specific employee)
        getMyPolicies: clientProcedure
            .input(z.object({
                employeeId: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                // Get assignments
                const myAssignments = await dbConn.select({
                    assignmentId: policyAssignments.id,
                    status: policyAssignments.status,
                    attestedAt: policyAssignments.attestedAt,
                    assignedAt: policyAssignments.assignedAt,
                    policyId: clientPolicies.id,
                    policyName: clientPolicies.name,
                    version: clientPolicies.version
                })
                    .from(policyAssignments)
                    .innerJoin(clientPolicies, eq(policyAssignments.policyId, clientPolicies.id))
                    .where(eq(policyAssignments.employeeId, input.employeeId));

                // Get active exceptions
                const myExceptions = await dbConn.select()
                    .from(policyExceptions)
                    .where(eq(policyExceptions.employeeId, input.employeeId));

                return {
                    assignments: myAssignments,
                    exceptions: myExceptions
                };
            })

    });
};
