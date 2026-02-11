import { z } from "zod";
import * as db from "../../db";
import { waitingList, magicLinks } from "../../schema";
import { eq, sql } from "drizzle-orm";
import { notifyOwner } from "../../notification";
import { sendInternalSystemEmail } from "../../lib/email/internalSender";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";

export const createWaitlistRouter = (t: any, publicProcedure: any, adminProcedure: any) => {
    return t.router({
        join: publicProcedure
            .input(z.object({
                email: z.string().email(),
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                company: z.string().optional(),
                role: z.string().optional(),
                certification: z.string().optional(),
                orgSize: z.string().optional(),
                industry: z.string().optional(),
                source: z.string().optional().default("web"),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();

                // Check if email already exists
                const existing = await d.select().from(waitingList).where(eq(waitingList.email, input.email));

                if (existing.length > 0) {
                    return { success: true, message: "Already on the list!" };
                }

                await d.insert(waitingList).values({
                    email: input.email,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    company: input.company,
                    role: input.role,
                    certification: input.certification,
                    orgSize: input.orgSize,
                    industry: input.industry,
                    source: input.source,
                    status: "pending",
                });

                // 1. External Notification (FORGE_API_URL / Project Owner)
                try {
                    await notifyOwner({
                        title: `🚀 New Waitlist Lead: ${input.firstName} ${input.lastName}`,
                        content: `A new user has joined the waitlist!\n\n` +
                            `- Name: ${input.firstName} ${input.lastName}\n` +
                            `- Email: ${input.email}\n` +
                            `- Company: ${input.company || 'N/A'}\n` +
                            `- Certification: ${input.certification || 'N/A'}\n` +
                            `- Org Size: ${input.orgSize || 'N/A'}\n` +
                            `- Industry: ${input.industry || 'N/A'}\n` +
                            `- Source: ${input.source}\n\n` +
                            `Please follow up with them as soon as possible.`
                    });
                } catch (e) {
                    console.warn("[Waitlist] notifyOwner failed:", e);
                }

                // 2. Internal CRM Inbox Notification
                try {
                    // We notify Client 1 (the platform owner account)
                    await sendInternalSystemEmail({
                        clientId: 1,
                        subject: `New Prospect: ${input.firstName} ${input.lastName} (${input.company || 'Individual'})`,
                        body: `
                            <div style="font-family: sans-serif;">
                                <h2>New Waitlist Sign-up</h2>
                                <p>A new potential customer has joined the GRCompliance waitlist.</p>
                                <table border="0" cellpadding="5" cellspacing="0">
                                    <tr><td><strong>Name:</strong></td><td>${input.firstName} ${input.lastName}</td></tr>
                                    <tr><td><strong>Email:</strong></td><td>${input.email}</td></tr>
                                    <tr><td><strong>Company:</strong></td><td>${input.company || 'N/A'}</td></tr>
                                    <tr><td><strong>Target Cert:</strong></td><td>${input.certification || 'N/A'}</td></tr>
                                    <tr><td><strong>Org Size:</strong></td><td>${input.orgSize || 'N/A'}</td></tr>
                                    <tr><td><strong>Industry:</strong></td><td>${input.industry || 'N/A'}</td></tr>
                                </table>
                                <p>This lead has been logged in the waiting_list table. Please reach out to them to schedule a demo.</p>
                                <p><a href="/sales/waitlist">View Waitlist Dashboard</a></p>
                            </div>
                        `,
                        snippet: `New lead from ${input.email} for ${input.certification || 'GRCompliance'}`
                    });
                } catch (e) {
                    console.warn("[Waitlist] Internal CRM notification failed:", e);
                }

                // Optional: auto invite via magic link when enabled
                try {
                    if (process.env.AUTO_INVITE_WAITLIST === 'true') {
                        const d2 = await db.getDb();
                        const [lead] = await d2.select().from(waitingList).where(eq(waitingList.email, input.email)).limit(1);
                        if (lead) {
                            const token = crypto.randomUUID();
                            const expiresAt = new Date();
                            expiresAt.setDate(expiresAt.getDate() + 30);
                            const [link] = await d2.insert(magicLinks).values({
                                token,
                                label: `Auto Invite: ${input.firstName || ''} ${input.lastName || ''}`.trim(),
                                email: input.email,
                                role: 'viewer',
                                planTier: 'pro',
                                maxClients: 2,
                                accessDurationType: 'lifetime',
                                waitlistId: lead.id,
                                expiresAt,
                                usageLimit: 1
                            }).returning();
                            await d2.update(waitingList).set({ status: 'invited' }).where(eq(waitingList.id, lead.id));
                            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
                            const inviteUrl = `${baseUrl}/auth/redeem-link?token=${token}`;
                            try {
                                const { generateMagicLinkEmail } = await import("../../components/email/templates/MagicLinkInvite");
                                const { sendEmail } = await import("../../lib/email/transporter");
                                const { subject, html } = generateMagicLinkEmail({
                                    inviteUrl,
                                    recipientEmail: input.email,
                                    planTier: 'pro',
                                    role: 'viewer',
                                    expiresInDays: 30
                                });
                                await sendEmail({ to: input.email, subject, html });
                            } catch (emailErr) {
                                console.warn("[Waitlist] Auto invite email failed:", emailErr);
                            }
                            console.log("[Waitlist] Auto invite sent:", link.id);
                        }
                    }
                } catch (e) {
                    console.warn("[Waitlist] Auto invite failed:", e);
                }

                return { success: true, message: "Added to waiting list! A member of our team will reach out to you shortly." };
            }),

        list: adminProcedure
            .query(async () => {
                const d = await db.getDb();
                return d.select().from(waitingList).orderBy(sql`${waitingList.createdAt} DESC`);
            }),

        remove: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                console.log("[Waitlist] Attempting to remove ID:", input.id);
                try {
                    const d = await db.getDb();
                    const res = await d.delete(waitingList).where(eq(waitingList.id, input.id)).returning();
                    console.log("[Waitlist] Remove result:", res);
                    return { success: true };
                } catch (e) {
                    console.error("[Waitlist] Remove failed:", e);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to remove: ${(e as Error).message}`
                    });
                }
            }),

        updateStatus: adminProcedure
            .input(z.object({
                id: z.number(),
                status: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.update(waitingList)
                    .set({ status: input.status, updatedAt: new Date() })
                    .where(eq(waitingList.id, input.id));
                return { success: true };
            }),
        
        invite: adminProcedure
            .input(z.object({
                id: z.number(),
                role: z.enum(['viewer', 'editor', 'admin']).optional().default('viewer'),
                planTier: z.enum(['free', 'pro', 'enterprise']).optional().default('pro'),
                expiresInDays: z.number().optional().default(30),
                usageLimit: z.number().int().min(1).nullable().optional().default(1),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    console.log("[Waitlist] Invite called by:", ctx.user?.id, "for lead:", input.id);
                    const d = await db.getDb();
                    const [lead] = await d.select().from(waitingList).where(eq(waitingList.id, input.id)).limit(1);
                    if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Waitlist lead not found' });
                    if (!lead.email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lead email missing' });

                    const token = crypto.randomUUID();
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 30));

                    const [newLink] = await d.insert(magicLinks).values({
                        token,
                        label: `Waitlist Invite: ${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
                        email: lead.email,
                        role: input.role || 'viewer',
                        planTier: input.planTier || 'pro',
                        maxClients: 2,
                        accessDurationType: 'lifetime',
                        waitlistId: lead.id,
                        createdById: ctx.user.id,
                        expiresAt,
                        usageLimit: input.usageLimit ?? 1,
                    }).returning();

                    await d.update(waitingList).set({ status: 'invited', updatedAt: new Date() }).where(eq(waitingList.id, lead.id));

                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
                    const inviteUrl = `${baseUrl}/auth/redeem-link?token=${token}`;
                    try {
                        const { generateMagicLinkEmail } = await import("../../components/email/templates/MagicLinkInvite");
                        const { sendEmail } = await import("../../lib/email/transporter");
                        const { subject, html } = generateMagicLinkEmail({
                            inviteUrl,
                            recipientEmail: lead.email,
                            planTier: input.planTier || 'pro',
                            role: input.role || 'viewer',
                            expiresInDays: input.expiresInDays || 30
                        });
                        await sendEmail({ to: lead.email, subject, html });
                    } catch (e) {
                        console.warn("[Waitlist] Invite email failed:", e);
                    }

                    console.log("[Waitlist] Invite success:", newLink?.id);
                    return newLink;
                } catch (err: any) {
                    console.error("[Waitlist] Invite failed:", err);
                    if (err instanceof TRPCError) throw err;
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to send invite: ${err?.message || 'Unknown error'}`
                    });
                }
            }),
    });
};
