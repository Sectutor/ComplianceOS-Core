import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and } from "drizzle-orm";

export const createSubprocessorsRouter = (t: any, premiumClientProcedure: any, publicProcedure: any) => {
    return t.router({
        /**
         * List all subprocessors for a client
         * Subprocessors are vendors marked with isSubprocessor=true
         */
        list: premiumClientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Fetch vendors that are marked as subprocessors
                const subprocessors = await db.select({
                    id: schema.vendors.id,
                    name: schema.vendors.name,
                    website: schema.vendors.website,
                    category: schema.vendors.category,
                    status: schema.vendors.status,
                    dataLocation: schema.vendors.dataLocation,
                    transferMechanism: schema.vendors.transferMechanism,
                    isSubprocessor: schema.vendors.isSubprocessor,
                    recursiveSubprocessors: schema.vendors.recursiveSubprocessors,
                    dpaAnalysis: schema.vendors.dpaAnalysis,
                    lastTrustCenterChange: schema.vendors.lastTrustCenterChange,
                    createdAt: schema.vendors.createdAt,
                    updatedAt: schema.vendors.updatedAt
                })
                    .from(schema.vendors)
                    .where(and(
                        eq(schema.vendors.clientId, input.clientId),
                        eq(schema.vendors.isSubprocessor, true)
                    ));

                return subprocessors;
            }),

        /**
         * Get subprocessor by ID
         */
        get: premiumClientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                const [subprocessor] = await db.select({
                    id: schema.vendors.id,
                    name: schema.vendors.name,
                    website: schema.vendors.website,
                    category: schema.vendors.category,
                    status: schema.vendors.status,
                    description: schema.vendors.description,
                    serviceDescription: schema.vendors.serviceDescription,
                    dataLocation: schema.vendors.dataLocation,
                    transferMechanism: schema.vendors.transferMechanism,
                    isSubprocessor: schema.vendors.isSubprocessor,
                    recursiveSubprocessors: schema.vendors.recursiveSubprocessors,
                    dpaAnalysis: schema.vendors.dpaAnalysis,
                    lastTrustCenterChange: schema.vendors.lastTrustCenterChange,
                    trustScore: schema.vendors.trustScore,
                    trustCenterUrl: schema.vendors.trustCenterUrl,
                    createdAt: schema.vendors.createdAt,
                    updatedAt: schema.vendors.updatedAt
                })
                    .from(schema.vendors)
                    .where(and(
                        eq(schema.vendors.id, input.id),
                        eq(schema.vendors.clientId, input.clientId),
                        eq(schema.vendors.isSubprocessor, true)
                    ));

                if (!subprocessor) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Subprocessor not found'
                    });
                }

                return subprocessor;
            }),

        /**
         * Create or update a subprocessor
         * Uses the vendors table with isSubprocessor flag
         */
        upsert: premiumClientProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number().optional(),
                name: z.string().min(1).max(255),
                website: z.string().optional().refine(
                    (val) => !val || val.length === 0 || /^https?:\/\/.+/.test(val),
                    { message: 'Invalid URL format - must start with http:// or https://' }
                ),
                category: z.string().optional().default('Subprocessor'),
                description: z.string().optional(),
                serviceDescription: z.string().optional(),
                dataLocation: z.string().optional(),
                transferMechanism: z.string().optional(),
                recursiveSubprocessors: z.array(z.object({
                    name: z.string(),
                    purpose: z.string(),
                    location: z.string()
                })).optional(),
                status: z.enum(['Active', 'Onboarding', 'Offboarding', 'Offboarded']).default('Active')
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                const vendorData = {
                    clientId: input.clientId,
                    name: input.name,
                    website: input.website || null,
                    category: input.category || 'Subprocessor',
                    description: input.description || null,
                    serviceDescription: input.serviceDescription || null,
                    dataLocation: input.dataLocation || null,
                    transferMechanism: input.transferMechanism || null,
                    recursiveSubprocessors: input.recursiveSubprocessors || null,
                    isSubprocessor: true,
                    status: input.status,
                    updatedAt: new Date()
                };

                if (input.id) {
                    // Update existing
                    await db.update(schema.vendors)
                        .set(vendorData)
                        .where(and(
                            eq(schema.vendors.id, input.id),
                            eq(schema.vendors.clientId, input.clientId)
                        ));

                    return { success: true, id: input.id, action: 'updated' };
                } else {
                    // Create new
                    const [created] = await db.insert(schema.vendors)
                        .values({
                            ...vendorData,
                            createdAt: new Date()
                        })
                        .returning({ id: schema.vendors.id });

                    return { success: true, id: created.id, action: 'created' };
                }
            }),

        /**
         * Delete a subprocessor (soft delete by changing status)
         */
        delete: premiumClientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                // Soft delete - change status to Offboarded
                await db.update(schema.vendors)
                    .set({
                        status: 'Offboarded',
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(schema.vendors.id, input.id),
                        eq(schema.vendors.clientId, input.clientId),
                        eq(schema.vendors.isSubprocessor, true)
                    ));

                return { success: true };
            }),

        /**
         * Get tree map data for subprocessor visualization
         * Returns data in format suitable for tree map component
         */
        getMap: premiumClientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Fetch subprocessors grouped by data location
                const subprocessors = await db.select({
                    id: schema.vendors.id,
                    name: schema.vendors.name,
                    dataLocation: schema.vendors.dataLocation,
                    category: schema.vendors.category,
                    status: schema.vendors.status,
                    trustScore: schema.vendors.trustScore
                })
                    .from(schema.vendors)
                    .where(and(
                        eq(schema.vendors.clientId, input.clientId),
                        eq(schema.vendors.isSubprocessor, true)
                    ));

                // Group by data location for tree map
                const locationMap = new Map<string, typeof subprocessors>();
                subprocessors.forEach((sub: typeof subprocessors[number]) => {
                    const location = sub.dataLocation || 'Unknown Location';
                    if (!locationMap.has(location)) {
                        locationMap.set(location, []);
                    }
                    locationMap.get(location)!.push(sub);
                });

                // Convert to tree map format
                const treeData = Array.from(locationMap.entries()).map(([location, subs]) => ({
                    name: location,
                    children: subs.map((s: typeof subprocessors[number]) => ({
                        id: s.id,
                        name: s.name,
                        category: s.category,
                        status: s.status,
                        trustScore: s.trustScore
                    }))
                }));

                return treeData;
            }),

        /**
         * Analyze a subprocessor from their trust center URL
         */
        analyze: premiumClientProcedure
            .input(z.object({
                clientId: z.number(),
                vendorId: z.number().optional(),
                url: z.string().url(),
                name: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                // For now, just create/update the vendor with the trust center URL
                // The actual analysis would be done by an AI service
                if (input.vendorId) {
                    await db.update(schema.vendors)
                        .set({
                            trustCenterUrl: input.url,
                            lastTrustCenterChange: new Date(),
                            updatedAt: new Date()
                        })
                        .where(and(
                            eq(schema.vendors.id, input.vendorId),
                            eq(schema.vendors.clientId, input.clientId)
                        ));
                } else if (input.name) {
                    // Create new subprocessor entry
                    await db.insert(schema.vendors).values({
                        clientId: input.clientId,
                        name: input.name,
                        trustCenterUrl: input.url,
                        isSubprocessor: true,
                        category: 'Subprocessor',
                        status: 'Onboarding',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                return {
                    success: true,
                    message: 'Subprocessor analysis initiated. Trust center URL recorded.'
                };
            })
    });
};
