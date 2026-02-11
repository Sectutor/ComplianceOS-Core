
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { emailTriggers, emailTemplates } from "../../schema";
import { router, adminProcedure, protectedProcedure } from "../trpc";

export const emailTriggersRouter = router({
    list: protectedProcedure.query(async () => {
        const db = await getDb();
        return await db.select({
            id: emailTriggers.id,
            eventSlug: emailTriggers.eventSlug,
            description: emailTriggers.description,
            templateId: emailTriggers.templateId,
            templateName: emailTemplates.name,
            templateSlug: emailTemplates.slug,
        })
            .from(emailTriggers)
            .leftJoin(emailTemplates, eq(emailTriggers.templateId, emailTemplates.id))
            .orderBy(desc(emailTriggers.updatedAt));
    }),

    assign: adminProcedure
        .input(z.object({
            eventSlug: z.string(),
            templateId: z.number().nullable(),
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [updated] = await db.update(emailTriggers)
                .set({ templateId: input.templateId, updatedAt: new Date() })
                .where(eq(emailTriggers.eventSlug, input.eventSlug))
                .returning();

            if (!updated) {
                // If it doesn't exist, create it (upsert-like)
                const [inserted] = await db.insert(emailTriggers)
                    .values({
                        eventSlug: input.eventSlug,
                        templateId: input.templateId,
                        updatedAt: new Date()
                    })
                    .returning();
                return inserted;
            }

            return updated;
        }),
});
