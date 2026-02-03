
import { z } from "zod";
import { assets, clientControls, assetCveMatches } from "../../schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../lib/audit";

export const createAssetsRouter = (t: any, clientProcedure: any, clientEditorProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                clientId: z.number(),
                category: z.string().optional(),
                search: z.string().optional(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                let query = db.select().from(assets).where(eq(assets.clientId, input.clientId));

                if (input.category) {
                    query = query.where(eq(assets.category, input.category));
                }

                // Apply search if needed (client side filtering might be better for small lists, but here is DB side)
                // Drizzle doesn't have easy LIKE for all fields, so skipping for now or adding basic name match

                const results = await query;
                return results;
            }),

        get: clientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [asset] = await db.select().from(assets)
                    .where(and(eq(assets.id, input.id), eq(assets.clientId, input.clientId)));

                if (!asset) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
                }
                return asset;
            }),

        create: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                category: z.string(),
                type: z.string().optional(),
                owner: z.string().optional(),
                criticality: z.string().optional(),
                description: z.string().optional(),
                ipAddress: z.string().optional(),
                macAddress: z.string().optional(),
                os: z.string().optional(),
                location: z.string().optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const [newAsset] = await db.insert(assets).values({
                    ...input,
                    status: "active",
                }).returning();

                await logActivity({
                    clientId: input.clientId,
                    userId: ctx.user.id,
                    action: "create",
                    entityType: "asset",
                    entityId: newAsset.id,
                    details: { name: input.name }
                });

                return newAsset;
            }),

        update: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                name: z.string().optional(),
                category: z.string().optional(),
                type: z.string().optional(),
                owner: z.string().optional(),
                criticality: z.string().optional(),
                status: z.string().optional(),
                description: z.string().optional(),
                ipAddress: z.string().optional(),
                location: z.string().optional(),
                tags: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { id, clientId, ...updates } = input;

                const [updated] = await db.update(assets)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(and(eq(assets.id, id), eq(assets.clientId, clientId)))
                    .returning();

                return updated;
            }),

        delete: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                await db.delete(assets)
                    .where(and(eq(assets.id, input.id), eq(assets.clientId, input.clientId)));

                return { success: true };
            }),
    });
};
