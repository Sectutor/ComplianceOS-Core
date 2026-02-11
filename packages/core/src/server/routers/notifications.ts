
import { z } from "zod";
import * as schema from "../../schema";
import * as db from "../../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createNotificationsRouter = (t: any, clientProcedure: any, adminProcedure: any, protectedProcedure: any) => {
    return t.router({
        getSettings: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();

                const settings = await dbConn.select().from(schema.notificationSettings)
                    .where(eq(schema.notificationSettings.clientId, input.clientId))
                    .limit(1);

                if (settings.length === 0) {
                    return {
                        clientId: input.clientId,
                        emailEnabled: true,
                        overdueEnabled: true,
                        upcomingReviewDays: 7,
                        dailyDigestEnabled: false,
                        weeklyDigestEnabled: true,
                        notifyControlReviews: true,
                        notifyPolicyRenewals: true,
                        notifyEvidenceExpiration: true,
                        notifyRiskReviews: true
                    };
                }

                return settings[0];
            }),

        sendEvent: protectedProcedure
            .input(z.object({
                event: z.string(),
                to: z.string(),
                data: z.record(z.any()).optional(),
                clientId: z.number().optional(),
                from: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const { EmailService } = await import("../../lib/email/service");
                const res = await EmailService.triggerEvent({
                    event: input.event,
                    to: input.to,
                    data: input.data || {},
                    clientId: input.clientId,
                    from: input.from
                });
                return res;
            }),

        updateSettings: clientProcedure
            .input(z.object({
                clientId: z.number(),
                emailEnabled: z.boolean().optional(),
                overdueEnabled: z.boolean().optional(),
                upcomingReviewDays: z.number().optional(),
                dailyDigestEnabled: z.boolean().optional(),
                weeklyDigestEnabled: z.boolean().optional(),
                notifyControlReviews: z.boolean().optional(),
                notifyPolicyRenewals: z.boolean().optional(),
                notifyEvidenceExpiration: z.boolean().optional(),
                notifyRiskReviews: z.boolean().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                const { clientId, ...updates } = input;

                const existing = await dbConn.select().from(schema.notificationSettings)
                    .where(eq(schema.notificationSettings.clientId, clientId))
                    .limit(1);

                if (existing.length === 0) {
                    await dbConn.insert(schema.notificationSettings).values({
                        clientId,
                        ...updates
                    });
                } else {
                    await dbConn.update(schema.notificationSettings)
                        .set({ ...updates, updatedAt: new Date() })
                        .where(eq(schema.notificationSettings.clientId, clientId));
                }

                return { success: true };
            }),

        getLogs: clientProcedure
            .input(z.object({
                clientId: z.number(),
                limit: z.number().optional().default(20)
            }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select()
                    .from(schema.notificationLog)
                    .where(eq(schema.notificationLog.userId, ctx.user.id)) // Assuming ctx.user.id is available
                    .orderBy(desc(schema.notificationLog.sentAt))
                    .limit(input.limit);
            }),

        getNotifications: clientProcedure
            .input(z.object({
                limit: z.number().optional().default(50)
            }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select()
                    .from(schema.notificationLog)
                    .where(eq(schema.notificationLog.userId, ctx.user.id))
                    .orderBy(desc(schema.notificationLog.sentAt))
                    .limit(input.limit);
            }),

        getUnreadCount: protectedProcedure
            .query(async ({ ctx }: any) => {
                const dbConn = await db.getDb();
                const result = await dbConn.select({
                    count: sql<number>`count(*)`
                })
                    .from(schema.notificationLog)
                    .where(and(
                        eq(schema.notificationLog.userId, ctx.user.id),
                        sql`${schema.notificationLog.readAt} IS NULL`
                    ));
                return result[0]?.count || 0;
            }),

        markAsRead: clientProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                await dbConn.update(schema.notificationLog)
                    .set({ readAt: new Date() })
                    .where(and(
                        eq(schema.notificationLog.id, input.id),
                        eq(schema.notificationLog.userId, ctx.user.id)
                    ));
                return { success: true };
            }),

        markAllAsRead: clientProcedure
            .mutation(async ({ ctx }: any) => {
                const dbConn = await db.getDb();
                await dbConn.update(schema.notificationLog)
                    .set({ readAt: new Date() })
                    .where(and(
                        eq(schema.notificationLog.userId, ctx.user.id),
                        sql`${schema.notificationLog.readAt} IS NULL`
                    ));
                return { success: true };
            }),

        sendOverdueAlert: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                const { sendOverdueNotification } = await import("../../emailNotification");
                const result = await sendOverdueNotification();
                return { ...result, sent: true };
            }),

        sendUpcomingAlert: adminProcedure
            .input(z.object({
                clientId: z.number().optional(),
                days: z.number().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const { sendUpcomingNotification } = await import("../../emailNotification");
                const result = await sendUpcomingNotification(input.days);
                return { ...result, sent: true };
            }),

        sendDailyDigest: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                const { sendDailyDigest } = await import("../../emailNotification");
                const result = await sendDailyDigest();
                return { ...result, sent: true };
            }),

        sendWeeklyDigest: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                const { sendWeeklyDigest } = await import("../../emailNotification");
                const result = await sendWeeklyDigest();
                return { ...result, sent: true };
            }),
    });
};
