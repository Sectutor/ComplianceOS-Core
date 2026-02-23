import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { comments, users } from "../../schema";
import { eq, and, desc } from "drizzle-orm";
import * as db from "../../db";
import { logActivity } from "../../lib/audit";

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
                content: z.string(),
                parentId: z.number().optional(),
                context: z.any().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                const [comment] = await dbConn.insert(comments).values({
                    clientId: input.clientId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    userId: ctx.user.id,
                    content: input.content,
                    parentId: input.parentId,
                    context: input.context
                }).returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: 'comment',
                    entityType: input.entityType,
                    entityId: input.entityId,
                    details: { content: input.content, commentId: comment.id }
                });

                return comment;
            }),

        resolve: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                resolved: z.boolean()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                await dbConn.update(comments)
                    .set({
                        isResolved: input.resolved,
                        resolvedBy: input.resolved ? ctx.user.id : null,
                        resolvedAt: input.resolved ? new Date() : null,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(comments.id, input.id),
                        eq(comments.clientId, input.clientId)
                    ));
                return { success: true };
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
                const isAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner' || ctx.user.role === 'super_admin'; // Global admin/owner/super_admin
                const isClientAdmin = ctx.clientRole === 'admin' || ctx.clientRole === 'owner'; // Client admin/owner

                if (!isOwner && !isAdmin && !isClientAdmin) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own comments." });
                }

                await dbConn.delete(comments).where(eq(comments.id, input.id));
                return { success: true };
            }),
    });
};
