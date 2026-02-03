
import { z } from "zod";
import * as schema from "../../schema";
import * as db from "../../db";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createNotificationsRouter = (t: any, clientProcedure: any, adminProcedure: any) => {
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
                // Return empty list for now until logging is fully implemented
                return [];
            }),

        sendOverdueAlert: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                return { itemCount: 0, sent: true };
            }),

        sendUpcomingAlert: adminProcedure
            .input(z.object({
                clientId: z.number().optional(),
                days: z.number().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                return { itemCount: 0, sent: true };
            }),

        sendDailyDigest: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                return { overdueCount: 0, upcomingCount: 0, sent: true };
            }),

        sendWeeklyDigest: adminProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .mutation(async ({ input, ctx }: any) => {
                return { overdueCount: 0, upcomingCount: 0, sent: true };
            }),
    });
};
