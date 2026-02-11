
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../../db";
import { eq, and, desc, inArray, or, sql } from "drizzle-orm";
import { policyAssignments, policyExceptions, clientPolicies, employees, employeeTrainingRecords, users, userClients, complianceRequirements } from "../../schema";
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
                clientId: z.number(),
                policyId: z.number(),
                employeeIds: z.array(z.number()),
            }))
            .mutation(async ({ input, ctx }: { input: any, ctx: Context }) => {
                try {
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
                } catch (error: any) {
                    console.error("assignPolicy Error:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to assign policy: ${error.message || error}`,
                        cause: error
                    });
                }
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

        // Mark as viewed
        viewPolicy: clientProcedure
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
                policyId: z.number().optional(),
                requirementId: z.number().optional(),
                policyType: z.enum(['policy', 'document']).default('policy'),
                employeeId: z.number(), // The requester
                reason: z.string(),
                expirationDate: z.string().optional() // ISO date string
            }))
            .mutation(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                await dbConn.insert(policyExceptions).values({
                    policyId: input.policyId || null,
                    requirementId: input.requirementId || null,
                    policyType: input.policyType || 'policy',
                    employeeId: input.employeeId,
                    reason: input.reason,
                    expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
                    status: "pending"
                });

                // Notify Admins/Editors for this client
                try {
                    // Get client ID and policy name
                    let policyInfo;
                    if (input.policyType === 'policy' && input.policyId) {
                        [policyInfo] = await dbConn.select({
                            clientId: clientPolicies.clientId,
                            name: clientPolicies.name,
                            employeeFirstName: employees.firstName,
                            employeeLastName: employees.lastName
                        })
                            .from(clientPolicies)
                            .innerJoin(employees, eq(employees.id, input.employeeId))
                            .where(eq(clientPolicies.id, input.policyId))
                            .limit(1);
                    } else if (input.policyType === 'document' && input.requirementId) {
                        [policyInfo] = await dbConn.select({
                            clientId: complianceRequirements.clientId,
                            name: complianceRequirements.title,
                            employeeFirstName: employees.firstName,
                            employeeLastName: employees.lastName
                        })
                            .from(complianceRequirements)
                            .innerJoin(employees, eq(employees.id, input.employeeId))
                            .where(eq(complianceRequirements.id, input.requirementId))
                            .limit(1);
                    }

                    if (policyInfo) {
                        // Find all admins/editors for this client
                        const admins = await dbConn.select({
                            email: users.email,
                            name: users.name
                        })
                            .from(userClients)
                            .innerJoin(users, eq(userClients.userId, users.id))
                            .where(and(
                                eq(userClients.clientId, policyInfo.clientId),
                                or(
                                    eq(userClients.role, 'admin'),
                                    eq(userClients.role, 'editor'),
                                    eq(userClients.role, 'owner')
                                )
                            ));

                        if (admins.length > 0) {
                            const { EmailService } = await import("../email/service");
                            const adminEmails = admins.map((a: { email: string | null }) => a.email).filter((e: string | null): e is string => !!e);

                            if (adminEmails.length > 0) {
                                await EmailService.send({
                                    to: adminEmails,
                                    subject: `New Policy Exception Request: ${policyInfo.employeeFirstName} ${policyInfo.employeeLastName}`,
                                    html: `
                                        <div style="font-family: sans-serif; color: #374151;">
                                            <h2>New Exception Request</h2>
                                            <p>An employee has requested an exception for a compliance policy.</p>
                                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                                <p><strong>Employee:</strong> ${policyInfo.employeeFirstName} ${policyInfo.employeeLastName}</p>
                                                <p><strong>Policy:</strong> ${policyInfo.name}</p>
                                                <p><strong>Reason:</strong> ${input.reason}</p>
                                            </div>
                                            <p>Please log in to the Personnel Compliance Hub to review this request.</p>
                                            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                                            <p style="font-size: 0.875rem; color: #6b7280;">This is an automated notification from ComplianceOS.</p>
                                        </div>
                                    `,
                                    clientId: policyInfo.clientId
                                });
                            }
                        }
                    }
                } catch (notifyError) {
                    console.error("Failed to send admin notification for exception:", notifyError);
                }

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

                // Fetch details for notification before update
                const [ex] = await dbConn.select().from(policyExceptions).where(eq(policyExceptions.id, input.exceptionId));
                if (!ex) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exception not found' });

                let details: any = null;
                if (ex.policyId) {
                    // Standard policy exception
                    [details] = await dbConn.select({
                        employeeEmail: employees.email,
                        employeeName: employees.firstName,
                        policyName: clientPolicies.name,
                        clientId: clientPolicies.clientId
                    })
                        .from(policyExceptions)
                        .innerJoin(employees, eq(policyExceptions.employeeId, employees.id))
                        .innerJoin(clientPolicies, eq(policyExceptions.policyId, clientPolicies.id))
                        .where(eq(policyExceptions.id, input.exceptionId));
                } else {
                    // Document exception or fallback - just get employee info
                    [details] = await dbConn.select({
                        employeeEmail: employees.email,
                        employeeName: employees.firstName,
                        policyName: sql<string>`'Compliance Document'`,
                        clientId: employees.clientId
                    })
                        .from(employees)
                        .where(eq(employees.id, ex.employeeId));
                }

                await dbConn.update(policyExceptions)
                    .set({
                        status: input.status,
                        approvedBy: input.status === 'approved' ? ctx.user?.id : null,
                        approvedAt: input.status === 'approved' ? new Date() : null,
                        rejectionReason: input.rejectionReason,
                        updatedAt: new Date()
                    })
                    .where(eq(policyExceptions.id, input.exceptionId));

                // Send Notification
                if (details && details.employeeEmail) {
                    try {
                        const { EmailService } = await import("../email/service");
                        const statusColor = input.status === 'approved' ? '#16a34a' : '#dc2626';

                        await EmailService.send({
                            to: details.employeeEmail,
                            subject: `Policy Exception Request Update: ${details.policyName}`,
                            html: `
                                <div style="font-family: sans-serif; color: #374151;">
                                    <h2>Exception Request Update</h2>
                                    <p>Hello ${details.employeeName},</p>
                                    <p>Your request for an exception to the policy <strong>${details.policyName}</strong> has been:</p>
                                    <p style="font-size: 1.25rem; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">
                                        ${input.status}
                                    </p>
                                    ${input.rejectionReason ? `<p><strong>Reason:</strong> ${input.rejectionReason}</p>` : ''}
                                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                                    <p style="font-size: 0.875rem; color: #6b7280;">Please log in to the portal to view full details.</p>
                                </div>
                            `,
                            clientId: details.clientId
                        });
                    } catch (error) {
                        console.error("Failed to send exception notification:", error);
                        // Don't fail the mutation if email fails
                    }
                }

                return { success: true };
            }),

        // Get exceptions for a policy OR client
        getExceptions: clientProcedure
            .input(z.object({
                policyId: z.number().optional(),
                clientId: z.number().optional()
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                if (!input.policyId && !input.clientId) return [];

                // Build conditions - use employees.clientId instead of clientPolicies.clientId
                // so we capture ALL exceptions for this client, not just ones linked to policies
                const conditions = [];
                if (input.policyId) {
                    conditions.push(eq(policyExceptions.policyId, input.policyId));
                }
                if (input.clientId) {
                    conditions.push(eq(employees.clientId, input.clientId));
                }

                const exceptions = await dbConn.select({
                    id: policyExceptions.id,
                    reason: policyExceptions.reason,
                    status: policyExceptions.status,
                    expirationDate: policyExceptions.expirationDate,
                    createdAt: policyExceptions.createdAt,
                    rejectionReason: policyExceptions.rejectionReason,
                    firstName: employees.firstName,
                    lastName: employees.lastName,
                    jobTitle: employees.jobTitle,
                    policyId: policyExceptions.policyId,
                    policyName: clientPolicies.name,
                })
                    .from(policyExceptions)
                    .innerJoin(employees, eq(policyExceptions.employeeId, employees.id))
                    .leftJoin(clientPolicies, eq(policyExceptions.policyId, clientPolicies.id))
                    .where(and(...conditions))
                    .orderBy(desc(policyExceptions.createdAt));

                // Fill in policyName for exceptions that don't have a linked policy
                return exceptions.map((ex: any) => ({
                    ...ex,
                    policyName: ex.policyName || 'Compliance Document'
                }));
            }),

        // Get My Policies (for a specific employee)
        getMyPolicies: clientProcedure
            .input(z.object({
                employeeId: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const dbConn = await db.getDb();

                // Get policy assignments
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

                // Get training records
                const trainingRecords = await dbConn.select()
                    .from(employeeTrainingRecords)
                    .where(eq(employeeTrainingRecords.employeeId, input.employeeId));

                // Define required training modules (hardcoded for now)
                const requiredTraining = [
                    { id: 'intro', name: 'Introduction to Compliance', framework: 'iso-27001', description: 'Overview of compliance requirements' },
                    { id: 'implementation', name: 'Implementation Guide', framework: 'iso-27001', description: 'How to implement compliance controls' },
                    { id: 'risk-management', name: 'Risk Management', framework: 'iso-27001', description: 'Understanding and managing risks' },
                    { id: 'incident-response', name: 'Incident Response', framework: 'iso-27001', description: 'How to respond to security incidents' },
                    { id: 'data-protection', name: 'Data Protection', framework: 'iso-27001', description: 'Protecting sensitive information' },
                ];

                // Map training records to status
                const trainingStatus = requiredTraining.map(module => {
                    const completed = trainingRecords.find(
                        (r: any) => r.frameworkId === module.framework && r.sectionId === module.id
                    );
                    return {
                        id: module.id,
                        name: module.name,
                        framework: module.framework,
                        description: module.description,
                        status: completed ? 'completed' : 'pending',
                        completedAt: completed?.completedAt || null
                    };
                });

                // Calculate summary statistics
                const totalPolicies = myAssignments.length;
                const attestedPolicies = myAssignments.filter((a: any) => a.status === 'attested').length;
                const pendingPolicies = totalPolicies - attestedPolicies;

                const totalTraining = requiredTraining.length;
                const completedTraining = trainingStatus.filter(t => t.status === 'completed').length;
                const pendingTraining = totalTraining - completedTraining;

                const totalItems = totalPolicies + totalTraining;
                const completedItems = attestedPolicies + completedTraining;
                const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                return {
                    assignments: myAssignments,
                    exceptions: myExceptions,
                    training: trainingStatus,
                    summary: {
                        totalPolicies,
                        attestedPolicies,
                        pendingPolicies,
                        totalTraining,
                        completedTraining,
                        pendingTraining,
                        totalItems,
                        completedItems,
                        overallProgress
                    }
                };
            })
            ,
        upgradeTemplates: adminProcedure
            .input(z.object({ dryRun: z.boolean().default(true) }).optional())
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const { policyTemplates } = await import("../../schema");
                const templates = await dbConn.select().from(policyTemplates).orderBy(desc(policyTemplates.createdAt));

                const sanitize = (html: string, title: string) => {
                    let s = html || "";
                    s = s.replace(/```html([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/gi, "$1");
                    s = s.replace(/<pre[\s\S]*?>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "$1");
                    s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
                    s = s.replace(/\[object Object\]/g, "");
                    const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (bodyMatch) s = bodyMatch[1];
                    s = s.replace(/<\/?(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
                    s = s.replace(/<section([^>]*)>/gi, "<div$1>").replace(/<\/section>/gi, "</div>");
                    if (!/\<h1[\s\S]*?\>/.test(s)) {
                        s = `<h1>${title || "Information Security Policy"}</h1>\n${s}`;
                    }
                    return s.trim();
                };

                const defaultSectionTitles = [
                    "Purpose","Scope","Roles and Responsibilities","Policy Statements",
                    "Procedures","Exceptions","Enforcement","Definitions","References","Revision History"
                ];
                const buildSkeleton = (title: string, sectionTitles?: string[]) => {
                    const t = (title || "Information Security Policy").trim();
                    const secs = (sectionTitles && sectionTitles.length > 0 ? sectionTitles : defaultSectionTitles);
                    const parts = secs.map(st => `<h2>${st}</h2>\n<p>[Content]</p>`);
                    return [`<h1>${t}</h1>`, ...parts].join("\n\n");
                };

                const results: Array<{ id: number; updated: boolean; changes: string[] }> = [];
                for (const tpl of templates as any[]) {
                    const changes: string[] = [];
                    let content = tpl.content || "";
                    const before = content;
                    const title = tpl.name || "Information Security Policy";
                    if (!content || content.trim().length === 0) {
                        const sectionTitles = Array.isArray(tpl.sections)
                            ? (tpl.sections as any[]).map((s: any) => (typeof s === 'object' ? (s.title || 'Section') : String(s))).filter(Boolean)
                            : undefined;
                        content = buildSkeleton(title, sectionTitles);
                        changes.push("skeleton_built_for_empty_template");
                    }
                    const after = sanitize(content, title);
                    if (after !== before) {
                        changes.push("sanitized_html_and_title");
                    }

                    let updatedSections = tpl.sections;
                    if (Array.isArray(updatedSections)) {
                        const newSections = updatedSections.map((s: any) => {
                            if (s && typeof s === 'object') {
                                const body = s.content || s.text || "";
                                const cleanBody = sanitize(body, title);
                                if (cleanBody !== body) changes.push(`section_${s.id || s.title}_sanitized`);
                                return { ...s, content: cleanBody };
                            }
                            return s;
                        });
                        updatedSections = newSections as any;
                    }

                    const updated = changes.length > 0;
                    results.push({ id: tpl.id, updated, changes });

                    if (updated && !input?.dryRun) {
                        await dbConn.update(policyTemplates)
                            .set({ content: after, sections: updatedSections })
                            .where(eq(policyTemplates.id, tpl.id));
                    }
                }

                return {
                    templatesProcessed: (templates as any[]).length,
                    templatesChanged: results.filter(r => r.updated).length,
                    dryRun: !!(input?.dryRun),
                    results
                };
            }),

    });
};
