import { z } from "zod";
import * as db from "../../db";
import { waitingList } from "../../schema";
import { eq, sql } from "drizzle-orm";
import { notifyOwner } from "../../notification";
import { sendInternalSystemEmail } from "../../lib/email/internalSender";
import { TRPCError } from "@trpc/server";

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
    });
};
