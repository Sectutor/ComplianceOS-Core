import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, count, sql } from "drizzle-orm";
import * as crypto from "crypto";
import { sendEmail } from "../../lib/email/transporter";
import { generateMagicLinkEmail } from "../../components/email/templates/MagicLinkInvite";

import * as db from "../../db";
import { magicLinks, waitingList, magicLinkRedemptions, users } from "../../schema";
import { router, adminProcedure, publicProcedure } from "../trpc";

export const magicLinksRouter = router({
    getStats: adminProcedure.query(async () => {
        const dbConn = await db.getDb();

        const [stats] = await dbConn
            .select({
                total: count(),
                active: sql<number>`sum(case when ${magicLinks.status} = 'active' then 1 else 0 end)`,
                redeemed: sql<number>`sum(case when ${magicLinks.status} = 'accepted' then 1 else 0 end)`,
                revoked: sql<number>`sum(case when ${magicLinks.status} = 'revoked' then 1 else 0 end)`,
                totalRedemptions: sql<number>`sum(${magicLinks.useCount})`,
            })
            .from(magicLinks);

        return {
            total: Number(stats?.total || 0),
            active: Number(stats?.active || 0),
            redeemed: Number(stats?.redeemed || 0),
            revoked: Number(stats?.revoked || 0),
            totalRedemptions: Number(stats?.totalRedemptions || 0),
        };
    }),

    create: adminProcedure
        .input(z.object({
            label: z.string().optional(),
            email: z.string().email().optional(),
            role: z.string().default("viewer"),
            planTier: z.string().default("free"),
            maxClients: z.number().default(2),
            accessDurationType: z.enum(["lifetime", "limited"]).default("lifetime"),
            accessDurationDays: z.number().optional(),
            waitlistId: z.number().optional(),
            expiresInDays: z.number().default(7),
            usageLimit: z.number().int().min(1).nullable().default(1),
            restrictedDomains: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }: any) => {
            console.log("[MagicLinks] Create called by user:", ctx.user?.id);
            console.log("[MagicLinks] Input:", JSON.stringify(input));

            try {
                const dbConn = await db.getDb();
                console.log("[MagicLinks] DB Connected");

                const token = crypto.randomUUID();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

                console.log("[MagicLinks] generated token, inserting...");

                const [newLink] = await dbConn.insert(magicLinks).values({
                    token,
                    label: input.label,
                    email: input.email,
                    role: input.role,
                    planTier: input.planTier,
                    maxClients: input.maxClients,
                    accessDurationType: input.accessDurationType,
                    accessDurationDays: input.accessDurationDays,
                    waitlistId: input.waitlistId,
                    createdById: ctx.user.id,
                    expiresAt,
                    usageLimit: input.usageLimit,
                    restrictedDomains: input.restrictedDomains,
                }).returning();

                console.log("[MagicLinks] Insert success, ID:", newLink.id);

                // If waitlistId is provided, update waitlist status
                if (input.waitlistId) {
                    await dbConn.update(waitingList)
                        .set({ status: 'invited' })
                        .where(eq(waitingList.id, input.waitlistId));
                }

                // Send Email if address is provided
                if (input.email) {
                    console.log("[MagicLinks] Email provided, sending...");
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
                    const inviteUrl = `${baseUrl}/auth/redeem-link?token=${token}`;

                    try {
                        const { subject, html } = generateMagicLinkEmail({
                            inviteUrl,
                            recipientEmail: input.email,
                            planTier: input.planTier,
                            role: input.role,
                            expiresInDays: input.expiresInDays
                        });

                        await sendEmail({
                            to: input.email,
                            subject,
                            html,
                        });
                        console.log("[MagicLinks] Email sent or queued.");
                    } catch (error) {
                        console.error("Failed to send magic link email:", error);
                        // We don't throw here to ensure the link is still returned to the admin
                    }
                }

                return newLink;
            } catch (err: any) {
                console.error("[MagicLinks] CRITICAL ERROR:", err);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to create magic link: ${err.message}`,
                    cause: err
                });
            }
        }),

    list: adminProcedure
        .query(async () => {
            const dbConn = await db.getDb();
            return await dbConn.select().from(magicLinks).orderBy(desc(magicLinks.createdAt));
        }),

    get: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const [link] = await dbConn.select()
                .from(magicLinks)
                .where(eq(magicLinks.token, input.token))
                .limit(1);

            if (!link) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired magic link" });
            }

            if (link.status !== 'active') {
                throw new TRPCError({ code: "BAD_REQUEST", message: "This magic link has already been used or revoked" });
            }

            if (link.expiresAt && new Date() > link.expiresAt) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "This magic link has expired" });
            }

            return link;
        }),

    revoke: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            await dbConn.update(magicLinks)
                .set({ status: 'revoked' })
                .where(eq(magicLinks.id, input.id));
            return { success: true };
        }),

    delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            await dbConn.delete(magicLinks).where(eq(magicLinks.id, input.id));
            return { success: true };
        }),

    getRedemptions: adminProcedure
        .input(z.object({ magicLinkId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    redeemedAt: magicLinkRedemptions.redeemedAt,
                })
                .from(magicLinkRedemptions)
                .innerJoin(users, eq(magicLinkRedemptions.userId, users.id))
                .where(eq(magicLinkRedemptions.magicLinkId, input.magicLinkId))
                .orderBy(desc(magicLinkRedemptions.redeemedAt));
        }),
});
