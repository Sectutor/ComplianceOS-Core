import { z } from "zod";
import * as db from "../../db";
import { roadmapReports } from "../../schema";
import { eq, desc, asc, and } from "drizzle-orm";
import * as fs from "fs/promises";
import { ReportGenerator } from "../services/reportGenerator";
import * as schema from "../../schema";
import { getDb } from "../../db";

console.log("[Reports Router] roadmapReports table imported:", !!roadmapReports);

const reportSectionSchema = z.enum([
    // Core Report Sections
    "cover_page",
    "executive_summary",
    "gap_analysis",
    "risks",
    "controls",
    "bcp",
    "bia",
    "assets",
    "vendors",
    "policies",
    "incidents",
    "vulnerabilities",
    "audit",
    "dpia",

    // Strategic / Roadmap Sections
    "strategic_vision",
    "risk_appetite",
    "objectives_timeline",
    "implementation_plan",
    "resource_allocation",
    "kpis_metrics",
    "governance",
    "appendix",
    "execution_dashboard",
    "detailed_task_log"
]);

const generateReportSchema = z.object({
    clientId: z.number(),
    roadmapId: z.number().optional(),
    implementationPlanId: z.number().optional(),
    title: z.string(),
    version: z.string().optional(),
    format: z.enum(["pdf", "docx"]).optional().default("pdf"),
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
                try {
                    const dbConn = await db.getDb();
                    const reports = await dbConn.query.roadmapReports.findMany({
                        where: eq(roadmapReports.clientId, input.clientId),
                        orderBy: [desc(roadmapReports.generatedAt)],
                        limit: input.limit,
                    });

                    return reports;
                } catch (error: any) {
                    console.error("[Reports] getReportHistory error:", error.message, error);
                    throw new Error(`Failed to fetch report history: ${error.message}`);
                }
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
         * Generate a Gap Analysis report
         */
        generateReport: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                const { generateGapAnalysisReport } = await import("../../lib/reporting");
                const buffer = await generateGapAnalysisReport(input.clientId);
                return {
                    filename: `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
                    pdfBase64: buffer.toString('base64'),
                };
            }),

        /**
         * Generate a professional custom report
         */
        generateProfessionalReport: clientProcedure
            .input(generateReportSchema)
            .mutation(async ({ input, ctx }: any) => {
                try {
                    console.log("[Reports] Starting generateProfessionalReport", {
                        clientId: input.clientId,
                        format: input.format,
                        sections: input.includedSections
                    });

                    const { generateCustomProfessionalReport, generateCustomProfessionalReportDOCX } = await import("../../lib/reporting");

                    const dbConn = await getDb();

                    // Determine if this is a roadmap report based on requested sections or roadmapId
                    const isRoadmapReport = input.roadmapId ||
                        input.includedSections.some((s: string) =>
                            ['strategic_vision', 'risk_appetite', 'objectives_timeline', 'implementation_plan', 'resource_allocation', 'kpis_metrics', 'governance'].includes(s)
                        );

                    let buffer: Buffer;
                    let extension = 'pdf';
                    let contentType = 'application/pdf';

                    if (isRoadmapReport && input.format === 'docx') {
                        // Use the specialized ReportGenerator service for Roadmaps
                        console.log("[Reports] Using specialized ReportGenerator for Roadmap report");

                        // Fetch all data needed for ReportGenerator
                        const [client] = await dbConn.select().from(schema.clients).where(eq(schema.clients.id, input.clientId)).limit(1);
                        const [roadmap] = input.roadmapId ?
                            await dbConn.select().from(schema.roadmaps).where(eq(schema.roadmaps.id, input.roadmapId)).limit(1) : [null];

                        const milestones = input.roadmapId ?
                            await dbConn.select().from(schema.roadmapMilestones).where(eq(schema.roadmapMilestones.roadmapId, input.roadmapId)).orderBy(asc(schema.roadmapMilestones.targetDate)) : [];

                        const implementationTasks = input.roadmapId ?
                            await dbConn.select().from(schema.implementationTasks).where(eq(schema.implementationTasks.implementationPlanId, input.roadmapId)) : [];

                        const riskAssessments = await dbConn.select().from(schema.riskAssessments).where(eq(schema.riskAssessments.clientId, input.clientId)).limit(50);
                        const controls = await dbConn.select().from(schema.clientControls).where(eq(schema.clientControls.clientId, input.clientId)).limit(100);

                        const generator = new ReportGenerator({
                            clientId: input.clientId,
                            roadmapId: input.roadmapId,
                            title: input.title,
                            version: input.version || 'v1.0',
                            includedSections: input.includedSections as any[],
                            generatedBy: ctx.user.id,
                            branding: input.branding
                        }, {
                            client,
                            roadmap,
                            roadmapMilestones: milestones,
                            implementationTasks: implementationTasks,
                            riskAssessments,
                            controls,
                            policies: [] // Add policies if needed
                        });

                        buffer = await generator.generate();
                        extension = 'docx';
                        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    } else if (input.format === 'docx') {
                        // Use general purpose professional DOCX generator
                        console.log("[Reports] Using general DOCX generator");
                        buffer = await generateCustomProfessionalReportDOCX(input.clientId, {
                            title: input.title,
                            sections: input.includedSections,
                            branding: input.branding
                        });
                        extension = 'docx';
                        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    } else {
                        // Use general purpose professional PDF generator
                        console.log("[Reports] Using general PDF generator");
                        buffer = await generateCustomProfessionalReport(input.clientId, {
                            title: input.title,
                            sections: input.includedSections,
                            branding: input.branding
                        });
                    }

                    console.log("[Reports] Report generated, buffer length:", buffer.length);

                    // Save record to database (optional - wrap in try-catch to not fail the report)
                    try {
                        await dbConn.insert(roadmapReports).values({
                            clientId: input.clientId,
                            roadmapId: input.roadmapId,
                            title: input.title,
                            version: input.version || 'v1.0',
                            includedSections: input.includedSections,
                            dataSources: input.dataSources,
                            branding: input.branding,
                            generatedAt: new Date(),
                            generatedBy: ctx.user.id,
                        });
                        console.log("[Reports] Report record saved to database");
                    } catch (dbErr: any) {
                        console.error("[Reports] Failed to save report record (non-fatal):", dbErr.message);
                    }

                    return {
                        filename: `${input.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`,
                        pdfBase64: buffer.toString('base64'),
                        contentType
                    };
                } catch (error: any) {
                    console.error("[Reports] FATAL ERROR in generateProfessionalReport:", error);
                    console.error("[Reports] Error stack:", error.stack);
                    throw new Error(`Report generation failed: ${error.message}`);
                }

            }),

        generateRoadmapReport: clientProcedure
            .input(generateReportSchema)
            .mutation(async ({ input, ctx }: any) => {
                // For aliases in the same router, it's best to either call the logic directly or 
                // just point it to the same implementation. Since TRPC procedures aren't 
                // easily callable from each other without a lot of boilerplate, 
                // we'll just implement a simple redirect or re-use the mutation function.

                // For simplicity and reliability in this specific router structure, 
                // we'll just re-trigger the professional report logic.
                // Note: The input schema is the same.
                const { generateCustomProfessionalReport, generateCustomProfessionalReportDOCX } = await import("../../lib/reporting");
                const dbConn = await getDb();

                // Copy-paste logic or extract to a shared function. 
                // Extraction is cleaner but would require moving a lot of code.
                // Let's just assume the frontend will be updated to use generateProfessionalReport,
                // but for now we provide a minimal working shim that calling the same logic.

                // Actually, the most robust way is to just define the main logic as a function.
                // I'll do that in a follow-up if needed, but for now let's just make it do the same thing.

                // Determining roadmap report status
                const isRoadmapReport = input.roadmapId ||
                    input.includedSections.some((s: string) =>
                        ['strategic_vision', 'risk_appetite', 'objectives_timeline', 'implementation_plan', 'resource_allocation', 'kpis_metrics', 'governance'].includes(s)
                    );

                let buffer: Buffer;
                let extension = 'pdf';
                let contentType = 'application/pdf';

                if (isRoadmapReport && input.format === 'docx') {
                    const [client] = await dbConn.select().from(schema.clients).where(eq(schema.clients.id, input.clientId)).limit(1);
                    const [roadmap] = input.roadmapId ?
                        await dbConn.select().from(schema.roadmaps).where(eq(schema.roadmaps.id, input.roadmapId)).limit(1) : [null];

                    const milestones = input.roadmapId ?
                        await dbConn.select().from(schema.roadmapMilestones).where(eq(schema.roadmapMilestones.roadmapId, input.roadmapId)).orderBy(asc(schema.roadmapMilestones.targetDate)) : [];

                    const implementationTasks = input.roadmapId ?
                        await dbConn.select().from(schema.implementationTasks).where(eq(schema.implementationTasks.implementationPlanId, input.roadmapId)) : [];

                    const riskAssessments = await dbConn.select().from(schema.riskAssessments).where(eq(schema.riskAssessments.clientId, input.clientId)).limit(50);
                    const controls = await dbConn.select().from(schema.clientControls).where(eq(schema.clientControls.clientId, input.clientId)).limit(100);

                    const generator = new ReportGenerator({
                        clientId: input.clientId,
                        roadmapId: input.roadmapId,
                        title: input.title,
                        version: input.version || 'v1.0',
                        includedSections: input.includedSections as any[],
                        generatedBy: ctx.user.id,
                        branding: input.branding
                    }, {
                        client,
                        roadmap,
                        roadmapMilestones: milestones,
                        implementationTasks: implementationTasks,
                        riskAssessments,
                        controls,
                        policies: []
                    });

                    buffer = await generator.generate();
                    extension = 'docx';
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                } else if (input.format === 'docx') {
                    buffer = await generateCustomProfessionalReportDOCX(input.clientId, {
                        title: input.title,
                        sections: input.includedSections,
                        branding: input.branding
                    });
                    extension = 'docx';
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                } else {
                    buffer = await generateCustomProfessionalReport(input.clientId, {
                        title: input.title,
                        sections: input.includedSections,
                        branding: input.branding
                    });
                }

                await dbConn.insert(roadmapReports).values({
                    clientId: input.clientId,
                    roadmapId: input.roadmapId,
                    title: input.title,
                    version: input.version || 'v1.0',
                    includedSections: input.includedSections,
                    dataSources: input.dataSources,
                    branding: input.branding,
                    generatedAt: new Date(),
                    generatedBy: ctx.user.id,
                });

                return {
                    filename: `${input.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`,
                    pdfBase64: buffer.toString('base64'),
                    contentType
                };
            }),

        /**
         * Delete a report
         */
        deleteReport: clientProcedure
            .input(z.object({
                reportId: z.number(),
                clientId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();

                // First, verify the report exists and belongs to this client
                const report = await dbConn.query.roadmapReports.findFirst({
                    where: and(
                        eq(roadmapReports.id, input.reportId),
                        eq(roadmapReports.clientId, input.clientId)
                    )
                });

                if (!report) {
                    throw new Error("Report not found or access denied");
                }

                // If there's a file path, try to delete the file
                if (report.filePath) {
                    try {
                        await fs.unlink(report.filePath);
                    } catch (fileErr) {
                        // File might not exist, continue with DB deletion
                        console.warn(`[Reports] Could not delete report file: ${report.filePath}`);
                    }
                }

                // Delete from database
                await dbConn.delete(roadmapReports).where(eq(roadmapReports.id, input.reportId));

                return { success: true, message: "Report deleted successfully" };
            }),
    });
};
