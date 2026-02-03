import { z } from "zod";
import * as db from "../../db";
import { integrations } from "../../schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const integrationsRouter = (t: any, clientProcedure: any, isAuthed: any) => {
    return t.router({
        get: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.string()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const [integration] = await dbConn.select().from(integrations)
                    .where(and(
                        eq(integrations.clientId, input.clientId),
                        eq(integrations.provider, input.provider)
                    ))
                    .limit(1);
                return integration || null;
            }),

        update: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.string(),
                isEnabled: z.boolean().optional(),
                settings: z.any().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const { clientId, provider, ...data } = input;

                const [result] = await dbConn.insert(integrations).values({
                    clientId,
                    provider,
                    isEnabled: data.isEnabled ?? true,
                    settings: data.settings,
                    updatedAt: new Date()
                }).onConflictDoUpdate({
                    target: [integrations.clientId, integrations.provider],
                    set: {
                        isEnabled: data.isEnabled,
                        settings: data.settings,
                        updatedAt: new Date()
                    }
                }).returning();

                return result;
            }),

        testConnection: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.string(),
                email: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                // Core placeholder for testing
                // In a real app, this would trigger an email via the configured SMTP
                console.log(`Testing connection for ${input.provider} (Client: ${input.clientId})`);

                if (input.provider === 'smtp' && input.email) {
                    // Simulate SMTP success
                    return { success: true, message: "Test email queued." };
                }

                return { success: true };
            }),

        listActive: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select().from(integrations).where(eq(integrations.clientId, input.clientId));
            }),
    });
};
