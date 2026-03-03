import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and } from "drizzle-orm";

export const createKrisRouter = (t: any, procedure: any) => {
    return t.router({
        // List all KRIs for a client
        list: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                const krisList = await db
                    .select()
                    .from(schema.kris)
                    .where(eq(schema.kris.clientId, input.clientId))
                    .orderBy(schema.kris.name);

                return krisList;
            }),

        // Get a single KRI by ID
        get: procedure
            .input(z.object({ id: z.number(), clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                const kri = await db
                    .select()
                    .from(schema.kris)
                    .where(and(eq(schema.kris.id, input.id), eq(schema.kris.clientId, input.clientId)))
                    .limit(1);

                if (!kri.length) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'KRI not found'
                    });
                }

                return kri[0];
            }),

        // Create a new KRI
        create: procedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                description: z.string().optional(),
                thresholdGreen: z.string().optional(),
                thresholdAmber: z.string().optional(),
                thresholdRed: z.string().optional(),
                currentValue: z.string().optional(),
                currentStatus: z.enum(["green", "amber", "red"]).default("green"),
                owner: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create KRIs' });
                }

                const db = await getDb();

                const [created] = await db
                    .insert(schema.kris)
                    .values({
                        clientId: input.clientId,
                        name: input.name,
                        description: input.description,
                        thresholdGreen: input.thresholdGreen,
                        thresholdAmber: input.thresholdAmber,
                        thresholdRed: input.thresholdRed,
                        currentValue: input.currentValue,
                        currentStatus: input.currentStatus,
                        owner: input.owner,
                        status: 'active'
                    })
                    .returning();

                return created;
            }),

        // Update an existing KRI
        update: procedure
            .input(z.object({
                id: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                thresholdGreen: z.string().optional(),
                thresholdAmber: z.string().optional(),
                thresholdRed: z.string().optional(),
                currentValue: z.string().optional(),
                currentStatus: z.enum(["green", "amber", "red"]).optional(),
                owner: z.string().optional(),
                status: z.enum(["active", "archived"]).optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update KRIs' });
                }

                const db = await getDb();
                const { id, ...updateData } = input;

                const [updated] = await db
                    .update(schema.kris)
                    .set({
                        ...updateData,
                        lastUpdated: new Date()
                    })
                    .where(eq(schema.kris.id, id))
                    .returning();

                if (!updated) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'KRI not found'
                    });
                }

                return updated;
            }),

        // Delete a KRI
        delete: procedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot delete KRIs' });
                }

                const db = await getDb();

                const [deleted] = await db
                    .delete(schema.kris)
                    .where(eq(schema.kris.id, input.id))
                    .returning();

                if (!deleted) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'KRI not found'
                    });
                }

                return deleted;
            })
    });
};
