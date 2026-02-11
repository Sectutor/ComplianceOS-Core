
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import * as schema from "../../schema";
import {
    riskAssessments, riskTreatments, treatmentControls,
    riskAssessmentStatusEnum,
    threats, vulnerabilities
} from "../../schema";
import { eq, and, desc, asc, sql, inArray, ilike, or, lt, lte, gt, gte, not } from "drizzle-orm";
import { calculateResidualScore, scoreToRiskLevel, getMatrixScoreLevel } from "../../lib/riskCalculations";
import { logActivity } from "../../lib/audit";
import { llmService } from "../../lib/llm/service";
import { generateRiskReportDocx } from "../../riskExportProfessional";
import { recalculateRiskScore } from "../services/riskService";


export const createRisksRouter = (t: any, procedure: any, premiumClientProcedure: any) => {
    console.log('[RISKS ROUTER] Creating risks router with procedures... AND RELOADED!');
    return t.router({

        // --- ASSETS ---
        getAssets: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Fetch assets with risk counts
                const rawAssets = await db
                    .select({
                        ...schema.assets,
                        riskCount: sql<number>`count(DISTINCT ${schema.riskScenarios.id})`.mapWith(Number),
                        suggestionCount: sql<number>`count(DISTINCT ${schema.assetCveMatches.id}) FILTER (WHERE ${schema.assetCveMatches.status} = 'suggested')`.mapWith(Number),
                        vulnerabilityCount: sql<number>`count(DISTINCT ${schema.vulnerabilities.id})`.mapWith(Number)
                    })
                    .from(schema.assets)
                    .leftJoin(schema.riskScenarios, eq(schema.riskScenarios.assetId, schema.assets.id))
                    .leftJoin(schema.assetCveMatches, eq(schema.assetCveMatches.assetId, schema.assets.id))
                    // Vulnerabilities join is tricky because it's a JSON array. 
                    // For now, we'll join on the JSON array if possible or use a subquery if needed.
                    // Actually, let's keep it simple for now and do the complex joins separately if performance is an issue.
                    .leftJoin(schema.vulnerabilities, sql`${schema.vulnerabilities.affectedAssets}::jsonb @> (('["' || ${schema.assets.id} || '"]')::jsonb)`)
                    .where(eq(schema.assets.clientId, input.clientId))
                    .groupBy(schema.assets.id);

                return rawAssets;
            }),

        createAsset: procedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                type: z.string(),
                owner: z.string().optional(),
                valuationC: z.number().min(1).max(5).default(3),
                valuationI: z.number().min(1).max(5).default(3),
                valuationA: z.number().min(1).max(5).default(3),
                description: z.string().optional(),
                location: z.string().optional(),
                department: z.string().optional(),
                status: z.enum(["active", "archived", "disposed"]).default("active"),
                acquisitionDate: z.string().optional(),
                lastReviewDate: z.string().optional(),
                vendor: z.string().optional(),
                productName: z.string().optional(),
                version: z.string().optional(),
                technologies: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create assets' });
                }
                const db = await getDb();
                const [newAsset] = await db.insert(schema.assets).values({
                    ...input,
                    acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
                    lastReviewDate: input.lastReviewDate ? new Date(input.lastReviewDate) : null,
                } as any).returning();

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "asset", entityId: newAsset.id, details: { name: newAsset.name } });
                return newAsset;
            }),

        updateAsset: procedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                type: z.string().optional(),
                owner: z.string().optional(),
                valuationC: z.number().min(1).max(5).optional(),
                valuationI: z.number().min(1).max(5).optional(),
                valuationA: z.number().min(1).max(5).optional(),
                description: z.string().optional(),
                location: z.string().optional(),
                department: z.string().optional(),
                status: z.enum(["active", "archived", "disposed"]).optional(),
                acquisitionDate: z.string().optional(),
                lastReviewDate: z.string().optional(),
                vendor: z.string().optional(),
                productName: z.string().optional(),
                version: z.string().optional(),
                technologies: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update assets' });
                }
                const db = await getDb();
                const { id, clientId, ...updates } = input;
                const updateData: any = { ...updates };
                if (updateData.acquisitionDate) updateData.acquisitionDate = new Date(updateData.acquisitionDate);
                if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);

                const [updated] = await db.update(schema.assets)
                    .set({ ...updateData, updatedAt: new Date() })
                    .where(and(eq(schema.assets.id, id), eq(schema.assets.clientId, clientId)))
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId, action: "update", entityType: "asset", entityId: id, details: { changes: updates } });
                return { success: true };
            }),

        // Generate AI-driven Risk Management Analysis
        generateAIAnalysis: procedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ input, ctx }: any) => {
                console.log(`[AI Analysis] Starting analysis for client ${input.clientId}`);
                const db = await getDb();

                // Fetch all risks for the client
                console.log(`[AI Analysis] Fetching risks...`);
                const assessments = await db.select()
                    .from(riskAssessments)
                    .where(eq(riskAssessments.clientId, input.clientId));

                console.log(`[AI Analysis] Found ${assessments.length} risks`);

                if (assessments.length === 0) {
                    return "No risk assessments found to analyze. Please add some risks first.";
                }

                // Fetch Client Name
                const [client] = await db.select({ name: schema.clients.name })
                    .from(schema.clients)
                    .where(eq(schema.clients.id, input.clientId))
                    .limit(1);

                const orgName = client?.name || "the Organization";

                // Calculate Stats for AI Context using strictly verified score buckets
                const totalRisks = assessments.length;
                const criticalRisksList = assessments.filter((r: any) => (typeof r.inherentScore === 'number' ? r.inherentScore : 0) >= 15);
                const highRisksList = assessments.filter((r: any) => {
                    const s = typeof r.inherentScore === 'number' ? r.inherentScore : 0;
                    return s === 8 || s === 9;
                });

                const criticalCount = criticalRisksList.length; // Target 8
                const highCount = highRisksList.length; // Target 92
                const approvedRisks = assessments.filter((r: any) => r.status === 'approved').length;
                const draftRisks = assessments.filter((r: any) => r.status === 'draft').length;

                // Priority sort risks so Critical ones are ALWAYS seen by the AI first
                const sortedAssessments = [...assessments].sort((a, b) =>
                    (typeof b.inherentScore === 'number' ? b.inherentScore : 0) - (typeof a.inherentScore === 'number' ? a.inherentScore : 0)
                );

                // Format data for AI with score context
                const riskSummary = sortedAssessments.map((r: any) => {
                    const inherent = typeof r.inherentScore === 'number' ? r.inherentScore : 0;
                    const residual = typeof r.residualScore === 'number' ? r.residualScore : inherent; // Fallback to inherent if null

                    return {
                        id: r.assessmentId,
                        title: r.title,
                        inherentScore: inherent,
                        residualScore: residual,
                        inherentLevel: inherent >= 15 ? 'Critical/Very High' : r.inherentRisk,
                        residualLevel: r.residualRisk || (inherent >= 15 ? 'Critical/Very High' : r.inherentRisk),
                        status: r.status,
                        owner: r.riskOwner,
                        treatment: r.treatmentOption
                    };
                });

                const systemPrompt = `You are a Senior Risk Management Consultant for ${orgName}.
Your task is to analyze the Risk Register and produce a professional, strategic Management Report.
You MUST return the report as a structured JSON object.
Use professional tone and industry standard (ISO 31000 / NIST SP 800-30) terminology.
IMPORTANT: You must use the specific metrics provided in the context to back up your findings.`;

                const userPrompt = `Analyze the following Risk Register data for ${orgName}:

CONTEXT & METRICS (Use these exact numbers in your analysis):
- Total Risks Identified: ${totalRisks}
- Critical/Very High Risks (Score 15+): ${criticalCount}
- High Priority Risks (Score 8-9): ${highCount}
- Approval Status: ${approvedRisks} Approved, ${draftRisks} Draft

DATASET SUMMARY (Prioritized by Score):
${JSON.stringify(riskSummary.slice(0, 80), null, 2)}

REPORT REQUIREMENTS:
Return a JSON object with these EXACT keys (values MUST be Markdown strings):
1. "title": "Strategic Risk Management Analysis for ${orgName} (${new Date().toLocaleString()})"
2. "executiveSummary": Strategic overview. YOU MUST EXPLICITLY MENTION the total (${totalRisks}) and especially the ${criticalCount} critical risks. Use Markdown.
3. "keyFindings": YOU MUST LIST AND ANALYZE ALL ${criticalCount} CRITICAL/VERY HIGH RISKS INDIVIDUALLY. For EACH risk, you MUST explicitly state the Inherent Risk Score and the Residual Risk Score. Use their specific IDs and professional English business names. Format as Markdown lists/headings.
4. "recommendations": Strategic steps for the ${criticalCount} critical risks and the broader high-risk landscape. Format as Markdown.
5. "conclusion": Forward-looking summary. Markdown string.
6. "methodology": AI-driven quantitative and qualitative risk analysis. Markdown string.`;

                console.log(`[AI Analysis] Calling LLM service...`);
                try {
                    const response = await llmService.generate({
                        systemPrompt,
                        userPrompt,
                        feature: 'risk_analysis',
                        temperature: 0.3,
                        jsonMode: true
                    }, { clientId: input.clientId, userId: ctx.user.id, endpoint: 'generateAIAnalysis' });

                    console.log(`[AI Analysis] LLM service responded successfully`);
                    const reportData = JSON.parse(response.text);

                    // Save to Report Area as a NEW report every time
                    console.log(`[AI Analysis] Creating new report entry...`);
                    await db.insert(schema.riskReports)
                        .values({
                            clientId: input.clientId,
                            ...reportData,
                            status: 'draft',
                            version: 1, // Every generation is a new baseline draft
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });

                    // Return as markdown for convenience (or the JSON)
                    const fullMarkdown = `
# ${reportData.title || 'Risk Management Report'}

## Executive Summary
${reportData.executiveSummary}

## Key Findings
${reportData.keyFindings}

## Strategic Recommendations
${reportData.recommendations}

## Conclusion
${reportData.conclusion}

---
*Analysis generated by AI Advisor on ${new Date().toLocaleDateString()}*
`;
                    return fullMarkdown;
                } catch (error: any) {
                    console.error(`[AI Analysis] LLM service ERROR:`, error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `AI Analysis failed: ${error.message}`,
                        cause: error
                    });
                }
            }),

        // Export Professional DOCX Report
        exportReport: premiumClientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string().optional(),
                executiveSummary: z.string().optional(),
                introduction: z.string().optional(),
                scope: z.string().optional(),
                methodology: z.string().optional(),
                keyFindings: z.string().optional(),
                recommendations: z.string().optional(),
                conclusion: z.string().optional(),
                assumptions: z.string().optional(),
                references: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const [client] = await db.select({ name: schema.clients.name })
                    .from(schema.clients)
                    .where(eq(schema.clients.id, input.clientId))
                    .limit(1);

                const risks = await db.select()
                    .from(schema.riskAssessments)
                    .where(eq(schema.riskAssessments.clientId, input.clientId))
                    .orderBy(desc(schema.riskAssessments.updatedAt));

                const buffer = await generateRiskReportDocx({
                    ...input,
                    title: input.title || "Risk Management Report",
                    clientName: client?.name || "Premium Client",
                    risks: risks
                });

                return {
                    base64: buffer.toString('base64'),
                    filename: `Risk_Management_Report_${new Date().toISOString().split('T')[0]}.docx`
                };
            }),

        // Get Risk Report Draft
        getReport: procedure
            .input(z.object({
                clientId: z.number(),
                reportId: z.number().optional()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                let query = db.select()
                    .from(schema.riskReports)
                    .where(eq(schema.riskReports.clientId, input.clientId));

                if (input.reportId) {
                    query = query.where(eq(schema.riskReports.id, input.reportId));
                } else {
                    query = query.orderBy(desc(schema.riskReports.createdAt));
                }

                const [report] = await query.limit(1);
                return report || null;
            }),

        // List all Risk Reports
        listReports: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(schema.riskReports)
                    .where(eq(schema.riskReports.clientId, input.clientId))
                    .orderBy(desc(schema.riskReports.createdAt));
            }),

        // Delete Risk Report
        deleteReport: procedure
            .input(z.object({
                clientId: z.number(),
                reportId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(schema.riskReports)
                    .where(and(
                        eq(schema.riskReports.id, input.reportId),
                        eq(schema.riskReports.clientId, input.clientId)
                    ));
                return { success: true };
            }),

        // Update Risk Report Status
        updateReportStatus: procedure
            .input(z.object({
                clientId: z.number(),
                reportId: z.number(),
                status: z.string()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.update(schema.riskReports)
                    .set({ status: input.status, updatedAt: new Date() })
                    .where(and(
                        eq(schema.riskReports.id, input.reportId),
                        eq(schema.riskReports.clientId, input.clientId)
                    ));
                return { success: true };
            }),

        // Save Risk Report Draft
        saveReport: procedure
            .input(z.object({
                clientId: z.number(),
                reportId: z.number().optional(),
                title: z.string().optional(),
                executiveSummary: z.string().optional(),
                introduction: z.string().optional(),
                scope: z.string().optional(),
                methodology: z.string().optional(),
                keyFindings: z.string().optional(),
                recommendations: z.string().optional(),
                conclusion: z.string().optional(),
                assumptions: z.string().optional(),
                references: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                console.log(`[RISKS] Saving report for client ${input.clientId}, reportId: ${input.reportId || 'NEW'}`);
                const db = await getDb();

                // If reportId is provided, update existing report
                if (input.reportId) {
                    const [updated] = await db.update(schema.riskReports)
                        .set({
                            title: input.title,
                            executiveSummary: input.executiveSummary,
                            introduction: input.introduction,
                            scope: input.scope,
                            methodology: input.methodology,
                            keyFindings: input.keyFindings,
                            recommendations: input.recommendations,
                            conclusion: input.conclusion,
                            assumptions: input.assumptions,
                            references: input.references,
                            updatedAt: new Date()
                        })
                        .where(and(
                            eq(schema.riskReports.id, input.reportId),
                            eq(schema.riskReports.clientId, input.clientId)
                        ))
                        .returning();

                    if (!updated) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Report not found'
                        });
                    }

                    return updated;
                } else {
                    // Create new report
                    const [created] = await db.insert(schema.riskReports)
                        .values({
                            clientId: input.clientId,
                            title: input.title || 'Risk Management Report',
                            executiveSummary: input.executiveSummary,
                            introduction: input.introduction,
                            scope: input.scope,
                            methodology: input.methodology,
                            keyFindings: input.keyFindings,
                            recommendations: input.recommendations,
                            conclusion: input.conclusion,
                            assumptions: input.assumptions,
                            references: input.references,
                            version: 1,
                            status: 'draft'
                        })
                        .returning();
                    return created;
                }
            }),

        // List Risks with Filtering and Pagination
        list: procedure
            .input(z.object({
                clientId: z.coerce.number(),
                page: z.number().default(1),
                limit: z.number().default(20),
                status: z.enum(["draft", "approved", "reviewed"]).optional(),
                search: z.string().optional(),
                sortBy: z.enum(["inherentScore", "residualScore", "createdAt", "updatedAt"]).default("updatedAt"),
                sortOrder: z.enum(["asc", "desc"]).default("desc"),
                projectId: z.coerce.number().optional(),
                category: z.string().optional(),
            }))
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();
                const offset = (input.page - 1) * input.limit;

                const filters = [
                    eq(riskAssessments.clientId, input.clientId),
                    input.status ? eq(riskAssessments.status, input.status) : undefined,
                    input.search ? or(
                        ilike(riskAssessments.title, `%${input.search}%`),
                        ilike(riskAssessments.assessmentId, `%${input.search}%`)
                    ) : undefined,
                    input.projectId ? eq(riskAssessments.projectId, input.projectId) : undefined,
                    input.category ? eq(riskAssessments.category, input.category) : undefined
                ].filter(Boolean);

                const [total] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskAssessments)
                    .where(and(...filters));

                let orderBy;
                switch (input.sortBy) {
                    case 'inherentScore': orderBy = input.sortOrder === 'asc' ? riskAssessments.inherentScore : desc(riskAssessments.inherentScore); break;
                    case 'residualScore': orderBy = input.sortOrder === 'asc' ? riskAssessments.residualScore : desc(riskAssessments.residualScore); break;
                    case 'createdAt': orderBy = input.sortOrder === 'asc' ? riskAssessments.createdAt : desc(riskAssessments.createdAt); break;
                    default: orderBy = desc(riskAssessments.updatedAt);
                }

                const items = await db.select()
                    .from(riskAssessments)
                    .where(and(...filters))
                    .limit(input.limit)
                    .offset(offset)
                    .orderBy(orderBy);

                return {
                    items,
                    total: Number(total?.count || 0),
                    page: input.page,
                    totalPages: Math.ceil(Number(total?.count || 0) / input.limit)
                };
            }),

        getAll: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(riskAssessments)
                    .where(eq(riskAssessments.clientId, input.clientId))
                    .orderBy(desc(riskAssessments.updatedAt));
            }),

        // Get Single Risk Assessment Details
        get: procedure
            .input(z.object({ id: z.number(), clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [assessment] = await db.select()
                    .from(riskAssessments)
                    .where(eq(riskAssessments.id, input.id));

                if (!assessment) return null;
                if (assessment.clientId !== input.clientId) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Risk assessment does not belong to this client' });
                }

                // Fetch treatments
                const treatments = await db.select()
                    .from(riskTreatments)
                    .where(eq(riskTreatments.riskAssessmentId, input.id));

                return { ...assessment, treatments };
            }),

        // Create or Update Risk Assessment
        upsert: procedure
            .input(z.object({
                id: z.coerce.number().optional(),
                clientId: z.coerce.number(),
                title: z.string(),
                threatId: z.coerce.number().optional(),
                vulnerabilityId: z.coerce.number().optional(),
                likelihood: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v),
                impact: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v),
                status: z.enum(["draft", "approved", "reviewed"]).default("draft"),
                contextSnapshot: z.any().optional(),
                riskOwner: z.string().optional(),
                treatmentOption: z.string().optional(),
                priority: z.string().optional(),
                residualScore: z.number().optional(),
                residualRisk: z.string().optional(),
                existingControls: z.string().optional(),
                controlEffectiveness: z.string().optional(),
                threatDescription: z.string().optional(),
                projectId: z.number().optional(),
                category: z.string().optional(),
                owaspCategory: z.string().optional(),
                csfFunction: z.string().optional(),
                privacyImpact: z.boolean().optional(),
                assessor: z.string().optional(),
                method: z.string().optional(),
                vulnerabilityDescription: z.string().optional(),
                affectedAssets: z.array(z.string()).optional(),
                recommendedActions: z.string().optional(),
                targetResidualRisk: z.string().optional(),
                notes: z.string().optional(),
                assessmentDate: z.string().optional(),
                reviewDueDate: z.string().optional(),
                nextReviewDate: z.string().optional(),
                controlIds: z.array(z.number()).optional(),
                aiRmfCategory: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                // MICRO-RBAC: Only Owners/Editors can edit
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot edit risks' });
                }

                const db = await getDb();

                return await db.transaction(async (tx: any) => {
                    const inherentScore = input.likelihood * input.impact;
                    const inherentRisk = getMatrixScoreLevel(inherentScore);

                    const data: any = {
                        clientId: input.clientId,
                        title: input.title,
                        threatId: input.threatId,
                        vulnerabilityId: input.vulnerabilityId,
                        likelihood: String(input.likelihood),
                        impact: String(input.impact),
                        inherentScore,
                        inherentRisk,
                        status: input.status,
                        contextSnapshot: input.contextSnapshot,
                        riskOwner: input.riskOwner,
                        treatmentOption: input.treatmentOption,
                        priority: input.priority,
                        residualScore: input.residualScore,
                        residualRisk: input.residualRisk,
                        existingControls: input.existingControls,
                        controlEffectiveness: input.controlEffectiveness,
                        threatDescription: input.threatDescription, // Map description if passed
                        projectId: input.projectId,
                        category: input.category,
                        owaspCategory: input.owaspCategory,
                        csfFunction: input.csfFunction,
                        privacyImpact: input.privacyImpact,
                        assessor: input.assessor,
                        method: input.method,
                        vulnerabilityDescription: input.vulnerabilityDescription,
                        affectedAssets: input.affectedAssets,
                        recommendedActions: input.recommendedActions,
                        targetResidualRisk: input.targetResidualRisk,
                        notes: input.notes,
                        controlIds: input.controlIds,
                        aiRmfCategory: input.aiRmfCategory,
                        assessmentDate: input.assessmentDate ? new Date(input.assessmentDate) : undefined,
                        reviewDueDate: input.reviewDueDate ? new Date(input.reviewDueDate) : undefined,
                        nextReviewDate: input.nextReviewDate ? new Date(input.nextReviewDate) : undefined,
                        updatedAt: new Date()
                    };

                    if (input.id) {
                        const [updated] = await tx.update(riskAssessments)
                            .set(data)
                            .where(eq(riskAssessments.id, input.id))
                            .returning();

                        await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "update", entityType: "risk", entityId: updated.id, details: { title: updated.title, changes: data } }, tx);

                        // Index updated risk (Outside TX if needed? Indexing service usually handles its own or is silent fail. Keeping inside for simplicity as it was)
                        // Indexing removed for Core split
                        // try {
                        //     const { IndexingService } = await import('../../lib/advisor/indexing');
                        //     // ... indexing logic ...
                        // } catch (e) { console.error("Failed to index risk:", e); }

                        return updated;
                    } else {
                        data.assessmentId = `RA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
                        const [created] = await tx.insert(riskAssessments)
                            .values(data)
                            .returning();

                        await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "risk", entityId: created.id, details: { title: created.title } }, tx);

                        // Indexing removed for Core split
                        // try {
                        //     const { IndexingService } = await import('../../lib/advisor/indexing');
                        //     // ... indexing logic ...
                        // } catch (e) { console.error("Failed to index new risk:", e); }

                        return created;
                    }
                });
            }),

        // Delete Risk
        delete: procedure
            .input(z.object({ id: z.number(), clientId: z.number() }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole !== 'owner') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can delete risks' });
                }
                const db = await getDb();
                await db.delete(riskAssessments).where(eq(riskAssessments.id, input.id));

                // Remove from Index
                // Remove from Index - removed for Core split
                // try {
                //     const { IndexingService } = await import('../../lib/advisor/indexing');
                //     await IndexingService.deleteDocumentIndex(input.clientId, 'risk', input.id.toString());
                // } catch (e) { console.error("Failed to delete risk index:", e); }

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "delete", entityType: "risk", entityId: input.id, details: { title: "Deleted Risk" } });
                return { success: true };
            }),

        // Link Control to Treatment
        linkControl: procedure
            .input(z.object({
                treatmentId: z.number(),
                controlId: z.number(),
                clientId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                // MICRO-RBAC
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot link controls' });
                }

                const db = await getDb();
                return await db.transaction(async (tx: any) => {
                    // Check existence
                    const existing = await tx.select().from(treatmentControls)
                        .where(and(
                            eq(treatmentControls.treatmentId, input.treatmentId),
                            eq(treatmentControls.controlId, input.controlId)
                        ));

                    if (existing.length > 0) return existing[0];

                    const [linked] = await tx.insert(treatmentControls).values({
                        clientId: input.clientId,
                        treatmentId: input.treatmentId,
                        controlId: input.controlId
                    }).returning();

                    await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "update", entityType: "treatment", entityId: input.treatmentId, details: { action: "linked_control", controlId: input.controlId } }, tx);

                    return linked;
                });
            }),

        // Get Overdue Risk Items
        getOverdueItems: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Overdue Risk Reviews - calculate days overdue in SQL
                const overdueReviews = await db.select({
                    id: riskAssessments.id,
                    title: riskAssessments.title,
                    assessmentId: riskAssessments.assessmentId,
                    daysOverdue: sql<number>`EXTRACT(DAY FROM CURRENT_DATE - ${riskAssessments.nextReviewDate})::integer`,
                    type: sql<string>`'review'`
                })
                    .from(riskAssessments)
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskAssessments.nextReviewDate} < CURRENT_DATE`,
                        eq(riskAssessments.status, 'approved')
                    ))
                    .limit(10);

                // Overdue Treatments - calculate days overdue in SQL
                const overdueTreatments = await db.select({
                    id: riskTreatments.id,
                    title: riskTreatments.strategy,
                    daysOverdue: sql<number>`EXTRACT(DAY FROM CURRENT_DATE - ${riskTreatments.dueDate})::integer`,
                    type: sql<string>`'treatment'`
                })
                    .from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskTreatments.dueDate} < CURRENT_DATE`,
                        sql`${riskTreatments.status} NOT IN ('implemented', 'completed')`
                    ))
                    .limit(10);

                const items = [
                    ...overdueReviews.map((r: any) => ({
                        id: r.id,
                        title: r.title || r.assessmentId,
                        type: 'review',
                        daysOverdue: r.daysOverdue || 0
                    })),
                    ...overdueTreatments.map((t: any) => ({
                        id: t.id,
                        title: t.title || 'Treatment',
                        type: 'treatment',
                        daysOverdue: t.daysOverdue || 0
                    }))
                ].sort((a: any, b: any) => b.daysOverdue - a.daysOverdue);

                return items;
            }),

        // Get Upcoming Deadlines
        getUpcomingDeadlines: procedure
            .input(z.object({ clientId: z.number(), days: z.number().default(7) }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Upcoming Risk Reviews - calculate days until due in SQL
                const upcomingReviews = await db.select({
                    id: riskAssessments.id,
                    title: riskAssessments.title,
                    assessmentId: riskAssessments.assessmentId,
                    daysUntilDue: sql<number>`EXTRACT(DAY FROM ${riskAssessments.nextReviewDate} - CURRENT_DATE)::integer`,
                })
                    .from(riskAssessments)
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskAssessments.nextReviewDate} >= CURRENT_DATE`,
                        sql`${riskAssessments.nextReviewDate} <= CURRENT_DATE + INTERVAL '${sql.raw(input.days.toString())} days'`,
                        eq(riskAssessments.status, 'approved')
                    ))
                    .limit(10);

                // Upcoming Treatments - calculate days until due in SQL
                const upcomingTreatments = await db.select({
                    id: riskTreatments.id,
                    title: riskTreatments.strategy,
                    daysUntilDue: sql<number>`EXTRACT(DAY FROM ${riskTreatments.dueDate} - CURRENT_DATE)::integer`,
                })
                    .from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskTreatments.dueDate} >= CURRENT_DATE`,
                        sql`${riskTreatments.dueDate} <= CURRENT_DATE + INTERVAL '${sql.raw(input.days.toString())} days'`,
                        sql`${riskTreatments.status} NOT IN ('implemented', 'completed')`
                    ))
                    .limit(10);

                const items = [
                    ...upcomingReviews.map((r: any) => ({
                        id: r.id,
                        title: r.title || r.assessmentId,
                        type: 'review',
                        daysUntilDue: Math.max(0, r.daysUntilDue || 0)
                    })),
                    ...upcomingTreatments.map((t: any) => ({
                        id: t.id,
                        title: t.title || 'Treatment',
                        type: 'treatment',
                        daysUntilDue: Math.max(0, t.daysUntilDue || 0)
                    }))
                ].sort((a: any, b: any) => a.daysUntilDue - b.daysUntilDue);

                return items;
            }),

        // Get KRI Statistics
        getKRIStats: procedure
            .input(z.object({ clientId: z.coerce.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // 1. Overdue Risk Reviews
                const [overdueReviewsResult] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskAssessments)
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskAssessments.nextReviewDate} < CURRENT_DATE`,
                        eq(riskAssessments.status, 'approved')
                    ));

                // 2. Unmitigated Critical Risks (High/Critical/Extreme inherent risk with NO treatments)
                // We find risks that match criteria and have 0 treatments
                const unmitigatedRisks = await db.select({
                    id: riskAssessments.id
                })
                    .from(riskAssessments)
                    .leftJoin(riskTreatments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskAssessments.inherentScore} >= 15` // High/Critical threshold
                    ))
                    .groupBy(riskAssessments.id)
                    .having(sql`count(${riskTreatments.id}) = 0`);

                // 3. Risk Mitigation Efficiency (% where Residual < Inherent)
                const [totalRisksResult] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskAssessments)
                    .where(eq(riskAssessments.clientId, input.clientId));

                const [mitigatedRisksResult] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskAssessments)
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskAssessments.residualScore} < ${riskAssessments.inherentScore}`
                    ));

                const totalRisks = Number(totalRisksResult?.count || 0);
                const efficiencyRate = totalRisks > 0
                    ? Math.round((Number(mitigatedRisksResult?.count || 0) / totalRisks) * 100)
                    : 0;

                // 4. Control Implementation Rate (Treatment Progress)
                const [totalTreatments] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(eq(riskAssessments.clientId, input.clientId));

                const [completedTreatments] = await db.select({ count: sql<number>`count(*)` })
                    .from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(and(
                        eq(riskAssessments.clientId, input.clientId),
                        sql`${riskTreatments.status} IN ('implemented', 'completed')`
                    ));

                const implementationRate = totalTreatments?.count > 0
                    ? Math.round((Number(completedTreatments?.count || 0) / Number(totalTreatments.count)) * 100)
                    : 0;

                return {
                    overdueReviews: Number(overdueReviewsResult?.count || 0),
                    unmitigatedCriticalRisks: unmitigatedRisks.length,
                    mitigationEfficiency: efficiencyRate,
                    controlImplementationRate: implementationRate,

                    // Legacy support if needed (optional)
                    highRiskCount: Number(unmitigatedRisks.length), // Reusing this field or keep original logic? Better to stick to new API contract.
                    avgResidualScore: 0, // Deprecating or calculate if UI still needs it
                    linkedControlsCount: 0,
                    treatmentProgress: implementationRate
                };
            }),

        // Threats Management
        getThreats: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(threats)
                    .where(eq(threats.clientId, input.clientId))
                    .orderBy(desc(threats.createdAt));
            }),

        createThreat: procedure
            .input(z.object({
                clientId: z.number(),
                threatId: z.string().optional(),
                name: z.string(),
                description: z.string().optional(),
                category: z.string().optional(),
                source: z.string().optional(),
                intent: z.string().optional(),
                likelihood: z.string().optional(),
                potentialImpact: z.string().optional(),
                status: z.enum(["active", "mitigated", "archived"]).optional().default("active"),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create threats' });
                }
                const db = await getDb();

                // If no threatId is provided, generate one
                const data = {
                    ...input,
                    threatId: input.threatId || `THREAT-${Date.now()}`
                };

                const [threat] = await db.insert(threats)
                    .values(data)
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "threat", entityId: threat.id, details: { name: threat.name } });
                return threat;
            }),

        updateThreat: procedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                category: z.string().optional(),
                source: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update threats' });
                }
                const db = await getDb();
                const { id, clientId, ...data } = input;
                const [threat] = await db.update(threats)
                    .set({ ...data, updatedAt: new Date() })
                    .where(and(eq(threats.id, id), eq(threats.clientId, clientId)))
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId, action: "update", entityType: "threat", entityId: id, details: { changes: data } });
                return threat;
            }),

        // Vulnerabilities Management
        getVulnerabilities: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(vulnerabilities)
                    .where(eq(vulnerabilities.clientId, input.clientId))
                    .orderBy(desc(vulnerabilities.createdAt));
            }),

        createVulnerability: procedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                description: z.string().optional(),
                category: z.string().optional(),
                affectedAssets: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create vulnerabilities' });
                }
                const db = await getDb();
                const [vulnerability] = await db.insert(vulnerabilities)
                    .values(input)
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "vulnerability", entityId: vulnerability.id, details: { name: vulnerability.name } });
                return vulnerability;
            }),

        updateVulnerability: procedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                category: z.string().optional(),
                affectedAssets: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update vulnerabilities' });
                }
                const db = await getDb();
                const { id, clientId, ...data } = input;
                const [vulnerability] = await db.update(vulnerabilities)
                    .set({ ...data, updatedAt: new Date() })
                    .where(and(eq(vulnerabilities.id, id), eq(vulnerabilities.clientId, clientId)))
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId, action: "update", entityType: "vulnerability", entityId: id, details: { changes: data } });
                return vulnerability;
            }),

        // Risk Assessments (alias for list)
        getRiskAssessments: procedure
            .input(z.object({ clientId: z.coerce.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(riskAssessments)
                    .where(eq(riskAssessments.clientId, input.clientId))
                    .orderBy(desc(riskAssessments.updatedAt));
            }),

        createRiskAssessment: procedure
            .input(z.object({
                clientId: z.coerce.number(),
                title: z.string(),
                threatId: z.coerce.number().optional(),
                vulnerabilityId: z.coerce.number().optional(),
                likelihood: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v),
                impact: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v),
                status: z.enum(["draft", "approved", "reviewed"]).default("draft"),
                contextSnapshot: z.any().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create risk assessments' });
                }
                const db = await getDb();

                const inherentScore = input.likelihood * input.impact;
                const inherentRisk = getMatrixScoreLevel(inherentScore);

                const [assessment] = await db.insert(riskAssessments)
                    .values({
                        ...input,
                        assessmentId: `RA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                        likelihood: String(input.likelihood),
                        impact: String(input.impact),
                        inherentScore,
                        inherentRisk,
                    })
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "risk", entityId: assessment.id, details: { title: assessment.title } });
                return assessment;
            }),

        updateRiskAssessment: procedure
            .input(z.object({
                id: z.coerce.number(),
                clientId: z.coerce.number(),
                title: z.string().optional(),
                threatId: z.coerce.number().optional(),
                vulnerabilityId: z.coerce.number().optional(),
                likelihood: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v).optional(),
                impact: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 3 : v).optional(),
                status: z.enum(["draft", "approved", "reviewed"]).optional(),
                contextSnapshot: z.any().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update risk assessments' });
                }
                const db = await getDb();
                const { id, clientId, ...data } = input;

                // Recalculate scores if likelihood or impact changed
                let updateData: any = { ...data, updatedAt: new Date() };
                if (data.likelihood !== undefined || data.impact !== undefined) {
                    const [current] = await db.select().from(riskAssessments).where(eq(riskAssessments.id, id));
                    const likelihood = data.likelihood !== undefined ? data.likelihood : Number(current.likelihood);
                    const impact = data.impact !== undefined ? data.impact : Number(current.impact);
                    updateData.likelihood = String(likelihood);
                    updateData.impact = String(impact);
                    updateData.inherentScore = likelihood * impact;
                    updateData.inherentRisk = getMatrixScoreLevel(updateData.inherentScore);
                }

                const [assessment] = await db.update(riskAssessments)
                    .set(updateData)
                    .where(and(eq(riskAssessments.id, id), eq(riskAssessments.clientId, clientId)))
                    .returning();

                await logActivity({ userId: ctx.user.id, clientId, action: "update", entityType: "risk", entityId: id, details: { changes: data } });

                // Recalculate residual score if likelihood or impact changed
                if (data.likelihood !== undefined || data.impact !== undefined) {
                    await recalculateRiskScore(db, id);
                }

                return assessment;
            }),

        // Risk Treatments
        getRiskTreatments: procedure
            .input(z.object({ riskAssessmentId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(riskTreatments)
                    .where(eq(riskTreatments.riskAssessmentId, input.riskAssessmentId))
                    .orderBy(desc(riskTreatments.createdAt));
            }),



        getAllTreatments: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select({
                    id: riskTreatments.id,
                    riskAssessmentId: riskTreatments.riskAssessmentId,
                    strategy: riskTreatments.strategy,
                    status: riskTreatments.status,
                    dueDate: riskTreatments.dueDate,
                    owner: riskTreatments.owner,
                    priority: riskTreatments.priority,
                    treatmentType: riskTreatments.treatmentType,
                    estimatedCost: riskTreatments.estimatedCost,
                    riskTitle: riskAssessments.title,
                    riskId: riskAssessments.assessmentId,
                    inherentRisk: riskAssessments.inherentRisk,
                    residualRisk: riskAssessments.residualRisk,
                    updatedAt: riskTreatments.updatedAt
                })
                    .from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(eq(riskAssessments.clientId, input.clientId))
                    .orderBy(desc(riskTreatments.dueDate));
            }),

        createRiskTreatment: procedure
            .input(z.object({
                clientId: z.number(),
                riskAssessmentId: z.number().optional(),
                riskScenarioId: z.number().optional(),
                treatmentType: z.enum(['mitigate', 'transfer', 'accept', 'avoid']),
                strategy: z.string().optional(),
                justification: z.string().optional(),
                owner: z.string().optional(),
                dueDate: z.string().optional(),
                priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
                estimatedCost: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot create treatments' });
                const db = await getDb();
                const [treatment] = await db.insert(riskTreatments).values({
                    ...input,
                    dueDate: input.dueDate ? new Date(input.dueDate) : null,
                    status: 'planned'
                } as any).returning();
                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "create", entityType: "treatment", entityId: treatment.id, details: { strategy: treatment.strategy } });
                return treatment;
            }),

        updateRiskTreatment: procedure
            .input(z.object({
                id: z.number(),
                treatmentType: z.enum(['mitigate', 'transfer', 'accept', 'avoid']).optional(),
                strategy: z.string().optional(),
                justification: z.string().optional(),
                owner: z.string().optional(),
                dueDate: z.string().optional(),
                priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
                status: z.string().optional(),
                estimatedCost: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot update treatments' });
                const db = await getDb();
                const { id, ...data } = input;
                const updateData: any = { ...data, updatedAt: new Date() };
                if (input.dueDate) updateData.dueDate = new Date(input.dueDate);

                const [updated] = await db.update(riskTreatments)
                    .set(updateData)
                    .where(eq(riskTreatments.id, id))
                    .returning();
                return updated;
            }),

        deleteRiskTreatment: procedure
            .input(z.object({
                id: z.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot delete treatments' });
                const db = await getDb();

                // Delete the treatment
                await db.delete(riskTreatments)
                    .where(eq(riskTreatments.id, input.id));

                await logActivity({ userId: ctx.user.id, clientId: ctx.clientId, action: "delete", entityType: "treatment", entityId: input.id });
                return { success: true };
            }),

        linkTreatmentControl: procedure
            .input(z.object({
                treatmentId: z.number(),
                controlId: z.number(),
                effectiveness: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
                implementationNotes: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.clientRole === 'viewer') throw new TRPCError({ code: 'FORBIDDEN', message: 'Viewers cannot link controls' });
                const db = await getDb();

                // Check existence
                const existing = await db.select().from(treatmentControls)
                    .where(and(
                        eq(treatmentControls.treatmentId, input.treatmentId),
                        eq(treatmentControls.controlId, input.controlId)
                    ));

                if (existing.length > 0) {
                    const [updated] = await db.update(treatmentControls)
                        .set({
                            effectiveness: input.effectiveness,
                            implementationNotes: input.implementationNotes,
                            updatedAt: new Date()
                        })
                        .where(eq(treatmentControls.id, existing[0].id))
                        .returning();

                    // Get treatment to find risk
                    const [treatment] = await db.select().from(riskTreatments)
                        .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                        .where(eq(riskTreatments.id, input.treatmentId));

                    if (treatment && treatment.risk_assessments) {
                        await recalculateRiskScore(db, treatment.risk_assessments.id);
                    }

                    return updated;
                }

                // Need clientId
                const [treatment] = await db.select().from(riskTreatments)
                    .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
                    .where(eq(riskTreatments.id, input.treatmentId));

                if (!treatment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Treatment not found' });
                const clientId = treatment.risk_assessments.clientId;

                const [linked] = await db.insert(treatmentControls).values({
                    clientId,
                    treatmentId: input.treatmentId,
                    controlId: input.controlId,
                    effectiveness: input.effectiveness,
                    implementationNotes: input.implementationNotes
                }).returning();

                // Auto-recalculate risk score
                if (treatment.risk_assessments) {
                    await recalculateRiskScore(db, treatment.risk_assessments.id);
                }

                return linked;
            }),


        // --- STAKEHOLDERS ---
        getStakeholders: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Fetch from different tables
                const [employees, crmContacts, vendorContacts, clientContacts] = await Promise.all([
                    db.select().from(schema.employees).where(eq(schema.employees.clientId, input.clientId)),
                    db.select().from(schema.crmContacts).where(eq(schema.crmContacts.clientId, input.clientId)),
                    db.select().from(schema.vendorContacts).where(eq(schema.vendorContacts.clientId, input.clientId)),
                    db.select().from(schema.clientContacts).where(eq(schema.clientContacts.clientId, input.clientId))
                ]);

                // Normalize and combine
                const stakeholders = [
                    ...employees.map((e: any) => ({
                        id: `emp-${e.id}`,
                        originalId: e.id,
                        source: 'employee',
                        firstName: e.firstName,
                        lastName: e.lastName,
                        email: e.email,
                        jobTitle: e.jobTitle,
                        department: e.department,
                        role: 'Internal Employee',
                        type: 'internal'
                    })),
                    ...clientContacts.map((c: any) => ({
                        id: `cc-${c.id}`,
                        originalId: c.id,
                        source: 'client_contact',
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email,
                        jobTitle: c.role,
                        department: c.department,
                        role: c.role || 'Stakeholder',
                        type: 'external'
                    })),
                    ...crmContacts.map((c: any) => ({
                        id: `crm-${c.id}`,
                        originalId: c.id,
                        source: 'crm_contact',
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email,
                        jobTitle: c.jobTitle,
                        department: null,
                        role: c.category || 'CRM Contact',
                        type: 'external'
                    })),
                    ...vendorContacts.map((c: any) => ({
                        id: `vc-${c.id}`,
                        originalId: c.id,
                        source: 'vendor_contact',
                        firstName: c.name.split(' ')[0], // Best effort
                        lastName: c.name.split(' ').slice(1).join(' '), // Best effort
                        email: c.email,
                        jobTitle: c.role,
                        department: null,
                        role: 'Vendor Contact',
                        type: 'external'
                    }))
                ];

                return stakeholders;
            }),

        createStakeholder: procedure
            .input(z.object({
                clientId: z.number(),
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().email().optional().or(z.literal('')),
                role: z.string().optional(),
                department: z.string().optional(),
                phone: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                console.log('[createStakeholder] Mutation started', { input, userId: ctx.user?.id });
                try {
                    const db = await getDb();
                    console.log('[createStakeholder] DB connected');

                    const [newContact] = await db.insert(schema.clientContacts).values({
                        clientId: input.clientId,
                        firstName: input.firstName,
                        lastName: input.lastName,
                        email: input.email || null,
                        role: input.role || "Stakeholder", // Default role
                        department: input.department,
                        phone: input.phone || null,
                        createdBy: ctx.user?.id
                    }).returning();

                    console.log('[createStakeholder] Contact inserted', newContact);

                    console.log('[createStakeholder] Logging activity...');
                    await logActivity({
                        userId: ctx.user.id,
                        clientId: input.clientId,
                        action: "create",
                        entityType: "stakeholder",
                        entityId: newContact.id,
                        details: { name: `${input.firstName} ${input.lastName}`, email: input.email }
                    });
                    console.log('[createStakeholder] Activity logged. Success.');

                    return newContact;
                } catch (error) {
                    console.error('[createStakeholder] Error failed:', error);
                    throw error;
                }
            }),

        deleteStakeholder: procedure
            .input(z.object({
                id: z.string(),
                clientId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Expect ID format "cc-123"
                if (!input.id.startsWith('cc-')) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only manually created stakeholders can be deleted here.' });
                }

                const contactId = parseInt(input.id.replace('cc-', ''));
                if (isNaN(contactId)) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid stakeholder ID' });
                }

                await db.delete(schema.clientContacts).where(and(
                    eq(schema.clientContacts.id, contactId),
                    eq(schema.clientContacts.clientId, input.clientId)
                ));

                await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: "delete", entityType: "stakeholder", entityId: contactId, details: {} });
                return { success: true };
            }),
    });
};
