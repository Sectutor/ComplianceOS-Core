
import { z } from "zod";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
// import { generateGapAnalysisDocx } from "../lib/reporting/gapAnalysisReport";
// import { llmService } from "../../lib/llm/service";



export const createGapAnalysisRouter = (t: any, clientProcedure: any) => {
    return t.router({
        list: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const results = await dbConn.select().from(schema.gapAssessments)
                    .where(eq(schema.gapAssessments.clientId, input.clientId))
                    .orderBy(desc(schema.gapAssessments.updatedAt));
                return results;
            }),

        get: clientProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.select().from(schema.gapAssessments).where(eq(schema.gapAssessments.id, input.id));
                if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
                const responses = await dbConn.select().from(schema.gapResponses).where(eq(schema.gapResponses.assessmentId, input.id));
                return { assessment, responses };
            }),

        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                framework: z.string(),
                scope: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [assessment] = await dbConn.insert(schema.gapAssessments).values({
                    clientId: input.clientId,
                    name: input.name,
                    framework: input.framework,
                    scope: input.scope,
                    status: 'draft',
                }).returning();
                return assessment;
            }),

        updateResponse: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                controlId: z.string(),
                currentStatus: z.string().optional(),
                targetStatus: z.string().optional(),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // Check if response exists
                const existing = await dbConn.select().from(schema.gapResponses).where(and(
                    eq(schema.gapResponses.assessmentId, input.assessmentId),
                    eq(schema.gapResponses.controlId, input.controlId)
                ));

                if (existing.length === 0) {
                    // Create if not exists (lazy creation)
                    await dbConn.insert(schema.gapResponses).values({
                        assessmentId: input.assessmentId,
                        controlId: input.controlId,
                        currentStatus: input.currentStatus,
                        targetStatus: input.targetStatus,
                        notes: input.notes
                    });
                } else {
                    await dbConn.update(schema.gapResponses)
                        .set({
                            currentStatus: input.currentStatus,
                            targetStatus: input.targetStatus,
                            notes: input.notes,
                            updatedAt: new Date()
                        })
                        .where(and(
                            eq(schema.gapResponses.assessmentId, input.assessmentId),
                            eq(schema.gapResponses.controlId, input.controlId)
                        ));
                }

                // Update assessment updated_at
                await dbConn.update(schema.gapAssessments)
                    .set({ updatedAt: new Date() })
                    .where(eq(schema.gapAssessments.id, input.assessmentId));

                return { success: true };
            }),

        complete: clientProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.update(schema.gapAssessments)
                    .set({ status: 'completed', updatedAt: new Date() })
                    .where(eq(schema.gapAssessments.id, input.id));
                return { success: true };
            }),

        calculatePriorities: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                try {
                    const dbConn = await getDb();

                    // Fetch the assessment to get the framework
                    const [assessment] = await dbConn.select()
                        .from(schema.gapAssessments)
                        .where(eq(schema.gapAssessments.id, input.assessmentId));
                    if (!assessment) throw new TRPCError({ code: 'NOT_FOUND' });

                    // Fetch only gap responses that need scoring
                    const responses = await dbConn.select()
                        .from(schema.gapResponses)
                        .where(eq(schema.gapResponses.assessmentId, input.assessmentId));

                    // Fetch controls ONLY for this framework — avoids loading all 5000+ rows
                    let controlMap = new Map<string, any>();
                    if (assessment.framework) {
                        const frameworkControls = await dbConn.select()
                            .from(schema.controls)
                            .where(eq(schema.controls.framework, assessment.framework));
                        controlMap = new Map(frameworkControls.map((c: any) => [c.controlId, c]));
                    }

                    let scored = 0;
                    for (const r of responses) {
                        if (r.currentStatus === 'implemented' || r.currentStatus === 'not_applicable') continue;

                        const control = controlMap.get(r.controlId) ?? null;
                        const score = computePriorityScore(r, control);
                        const severity = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';

                        await dbConn.update(schema.gapResponses)
                            .set({ priorityScore: score, gapSeverity: severity })
                            .where(eq(schema.gapResponses.id, r.id));
                        scored++;
                    }

                    return { success: true, scored };
                } catch (err: any) {
                    if (err instanceof TRPCError) throw err;
                    console.error('[gapAnalysis.calculatePriorities] Error:', err?.message || err);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: err?.message || 'Failed to calculate priorities',
                    });
                }
            }),

        exportReport: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                throw new Error("Gap Analysis Export is a Premium feature.");
            }),

        updateReportDetails: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                executiveSummary: z.string().optional(),
                introduction: z.string().optional(),
                keyRecommendations: z.array(z.string()).optional(),
                scope: z.string().optional(),
                methodology: z.string().optional(),
                assumptions: z.string().optional(),
                references: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.update(schema.gapAssessments)
                    .set({
                        executiveSummary: input.executiveSummary,
                        introduction: input.introduction,
                        keyRecommendations: input.keyRecommendations,
                        scope: input.scope,
                        methodology: input.methodology,
                        assumptions: input.assumptions,
                        references: input.references,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.gapAssessments.id, input.assessmentId));
                return { success: true };
            }),


        generateReportContent: clientProcedure
            .input(z.object({ assessmentId: z.number() }))
            .mutation(async ({ input }: any) => {
                return {
                    executiveSummary: "Assessment completed. Upgrade to Premium for AI-generated insights.",
                    keyRecommendations: ["Review high priority gaps.", "Allocate budget for remediation."]
                };
            }),

        convertFindingToTask: clientProcedure
            .input(z.object({
                assessmentId: z.number(),
                controlId: z.string(),
                clientId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                ownerId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Verify existence
                const [assessment] = await dbConn.select().from(schema.gapAssessments).where(eq(schema.gapAssessments.id, input.assessmentId));
                if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

                // 2. Create the project task
                const [task] = await dbConn.insert(schema.projectTasks).values({
                    clientId: input.clientId,
                    title: `REMEDIATION: ${input.title}`,
                    description: input.description || `Closes gap for control ${input.controlId} discovered in assessment ${assessment.name}`,
                    status: 'todo',
                    priority: 'high',
                    sourceType: 'gap_analysis',
                    sourceId: input.assessmentId.toString(),
                    category: 'Remediation'
                }).returning();

                // 3. Update the gap response to link to the task
                await dbConn.update(schema.gapResponses)
                    .set({
                        remediationPlan: `Assigned as task #${task.id}: ${task.title}`,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(schema.gapResponses.assessmentId, input.assessmentId),
                        eq(schema.gapResponses.controlId, input.controlId)
                    ));

                return { success: true, taskId: task.id };
            }),
    });
};

