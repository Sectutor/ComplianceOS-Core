import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq } from "drizzle-orm";

export const createRiskSettingsRouter = (t: any, protectedProcedure: any, premiumClientProcedure: any) => {
    return t.router({
        // Get risk settings for a client - requires authentication and premium access
        get: premiumClientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();

                const settings = await db.query.riskSettings.findFirst({
                    where: eq(schema.riskSettings.clientId, input.clientId)
                });

                // If no settings exist, return null and let the frontend handle defaults
                if (!settings) {
                    return null;
                }

                return settings;
            }),

        // Create or update risk settings - requires authentication and premium access
        update: premiumClientProcedure
            .input(z.object({
                clientId: z.number(),
                scope: z.string().optional(),
                context: z.string().optional(),
                riskAppetite: z.string().optional(),
                methodology: z.string().optional(),
                riskTolerance: z.array(z.object({
                    category: z.string(),
                    threshold: z.string(),
                    unit: z.string()
                })).optional(),
                impactCriteria: z.array(z.object({
                    level: z.number(),
                    name: z.string(),
                    description: z.string()
                })).optional(),
                likelihoodCriteria: z.array(z.object({
                    level: z.number(),
                    name: z.string(),
                    description: z.string()
                })).optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Check if settings exist for this client
                const existing = await db.query.riskSettings.findFirst({
                    where: eq(schema.riskSettings.clientId, input.clientId)
                });

                if (existing) {
                    // Update existing settings
                    const [updated] = await db
                        .update(schema.riskSettings)
                        .set({
                            scope: input.scope,
                            context: input.context,
                            riskAppetite: input.riskAppetite,
                            methodology: input.methodology,
                            riskTolerance: input.riskTolerance,
                            impactCriteria: input.impactCriteria,
                            likelihoodCriteria: input.likelihoodCriteria,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.riskSettings.clientId, input.clientId))
                        .returning();

                    return updated;
                } else {
                    // Create new settings
                    const [created] = await db
                        .insert(schema.riskSettings)
                        .values({
                            clientId: input.clientId,
                            scope: input.scope || "",
                            context: input.context || "",
                            riskAppetite: input.riskAppetite || "",
                            methodology: input.methodology || "ISO 27005",
                            riskTolerance: input.riskTolerance || [],
                            impactCriteria: input.impactCriteria || [],
                            likelihoodCriteria: input.likelihoodCriteria || []
                        })
                        .returning();

                    return created;
                }
            })
    });
};
