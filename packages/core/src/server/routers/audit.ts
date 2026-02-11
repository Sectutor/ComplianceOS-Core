
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import * as crypto from 'crypto';
import { sendEmail } from "../../lib/email/transporter";

export const createAuditRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        inviteAuditor: protectedProcedure.input(z.object({
            clientId: z.number(),
            email: z.string().email(),
            name: z.string().optional()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            // 1. Check if user already exists
            const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, input.email));

            if (existingUser.length > 0) {
                // Link to client
                // Check if already linked
                const existingLink = await db.select()
                    .from(schema.userClients)
                    .where(and(
                        eq(schema.userClients.userId, existingUser[0].id),
                        eq(schema.userClients.clientId, input.clientId)
                    ));

                if (existingLink.length === 0) {
                    await db.insert(schema.userClients).values({
                        userId: existingUser[0].id,
                        clientId: input.clientId,
                        role: 'viewer' // Safe default, restrictive view handles the UI
                    });
                }

                // Optimization: Update user role to 'auditor' if not global admin? 
                // No, keep Role as 'user' but assign Auditor capability? 
                // We rely on `user_metadata.role` or `user.role`.
                // If existing user is a regular user, we might want to flag them as auditor.
                // For now, we assume if they are invited here, they are external.
                // We'll update their role if they are just a 'user'.

                return { success: true, message: 'Existing user added to Audit Room.' };
            }

            // 2. Create Invitation
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await db.insert(schema.userInvitations).values({
                email: input.email,
                role: 'auditor',
                invitedBy: ctx.user.id,
                token,
                expiresAt
            });

            // 3. Send Email
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}&role=auditor&clientId=${input.clientId}`;

            await sendEmail({
                to: input.email,
                subject: 'Invitation to Audit Clean Room - ComplianceOS',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1>Audit Room Access</h1>
                        <p>You have been invited to access the Auditor-Ready Clean Room.</p>
                        <div style="margin: 24px 0;">
                            <a href="${inviteLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Restricted Room</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
                    </div>
                `
            });

            return { success: true, message: 'Auditor invited successfully.' };
        }),
        list: protectedProcedure.input(z.object({
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const results = await db.select({
                audit: schema.certificationAudits,
                frameworkName: schema.complianceFrameworks.name
            })
                .from(schema.certificationAudits)
                .leftJoin(schema.complianceFrameworks, eq(schema.certificationAudits.frameworkId, schema.complianceFrameworks.id))
                .where(eq(schema.certificationAudits.clientId, input.clientId))
                .orderBy(desc(schema.certificationAudits.startDate));

            return results.map(r => ({
                ...r.audit,
                frameworkName: r.frameworkName
            }));
        }),

        create: protectedProcedure.input(z.object({
            clientId: z.number(),
            frameworkId: z.number(),
            auditFirm: z.string().optional(),
            auditorName: z.string().optional(),
            startDate: z.string().optional(), // ISO date string
            stage: z.string().default('stage_1')
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            const [audit] = await db.insert(schema.certificationAudits).values({
                clientId: input.clientId,
                frameworkId: input.frameworkId,
                auditFirm: input.auditFirm,
                auditorName: input.auditorName,
                startDate: input.startDate ? new Date(input.startDate) : undefined,
                stage: input.stage,
                status: 'scheduled',
                createdById: ctx.user.id
            }).returning();

            return audit;
        }),

        updateStatus: protectedProcedure.input(z.object({
            auditId: z.number(),
            status: z.string(),
            outcome: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const db = await getDb();

            const [updated] = await db.update(schema.certificationAudits)
                .set({
                    status: input.status,
                    outcome: input.outcome,
                    updatedAt: new Date()
                })
                .where(eq(schema.certificationAudits.id, input.auditId))
                .returning();

            return updated;
        }),

        getReadinessStats: protectedProcedure.input(z.object({
            planId: z.number(),
            frameworkId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();

            // 1. Check Scope (Plan exists)
            const [plan] = await db.select().from(schema.implementationPlans)
                .where(eq(schema.implementationPlans.id, input.planId));

            if (!plan) return { scopeDefined: false, riskAssessment: false, evidencePercentage: 0, internalAudit: false };

            // 2. Risk Assessment
            const riskAssessments = await db.select().from(schema.riskAssessments)
                .where(eq(schema.riskAssessments.clientId, plan.clientId));

            // 3. Evidence Percentage (Calculated accurately)
            // First, identify the framework name
            const [framework] = await db.select().from(schema.complianceFrameworks)
                .where(eq(schema.complianceFrameworks.id, input.frameworkId));
            
            let evidencePercentage = 0;

            if (framework) {
                // Get Total Controls for this framework
                const [totalControlsResult] = await db.select({ count: sql<number>`count(*)` })
                    .from(schema.controls)
                    .where(eq(schema.controls.framework, framework.name));
                
                const totalControls = Number(totalControlsResult?.count || 0);

                if (totalControls > 0) {
                    // Get Implemented Controls for this client & framework
                    const [implementedResult] = await db.select({ count: sql<number>`count(*)` })
                        .from(schema.clientControls)
                        .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
                        .where(and(
                            eq(schema.clientControls.clientId, plan.clientId),
                            eq(schema.controls.framework, framework.name),
                            eq(schema.clientControls.status, 'implemented')
                        ));
                    
                    const implementedCount = Number(implementedResult?.count || 0);
                    evidencePercentage = Math.round((implementedCount / totalControls) * 100);
                }
            }

            // 4. Internal Audit (Check for tasks)
            const auditTasks = await db.select().from(schema.implementationTasks)
                .where(and(
                    eq(schema.implementationTasks.implementationPlanId, input.planId),
                    like(schema.implementationTasks.title, '%internal audit%')
                ));

            // Determine active/completed based on counts
            return {
                scopeDefined: !!plan,
                riskAssessment: riskAssessments.length > 0,
                evidencePercentage: Math.min(100, evidencePercentage),
                internalAudit: auditTasks.length > 0
            };
        })
    });
};
