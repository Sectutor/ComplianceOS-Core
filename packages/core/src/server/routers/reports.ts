import { z } from "zod";
import * as db from "../../db";
import { roadmapReports } from "../../schema";
import { eq, desc } from "drizzle-orm";
import * as fs from "fs/promises";

const reportSectionSchema = z.enum([
    "cover_page",
    "executive_summary",
    "strategic_vision",
    "risk_appetite",
    "objectives_timeline",
    "implementation_plan",
    "resource_allocation",
    "kpis_metrics",
    "governance",
    "appendix",
    "execution_dashboard",
    "detailed_task_log",
]);

const generateReportSchema = z.object({
    clientId: z.number(),
    roadmapId: z.number().optional(),
    implementationPlanId: z.number().optional(),
    title: z.string(),
    version: z.string().optional(),
    includedSections: z.array(reportSectionSchema),
    dataSources: z.object({
        gapAnalysis: z.boolean().optional(),
        riskAssessment: z.boolean().optional(),
        controls: z.boolean().optional(),
        policies: z.boolean().optional(),
    }).optional(),
    branding: z.object({
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
    }).optional(),
});

export const createReportsRouter = (t: any, adminProcedure: any, clientProcedure: any, clientEditorProcedure: any, publicProcedure: any, isAuthed: any) => {
    return t.router({
        /**
         * Get report history for a client
         */
        getReportHistory: clientProcedure
            .input(z.object({
                clientId: z.number(),
                limit: z.number().optional().default(10),
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const reports = await dbConn.query.roadmapReports.findMany({
                    where: eq(roadmapReports.clientId, input.clientId),
                    orderBy: [desc(roadmapReports.generatedAt)],
                    limit: input.limit,
                });

                return reports;
            }),

        /**
         * Get a single report by ID
         */
        getReport: clientProcedure
            .input(z.object({
                reportId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const report = await dbConn.query.roadmapReports.findFirst({
                    where: eq(roadmapReports.id, input.reportId),
                });

                if (!report) {
                    throw new Error("Report not found");
                }

                return report;
            }),

        /**
         * Download a report
         */
        downloadReport: clientProcedure
            .input(z.object({
                reportId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const report = await dbConn.query.roadmapReports.findFirst({
                    where: eq(roadmapReports.id, input.reportId),
                });

                if (!report || !report.filePath) {
                    throw new Error("Report not found");
                }

                // Read file
                const buffer = await fs.readFile(report.filePath);

                return {
                    fileName: `${report.title.replace(/\s+/g, "_")}_${report.version}.docx`,
                    data: buffer.toString("base64"),
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                };
            }),

        /**
         * Delete a report
         */
        deleteReport: clientEditorProcedure
            .input(z.object({
                reportId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const report = await dbConn.query.roadmapReports.findFirst({
                    where: eq(roadmapReports.id, input.reportId),
                });

                if (!report) {
                    throw new Error("Report not found");
                }

                // Delete file if exists
                if (report.filePath) {
                    try {
                        await fs.unlink(report.filePath);
                    } catch (err) {
                        console.error("Failed to delete report file:", err);
                    }
                }

                // Delete from database
                await dbConn.delete(roadmapReports).where(eq(roadmapReports.id, input.reportId));

                return { success: true };
            }),
    });
};