// ─── AI Priority Scoring Engine ──────────────────────────────────────────────
// Deterministic, explainable priority scores (0-100) for gap analysis controls.
// Factors: domain criticality, control family, keyword analysis, gap-size.

function computePriorityScore(response: any, control: any): number {
    // ── Factor 1: Domain / Category criticality (0–40 pts) ──────────────────
    const domainScore = getDomainScore(control?.category || '');

    // ── Factor 2: Control ID family weight (0–20 pts) ───────────────────────
    const controlIdScore = getControlIdScore(control?.controlId || '');

    // ── Factor 3: Keyword criticality from name + description (0–25 pts) ────
    const text = `${control?.name || ''} ${control?.description || ''}`.toLowerCase();
    const keywordScore = getKeywordScore(text);

    // ── Factor 4: Gap-size multiplier ─────────────────────────────────────────
    //  not_implemented = full gap → weight 1.0
    //  partially_implemented  → weight 0.70
    //  planned / other        → weight 0.45
    const status = response.currentStatus || 'not_implemented';
    const multiplier =
        status === 'not_implemented' ? 1.0 :
            status === 'partially_implemented' ? 0.70 :
                0.45;

    const raw = (domainScore + controlIdScore + keywordScore) * multiplier;
    return Math.min(100, Math.round(raw));
}

function getDomainScore(category: string): number {
    const c = category.toLowerCase();
    // Access Control / Identity — highest risk exposure
    if (c.includes('access control') || c.includes('identity') || c.includes('iam') || c.includes('authentication')) return 40;
    // Cryptography / Data Protection
    if (c.includes('cryptograph') || c.includes('data protection') || c.includes('data security')) return 38;
    // Incident Management
    if (c.includes('incident') || c.includes('response') || c.includes('respond')) return 36;
    // Audit & Accountability / Monitoring
    if (c.includes('audit') || c.includes('accountability') || c.includes('logging') || c.includes('monitoring')) return 34;
    // Configuration / Hardening
    if (c.includes('configuration') || c.includes('hardening') || c.includes('baseline')) return 32;
    // Vulnerability Management
    if (c.includes('vulnerab') || c.includes('patch') || c.includes('scan')) return 30;
    // Risk Assessment
    if (c.includes('risk assessment') || c.includes('risk management')) return 28;
    // Supply Chain / Third Party
    if (c.includes('supply chain') || c.includes('third party') || c.includes('vendor') || c.includes('tprm')) return 26;
    // Business Continuity
    if (c.includes('continuity') || c.includes('recovery') || c.includes('disaster')) return 24;
    // Network Security
    if (c.includes('network') || c.includes('firewall') || c.includes('perimeter')) return 22;
    // Governance / Policy
    if (c.includes('governance') || c.includes('policy') || c.includes('program')) return 20;
    // Physical Security
    if (c.includes('physical') || c.includes('facility')) return 18;
    // Awareness / Training
    if (c.includes('awareness') || c.includes('training')) return 15;
    // Default
    return 20;
}

