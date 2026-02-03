
import { z } from "zod";
import { getDb } from "../../db";
import { vendorContracts } from "../../schema";
import { eq } from "drizzle-orm";

export const createVendorContractsRouter = (t: any, clientProcedure: any) => {
  return t.router({
    list: clientProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }: { input: any }) => {
        const db = await getDb();
        return db.select().from(vendorContracts).where(eq(vendorContracts.vendorId, input.vendorId));
      }),

    create: clientProcedure
      .input(z.object({
        clientId: z.number(),
        vendorId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        autoRenew: z.boolean().default(false),
        value: z.string().optional(),
        status: z.string().default('Active'),
        documentUrl: z.string().optional(),
        // New Fields
        noticePeriod: z.string().optional(),
        paymentTerms: z.string().optional(),
        slaDetails: z.string().optional(),
        dpaStatus: z.string().default('Not Signed'),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }: { input: any }) => {
        const db = await getDb();
        const { startDate, endDate, ...rest } = input;
        const [contract] = await db.insert(vendorContracts).values({
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        }).returning();
        return contract;
      }),

    update: clientProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        autoRenew: z.boolean().optional(),
        value: z.string().optional(),
        status: z.string().optional(),
        documentUrl: z.string().optional(),
        noticePeriod: z.string().optional(),
        paymentTerms: z.string().optional(),
        slaDetails: z.string().optional(),
        dpaStatus: z.string().optional(),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }: { input: any }) => {
        const db = await getDb();
        const { id, startDate, endDate, ...data } = input;
        
        const updateData: any = { ...data, updatedAt: new Date() };
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);

        const [contract] = await db.update(vendorContracts)
          .set(updateData)
          .where(eq(vendorContracts.id, id))
          .returning();
        return contract;
      }),

    delete: clientProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: { input: any }) => {
            const db = await getDb();
            await db.delete(vendorContracts).where(eq(vendorContracts.id, input.id));
            return { success: true };
        }),
  });
};
