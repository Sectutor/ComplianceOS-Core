import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

import * as db from "../../db";
import { systemFeedback, users, clients } from "../../schema";
import { router, adminProcedure, protectedProcedure } from "../trpc";

export const feedbackRouter = router({
    submit: protectedProcedure
        .input(z.object({
            type: z.enum(['bug', 'feature', 'improvement']),
            title: z.string().min(1).max(255),
            description: z.string().min(1),
            url: z.string().max(1024).optional(),
            clientId: z.number().optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();

            // Allow clientId from input or context
            const effectiveClientId = input.clientId || ctx.clientId || null;

            await dbConn.insert(systemFeedback).values({
                userId: ctx.user?.id, // Should exist due to protectedProcedure
                clientId: effectiveClientId,
                type: input.type,
                title: input.title,
                description: input.description,
                url: input.url,
                status: 'new'
            });

            return { success: true };
        }),

    list: adminProcedure
        .query(async () => {
            const dbConn = await db.getDb();

            // Join with users and clients to get names
            const items = await dbConn.select({
                id: systemFeedback.id,
                type: systemFeedback.type,
                title: systemFeedback.title,
                description: systemFeedback.description,
                url: systemFeedback.url,
                status: systemFeedback.status,
                adminNotes: systemFeedback.adminNotes,
                createdAt: systemFeedback.createdAt,
                updatedAt: systemFeedback.updatedAt,
                userName: users.name,
                userEmail: users.email,
                clientName: clients.name
            })
                .from(systemFeedback)
                .leftJoin(users, eq(systemFeedback.userId, users.id))
                .leftJoin(clients, eq(systemFeedback.clientId, clients.id))
                .orderBy(desc(systemFeedback.createdAt));

            return items;
        }),

    updateStatus: adminProcedure
        .input(z.object({
            id: z.number(),
            status: z.string(),
            adminNotes: z.string().optional()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            await dbConn.update(systemFeedback)
                .set({
                    status: input.status,
                    ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
                    updatedAt: new Date()
                })
                .where(eq(systemFeedback.id, input.id));

            return { success: true };
        })
});
