
import { z } from 'zod';
import { crmLeads, crmDeals, crmDealStages } from '../../../schema';
import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../../../db';

export const createSalesRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // Leads Management
        getLeads: clientProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                if (input.clientId) {
                    return await db.select().from(crmLeads).where(eq(crmLeads.clientId, input.clientId));
                }
                return await db.select().from(crmLeads);
            }),

        createLead: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().email().optional(),
                companyName: z.string().optional(),
                status: z.string().default('new'),
                ownerId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                return await db.insert(crmLeads).values(input).returning();
            }),

        // Pipeline Stages
        getStages: clientProcedure
            .query(async () => {
                const db = await getDb();
                return await db.select().from(crmDealStages).orderBy(crmDealStages.order);
            }),

        // Deals Management
        getDeals: clientProcedure
            .input(z.object({ stageId: z.number().optional() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                let query = db.select().from(crmDeals);
                if (input.stageId) {
                    query = query.where(eq(crmDeals.stageId, input.stageId));
                }
                return await query;
            }),

        createDeal: clientProcedure
            .input(z.object({
                title: z.string(),
                value: z.number(),
                stageId: z.number(),
                leadId: z.number().optional(),
                ownerId: z.number().optional(),
                expectedCloseDate: z.string().optional(), // Receive as string, Drizzle handles conversion if configured or we parse
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                return await db.insert(crmDeals).values({
                    ...input,
                    expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined
                }).returning();
            }),

        updateDealStage: clientProcedure
            .input(z.object({
                dealId: z.number(),
                stageId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                return await db.update(crmDeals)
                    .set({ stageId: input.stageId })
                    .where(eq(crmDeals.id, input.dealId));
            })
    });
};
