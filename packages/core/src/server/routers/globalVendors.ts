import { z } from "zod";
import { getDb } from "../../db";
import { globalVendors, vendors } from "../../schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createGlobalVendorsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                search: z.string().optional(),
                limit: z.number().default(50),
                offset: z.number().default(0),
            }))
            .query(async ({ input }: { input: { search?: string, limit: number, offset: number } }) => {
                const db = await getDb();
                let query = db.select().from(globalVendors);

                if (input.search) {
                    query = query.where(
                        or(
                            ilike(globalVendors.name, `%${input.search}%`),
                            ilike(globalVendors.website, `%${input.search}%`)
                        )
                    ) as any;
                }

                return await query
                    .limit(input.limit)
                    .offset(input.offset)
                    .orderBy(globalVendors.name);
            }),

        import: clientProcedure
            .input(z.object({
                clientId: z.number(),
                globalVendorId: z.number()
            }))
            .mutation(async ({ input }: { input: { clientId: number, globalVendorId: number } }) => {
                console.log("Starting globalVendors.import", input);
                const db = await getDb();

                try {
                    // 1. Get global vendor details
                    console.log("Fetching global vendor...");
                    const [globalVendor] = await db.select()
                        .from(globalVendors)
                        .where(eq(globalVendors.id, input.globalVendorId))
                        .limit(1);

                    if (!globalVendor) {
                        console.error("Global vendor not found");
                        throw new TRPCError({ code: "NOT_FOUND", message: "Global vendor not found" });
                    }
                    console.log("Found global vendor:", globalVendor);

                    // 2. Check if already exists in organization
                    console.log("Checking for existing vendor...");
                    const existing = await db.select()
                        .from(vendors)
                        .where(and(eq(vendors.clientId, input.clientId), eq(vendors.website, globalVendor.website)))
                        .limit(1);

                    if (existing.length > 0) {
                        console.log("Vendor already exists:", existing[0]);
                        return existing[0];
                    }

                    // 3. Create organization vendor
                    console.log("Creating new vendor...");
                    const [newVendor] = await db.insert(vendors).values({
                        clientId: input.clientId,
                        name: globalVendor.name,
                        website: globalVendor.website,
                        trustCenterUrl: globalVendor.trustCenterUrl,
                        category: "SaaS", // Default
                        status: "Active",
                        reviewStatus: "active", // Directly mark as active since it's from global database
                        source: "Global Catalog",
                        discoveryDate: new Date(),
                        criticality: "Medium",
                        dataAccess: "Internal"
                    }).returning();
                    console.log("Created new vendor:", newVendor);

                    // 4. Trigger AI VRM Agent analysis if we didn't have data yet
                    if (newVendor.trustCenterUrl) {
                        (async () => {
                            try {
                                console.log("Triggering VRM Agent...");
                                const { vrmAgent } = await import('../../lib/ai/vrm-agent');
                                await vrmAgent.analyzeTrustCenter(newVendor.id, newVendor.trustCenterUrl);
                            } catch (e) {
                                console.error("Post-import analysis failed:", e);
                            }
                        })();
                    }

                    return newVendor;
                } catch (error) {
                    console.error("Error in globalVendors.import:", error);
                    throw error;
                }
            }),
    });
};