function getControlIdScore(controlId: string): number {
    const id = controlId.toUpperCase();
    // NIST CSF v2 — Protect.Access Control is highest priority
    if (id.startsWith('PR.AA') || id.startsWith('PR.AC')) return 20;
    if (id.startsWith('PR.DS') || id.startsWith('PR.IP')) return 18;
    if (id.startsWith('DE.CM') || id.startsWith('DE.AE')) return 16;
    if (id.startsWith('PR.PS') || id.startsWith('PR.IR')) return 15;
    if (id.startsWith('ID.RA') || id.startsWith('ID.AM')) return 14;
    if (id.startsWith('RS.') || id.startsWith('RC.')) return 13;
    if (id.startsWith('GV.') || id.startsWith('ID.')) return 10;
    // ISO 27001 — A.9 Access Control, A.10 Cryptography are critical
    if (id.startsWith('A.9') || id.startsWith('A.10')) return 20;
    if (id.startsWith('A.12') || id.startsWith('A.13')) return 17;
    if (id.startsWith('A.16') || id.startsWith('A.17')) return 16;
    if (id.startsWith('A.14') || id.startsWith('A.11')) return 14;
    if (id.startsWith('A.')) return 10;
    // SOC 2 — CC6 (Logical & Physical Access) and CC7 (System Operations) are highest
    if (id.startsWith('CC6') || id.startsWith('CC7')) return 20;
    if (id.startsWith('CC8') || id.startsWith('CC9')) return 17;
    if (id.startsWith('CC5') || id.startsWith('CC4')) return 14;
    if (id.startsWith('CC') || id.startsWith('AV') || id.startsWith('C.')) return 10;
    // NIST 800-53 — high priority families
    if (id.startsWith('AC-') || id.startsWith('IA-') || id.startsWith('AU-')) return 20;
    if (id.startsWith('SC-') || id.startsWith('SI-') || id.startsWith('CA-')) return 17;
    if (id.startsWith('IR-') || id.startsWith('CP-') || id.startsWith('RA-')) return 15;
    if (id.startsWith('CM-') || id.startsWith('SA-')) return 13;
    // CIS Controls
    if (id.startsWith('CIS-1') || id.startsWith('CIS-2') || id.startsWith('CIS-3')) return 18;
    if (id.startsWith('CIS-4') || id.startsWith('CIS-5') || id.startsWith('CIS-6')) return 16;
    return 8; // default
}

function getKeywordScore(text: string): number {
    let score = 0;
    // Auth / identity — highest criticality keywords
    if (/multi.?factor|mfa|two.?factor|2fa/.test(text)) score += 20;
    else if (/authenticat|credential|single sign|sso|saml|oauth/.test(text)) score += 14;
    // Encryption / data security
    if (/encrypt|tls|ssl|pki|cryptograph|key management/.test(text)) score += 18;
    // Privileged access
    if (/privileged|least privilege|admin|superuser|sudo/.test(text)) score += 15;
    // Incident / breach
    if (/incident|breach|comprom|ransomware|intrusion/.test(text)) score += 15;
    // Detection / monitoring
    if (/monitor|detect|siem|log analysis|anomaly/.test(text)) score += 12;
    // Vulnerability management
    if (/vulnerabilit|patch|cve|scanner|pentest/.test(text)) score += 10;
    // Continuity / recovery
    if (/backup|recovery|rto|rpo|disaster/.test(text)) score += 8;
    // Secrets / passwords
    if (/password|secret|passphrase|token/.test(text)) score += 8;
    // Network segmentation / firewall
    if (/firewall|segmentation|dmz|vlan|vpn/.test(text)) score += 6;
    // Training / awareness
    if (/awareness|training|phish|social engineer/.test(text)) score += 4;
    return Math.min(25, score); // cap keyword boost at 25
}
