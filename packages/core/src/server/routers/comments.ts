import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { comments, users } from "../../schema";
import { eq, and, desc } from "drizzle-orm";
import * as db from "../../db";

export const createCommentsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.enum(['control', 'policy', 'evidence']),
                entityId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const results = await dbConn.select({
                    comment: comments,
                    user: users,
                })
                    .from(comments)
                    .leftJoin(users, eq(comments.userId, users.id))
                    .where(and(
                        eq(comments.clientId, input.clientId),
                        eq(comments.entityType, input.entityType),
                        eq(comments.entityId, input.entityId)
                    ))
                    .orderBy(desc(comments.createdAt));

                return results.map((r: any) => ({
                    comment: r.comment,
                    user: {
                        id: r.user?.id,
                        name: r.user?.name,
                        email: r.user?.email,
                        role: r.user?.role
                    }
                }));
            }),

        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.enum(['control', 'policy', 'evidence']),
                entityId: z.number(),
                content: z.string()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                const [comment] = await dbConn.insert(comments).values({
                    clientId: input.clientId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    userId: ctx.user.id,
                    content: input.content
                }).returning();
                return comment;
            }),

        delete: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();

                // Get comment to check ownership
                const [comment] = await dbConn.select().from(comments).where(eq(comments.id, input.id));

                if (!comment) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                }

                // Check permission: Owner of comment OR Admin
                const isOwner = comment.userId === ctx.user.id;
                const isAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner'; // Global admin/owner
                const isClientAdmin = ctx.clientRole === 'admin' || ctx.clientRole === 'owner'; // Client admin/owner

                if (!isOwner && !isAdmin && !isClientAdmin) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own comments." });
                }

                await dbConn.delete(comments).where(eq(comments.id, input.id));
                return { success: true };
            }),
    });
};
