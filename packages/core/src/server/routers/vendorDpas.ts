
import { z } from "zod";
import { getDb } from "../../db";
import { vendorDpas, dpaTemplates } from "../../schema";
import { eq, and, desc } from "drizzle-orm";

export const createVendorDpasRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({
                vendorId: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const db = await getDb();
                return db.select()
                    .from(vendorDpas)
                    .where(and(
                        eq(vendorDpas.vendorId, input.vendorId),
                        eq(vendorDpas.clientId, input.clientId)
                    ))
                    .orderBy(desc(vendorDpas.createdAt));
            }),

        get: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const db = await getDb();
                const [dpa] = await db.select()
                    .from(vendorDpas)
                    .where(and(
                        eq(vendorDpas.id, input.id),
                        eq(vendorDpas.clientId, input.clientId)
                    ))
                    .limit(1);
                return dpa;
            }),

        createFromTemplate: clientProcedure
            .input(z.object({
                clientId: z.number(),
                vendorId: z.number(),
                templateId: z.number(),
                name: z.string(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                console.log("[vendorDpas.createFromTemplate] Starting with input:", input);
                const db = await getDb();

                // Fetch template
                const [template] = await db.select()
                    .from(dpaTemplates)
                    .where(eq(dpaTemplates.id, input.templateId))
                    .limit(1);

                if (!template) {
                    console.error("[vendorDpas.createFromTemplate] Template not found for ID:", input.templateId);
                    throw new Error("Template not found");
                }

                try {
                    const [dpa] = await db.insert(vendorDpas).values({
                        clientId: input.clientId,
                        vendorId: input.vendorId,
                        templateId: input.templateId,
                        name: input.name,
                        content: template.content,
                        status: 'Draft',
                        version: template.version || 1,
                    }).returning();

                    console.log("[vendorDpas.createFromTemplate] Successfully created DPA:", dpa.id);
                    return dpa;
                } catch (err) {
                    console.error("[vendorDpas.createFromTemplate] Database error during insert:", err);
                    throw err;
                }
            }),

        update: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                content: z.string().optional(),
                status: z.string().optional(),
                signedAt: z.string().optional(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                const db = await getDb();
                const { id, clientId, signedAt, ...data } = input;

                const updateData: any = { ...data, updatedAt: new Date() };
                if (signedAt) updateData.signedAt = new Date(signedAt);

                const [dpa] = await db.update(vendorDpas)
                    .set(updateData)
                    .where(and(
                        eq(vendorDpas.id, id),
                        eq(vendorDpas.clientId, clientId)
                    ))
                    .returning();
                return dpa;
            }),

        delete: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number()
            }))
            .mutation(async ({ input }: { input: any }) => {
                const db = await getDb();
                await db.delete(vendorDpas).where(and(
                    eq(vendorDpas.id, input.id),
                    eq(vendorDpas.clientId, input.clientId)
                ));
                return { success: true };
            }),
    });
};
