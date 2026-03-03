import { z } from "zod";
import { getDb } from "../../db";
import { learningFrameworks, learningSections } from "../../schema";
import { eq, asc } from "drizzle-orm";

export const createLearningRouter = (t: any, publicProcedure: any, adminProcedure: any) => {
    return t.router({
        // List all frameworks
        listFrameworks: publicProcedure.query(async () => {
            const db = await getDb();
            return db.select()
                .from(learningFrameworks)
                .where(eq(learningFrameworks.isActive, true))
                .orderBy(asc(learningFrameworks.sortOrder));
        }),

        // Get single framework with sections
        getFramework: publicProcedure
            .input(z.object({ frameworkId: z.string() }))
            .query(async ({ input }: { input: any }) => {
                const db = await getDb();

                const [framework] = await db.select()
                    .from(learningFrameworks)
                    .where(eq(learningFrameworks.frameworkId, input.frameworkId))
                    .limit(1);

                if (!framework) return null;

                const sections = await db.select()
                    .from(learningSections)
                    .where(eq(learningSections.frameworkId, framework.id))
                    .orderBy(asc(learningSections.sortOrder));

                return { framework, sections };
            }),

        // Get all sections for a framework
        listSections: publicProcedure
            .input(z.object({ frameworkId: z.string() }))
            .query(async ({ input }: { input: any }) => {
                const db = await getDb();

                const [framework] = await db.select()
                    .from(learningFrameworks)
                    .where(eq(learningFrameworks.frameworkId, input.frameworkId))
                    .limit(1);

                if (!framework) return [];

                return db.select()
                    .from(learningSections)
                    .where(eq(learningSections.frameworkId, framework.id))
                    .orderBy(asc(learningSections.sortOrder));
            }),

        // Admin: Create/update framework
        upsertFramework: adminProcedure
            .input(z.object({
                frameworkId: z.string(),
                title: z.string(),
                description: z.string().optional(),
                color: z.string().optional(),
                icon: z.string().optional(),
                sortOrder: z.number().optional(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                const db = await getDb();

                const existing = await db.select()
                    .from(learningFrameworks)
                    .where(eq(learningFrameworks.frameworkId, input.frameworkId))
                    .limit(1);

                if (existing.length > 0) {
                    const [updated] = await db.update(learningFrameworks)
                        .set({
                            title: input.title,
                            description: input.description,
                            color: input.color,
                            icon: input.icon,
                            sortOrder: input.sortOrder,
                            updatedAt: new Date()
                        })
                        .where(eq(learningFrameworks.id, existing[0].id))
                        .returning();
                    return updated;
                } else {
                    const [created] = await db.insert(learningFrameworks)
                        .values({
                            frameworkId: input.frameworkId,
                            title: input.title,
                            description: input.description,
                            color: input.color || "bg-blue-600",
                            icon: input.icon,
                            sortOrder: input.sortOrder || 0,
                        })
                        .returning();
                    return created;
                }
            }),

        // Admin: Create/update section
        upsertSection: adminProcedure
            .input(z.object({
                frameworkId: z.string(),
                sectionId: z.string(),
                title: z.string(),
                icon: z.string().optional(),
                content: z.string(),
                sortOrder: z.number().optional(),
            }))
            .mutation(async ({ input }: { input: any }) => {
                const db = await getDb();

                // Get framework ID
                const [framework] = await db.select()
                    .from(learningFrameworks)
                    .where(eq(learningFrameworks.frameworkId, input.frameworkId))
                    .limit(1);

                if (!framework) {
                    throw new Error("Framework not found");
                }

                const existing = await db.select()
                    .from(learningSections)
                    .where(eq(learningSections.sectionId, input.sectionId))
                    .where(eq(learningSections.frameworkId, framework.id))
                    .limit(1);

                if (existing.length > 0) {
                    const [updated] = await db.update(learningSections)
                        .set({
                            title: input.title,
                            icon: input.icon,
                            content: input.content,
                            sortOrder: input.sortOrder,
                            updatedAt: new Date()
                        })
                        .where(eq(learningSections.id, existing[0].id))
                        .returning();
                    return updated;
                } else {
                    const [created] = await db.insert(learningSections)
                        .values({
                            frameworkId: framework.id,
                            sectionId: input.sectionId,
                            title: input.title,
                            icon: input.icon,
                            content: input.content,
                            sortOrder: input.sortOrder || 0,
                        })
                        .returning();
                    return created;
                }
            }),

        // Admin: Delete section
        deleteSection: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: { input: any }) => {
                const db = await getDb();
                await db.delete(learningSections)
                    .where(eq(learningSections.id, input.id));
                return { success: true };
            }),
    });
};
