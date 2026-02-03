
import { z } from "zod";
import { getDb } from "../../db";
import { vendorRequests, vendors, vendorScans, vendorCveMatches } from "../../schema";
import { eq, desc } from "drizzle-orm";

export const createVendorRequestsRouter = (t: any, clientProcedure: any) => {
  return t.router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }: { input: any }) => {
        const db = await getDb();
        return db.select()
          .from(vendorRequests)
          .where(eq(vendorRequests.clientId, input.clientId))
          .orderBy(desc(vendorRequests.createdAt));
      }),

    submit: clientProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        website: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        businessOwner: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
        const db = await getDb();
        const [request] = await db.insert(vendorRequests).values({
            ...input,
            requesterId: ctx.user.id,
            status: 'pending'
        }).returning();
        return request;
      }),

    approve: clientProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
      }))
      .mutation(async ({ input }: { input: any }) => {
        const db = await getDb();
        
        return await db.transaction(async (tx) => {
            // 1. Get the request
            const [request] = await tx.select().from(vendorRequests).where(eq(vendorRequests.id, input.id));
            if (!request) throw new Error("Request not found");
            if (request.status !== 'pending') throw new Error("Request already processed");

            // 2. Create the Vendor - default to "Medium" criticality, status "Active"
            const [newVendor] = await tx.insert(vendors).values({
                clientId: input.clientId,
                name: request.name,
                description: request.description,
                website: request.website,
                category: request.category,
                criticality: 'Medium', 
                riskScore: 0,
                status: 'Active',
                owner: request.businessOwner
            }).returning();

            // 3. Update Request Status
            await tx.update(vendorRequests)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(vendorRequests.id, input.id));

            // 4. Trigger Automated Initial Scan (Simulated)
            const [scan] = await tx.insert(vendorScans).values({
                clientId: input.clientId,
                vendorId: newVendor.id,
                status: 'Completed',
                riskScore: 45, // Initial baseline
                vulnerabilityCount: 2,
                breachCount: 0,
                scanDate: new Date()
            }).returning();

            // Add simulated CVEs
            await tx.insert(vendorCveMatches).values([
                {
                    vendorId: newVendor.id,
                    scanId: scan.id,
                    cveId: "CVE-2023-1234",
                    description: "Initial discovery: Insecure SSL configuration",
                    cvssScore: "6.5",
                    matchScore: 80,
                    status: 'Active'
                },
                {
                    vendorId: newVendor.id,
                    scanId: scan.id,
                    cveId: "CVE-2023-5678",
                    description: "Initial discovery: Outdated framework version",
                    cvssScore: "4.8",
                    matchScore: 60,
                    status: 'Active'
                }
            ]);

            return { success: true, vendorId: newVendor.id, scanId: scan.id };
        });
      }),

    reject: clientProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string()
      }))
      .mutation(async ({ input }: { input: any }) => {
        const db = await getDb();
        await db.update(vendorRequests)
            .set({ 
                status: 'rejected', 
                rejectionReason: input.reason,
                updatedAt: new Date() 
            })
            .where(eq(vendorRequests.id, input.id));
        return { success: true };
      }),
  });
};
