import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { emailTemplates } from "../../schema";
import { router, adminProcedure, protectedProcedure } from "../trpc";

export const emailTemplatesRouter = router({
    list: protectedProcedure.query(async () => {
        const db = await getDb();
        return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.updatedAt));
    }),

    get: adminProcedure
        .input(z.object({ id: z.number().optional(), slug: z.string().optional() }))
        .query(async ({ input }: any) => {
            const db = await getDb();
            let query = db.select().from(emailTemplates);

            if (input.id) {
                query = query.where(eq(emailTemplates.id, input.id)) as any;
            } else if (input.slug) {
                query = query.where(eq(emailTemplates.slug, input.slug)) as any;
            } else {
                throw new TRPCError({ code: "BAD_REQUEST", message: "ID or Slug required" });
            }

            const [template] = await query.limit(1);
            if (!template) throw new TRPCError({ code: "NOT_FOUND" });
            return template;
        }),

    update: adminProcedure
        .input(z.object({
            id: z.number(),
            subject: z.string(),
            content: z.string(),
            name: z.string().optional(),
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const { id, ...data } = input;

            const [updated] = await db.update(emailTemplates)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(emailTemplates.id, id))
                .returning();

            return updated;
        }),

    create: adminProcedure
        .input(z.object({
            slug: z.string(),
            name: z.string(),
            subject: z.string(),
            content: z.string(),
            description: z.string().optional(),
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [newTemplate] = await db.insert(emailTemplates)
                .values(input)
                .returning();
            return newTemplate;
        }),

    delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [deleted] = await db.delete(emailTemplates)
                .where(eq(emailTemplates.id, input.id))
                .returning();

            if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
            return deleted;
        }),
});
