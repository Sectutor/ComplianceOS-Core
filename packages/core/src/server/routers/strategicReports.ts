import { z } from "zod";
import * as schema from "../../schema";
import { getDb } from "../../db";
import { eq, desc } from "drizzle-orm";

export const createStrategicReportsRouter = (t: any, publicProcedure: any, adminProcedure: any) => t.router({
    // List reports for a client
    list: publicProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            const reports = await dbConn.select().from(schema.strategicReports)
                .where(eq(schema.strategicReports.clientId, input.clientId))
                .orderBy(desc(schema.strategicReports.updatedAt));
            return reports;
        }),

    // Get a single report
    get: publicProcedure
        .input(z.object({ reportId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            const [report] = await dbConn.select().from(schema.strategicReports)
                .where(eq(schema.strategicReports.id, input.reportId));
            return report;
        }),

    // Create a new report from a roadmap or blank
    create: adminProcedure
        .input(z.object({
            clientId: z.number(),
            title: z.string(),
            roadmapId: z.number().optional(),
            implementationPlanId: z.number().optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await getDb();
            let initialContent = "";

            // Populate content from Roadmap if selected
            if (input.roadmapId) {
                const [roadmap] = await dbConn.select().from(schema.roadmaps).where(eq(schema.roadmaps.id, input.roadmapId));
                if (roadmap) {
                    initialContent += `<h1>${roadmap.title}</h1>`;
                    initialContent += `<p><strong>Target Date:</strong> ${roadmap.targetDate ? new Date(roadmap.targetDate).toLocaleDateString() : 'N/A'}</p>`;
                    if (roadmap.vision) {
                        initialContent += `<h2>Strategic Vision</h2><p>${roadmap.vision}</p>`;
                    }
                    if (roadmap.objectives && Array.isArray(roadmap.objectives)) {
                        initialContent += `<h2>Objectives</h2><ul>${roadmap.objectives.map((o: any) => `<li>${o}</li>`).join('')}</ul>`;
                    }

                    // Fetch milestones
                    const milestones = await dbConn.select().from(schema.roadmapMilestones)
                        .where(eq(schema.roadmapMilestones.roadmapId, input.roadmapId))
                        .orderBy(desc(schema.roadmapMilestones.targetDate));

                    if (milestones.length > 0) {
                        initialContent += `<h2>Milestones</h2><table style="width:100%; border-collapse: collapse;"><thead><tr><th style="border:1px solid #ddd; padding:8px;">Title</th><th style="border:1px solid #ddd; padding:8px;">Date</th><th style="border:1px solid #ddd; padding:8px;">Status</th></tr></thead><tbody>`;
                        milestones.forEach((m: any) => {
                            initialContent += `<tr><td style="border:1px solid #ddd; padding:8px;">${m.title}</td><td style="border:1px solid #ddd; padding:8px;">${new Date(m.targetDate).toLocaleDateString()}</td><td style="border:1px solid #ddd; padding:8px;">${m.status}</td></tr>`;
                        });
                        initialContent += `</tbody></table>`;
                    }
                }
            } else if (input.implementationPlanId) {
                const [plan] = await dbConn.select().from(schema.implementationPlans).where(eq(schema.implementationPlans.id, input.implementationPlanId));
                if (plan) {
                    initialContent += `<h1>${plan.title}</h1>`;
                    initialContent += `<p><strong>Status:</strong> ${plan.status}</p>`;
                    if (plan.description) {
                        initialContent += `<h2>Overview</h2><p>${plan.description}</p>`;
                    }
                }
            } else {
                initialContent = `<h1>${input.title}</h1><p>Start writing your report here...</p>`;
            }

            const [report] = await dbConn.insert(schema.strategicReports).values({
                clientId: input.clientId,
                title: input.title,
                content: initialContent,
                roadmapId: input.roadmapId,
                implementationPlanId: input.implementationPlanId,
                createdById: ctx.user.id,
                status: 'draft'
            }).returning();

            return report;
        }),

    // Update report content
    update: adminProcedure
        .input(z.object({
            reportId: z.number(),
            title: z.string().optional(),
            content: z.string().optional(),
            status: z.string().optional(),
            version: z.string().optional()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await getDb();
            const [updated] = await dbConn.update(schema.strategicReports)
                .set({
                    title: input.title,
                    content: input.content,
                    status: input.status,
                    version: input.version,
                    updatedAt: new Date()
                })
                .where(eq(schema.strategicReports.id, input.reportId))
                .returning();
            return updated;
        }),

    // Delete report
    delete: adminProcedure
        .input(z.object({ reportId: z.number() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await getDb();
            await dbConn.delete(schema.strategicReports)
                .where(eq(schema.strategicReports.id, input.reportId));
            return { success: true };
        })
});
