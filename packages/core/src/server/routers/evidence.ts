
import archiver from 'archiver';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, sql, getTableColumns, lt, or, inArray, like } from "drizzle-orm";
import { llmService } from "../../lib/llm/service";
import { recalculateRiskScore } from "../services/riskService";

// Shared Framework Seed Data
export const FRAMEWORK_SEEDS: Record<string, any[]> = {
    'ISO 27001': [
        { id: "REQ-ISO-01", title: "Organizational Chart", description: "Current organizational chart showing security reporting lines.", location: "HR/Admin" },
        { id: "REQ-ISO-02", title: "Information Security Policy", description: "Latest approved version of the InfoSec Policy.", location: "Policy Repo" },
        { id: "REQ-ISO-03", title: "Asset Inventory", description: "Inventory of all information assets.", location: "IT" },
        { id: "REQ-ISO-04", title: "Access Control Policy", description: "Policy defining access control rights.", location: "IAM" },
        { id: "REQ-ISO-05", title: "Risk Assessment Report", description: "Most recent risk assessment methodology and results.", location: "Risk Mgmt" },
        { id: "REQ-ISO-06", title: "Incident Response Plan", description: "Current incident response plan.", location: "SecOps" },
        { id: "REQ-ISO-07", title: "Statement of Applicability", description: "SoA document defining control applicability.", location: "Compliance" },
        { id: "REQ-ISO-08", title: "Acceptable Use Policy", description: "Signed AUPs or policy acknowledgement stats.", location: "HR" },
        { id: "REQ-ISO-09", title: "Backup Policy & Logs", description: "Backup policy and evidence of successful restoration test.", location: "IT" },
        { id: "REQ-ISO-10", title: "Business Continuity Plan", description: "Tested BCP including RTO/RPO definitions.", location: "Operations" },
        { id: "REQ-ISO-11", title: "Disaster Recovery Testing", description: "Report from the most recent DR test.", location: "IT" },
        { id: "REQ-ISO-12", title: "Supplier Security Policy", description: "Policy for managing supplier information security risks.", location: "Procurement" },
        { id: "REQ-ISO-13", title: "Physical Security Review", description: "Evidence of physical access controls (badges, cameras).", location: "Facilities" },
        { id: "REQ-ISO-14", title: "Mobile Device Policy", description: "Policy for BYOD and corporate mobile devices.", location: "IT" },
        { id: "REQ-ISO-15", title: "Teleworking Policy", description: "Security controls for remote work.", location: "HR" },
        { id: "REQ-ISO-16", title: "Cryptography Policy", description: "Rules for encryption and key management.", location: "SecOps" },
        { id: "REQ-ISO-17", title: "Data Retention Policy", description: "Schedule for data retention and disposal.", location: "Legal" },
        { id: "REQ-ISO-18", title: "Privacy Notice", description: "External privacy policy/notice.", location: "Legal" },
        { id: "REQ-ISO-19", title: "Corrective Action Log", description: "Log of non-conformities and actions taken.", location: "Compliance" },
        { id: "REQ-ISO-20", title: "Internal Audit Report", description: "Report from the most recent internal audit.", location: "Internal Audit" },
        { id: "REQ-ISO-21", title: "Management Review Minutes", description: "Minutes from ISMS management review meetings.", location: "Management" },
        { id: "REQ-ISO-22", title: "Security Awareness Training", description: "Records of security training completion for staff.", location: "HR" },
        { id: "REQ-ISO-23", title: "Vulnerability Scan Reports", description: "Quarterly external and internal vulnerability scans.", location: "SecOps" }
    ],
    'SOC 2': [
        { id: "REQ-SOC-01", title: "System Description", description: "Comprehensive system boundaries, components and services.", location: "Engineering" },
        { id: "REQ-SOC-02", title: "Code of Ethical Conduct", description: "Signed acknowledgments for all personnel.", location: "HR" },
        { id: "REQ-SOC-03", title: "Change Control Procedures", description: "Evidence of approvals and testing for production changes.", location: "DevOps" },
        { id: "REQ-SOC-04", title: "Subservice Organization Review", description: "Annual review of SOC reports for critical vendors (AWS, etc).", location: "Governance" },
        { id: "REQ-SOC-05", title: "External Penetration Test", description: "Annual external pen test report and remediation evidence.", location: "SecOps" },
        { id: "REQ-SOC-06", title: "Backup & Restore Results", description: "Logs showing successful completion and periodic restoration tests.", location: "IT/Ops" },
        { id: "REQ-SOC-07", title: "Security Governance Minutes", description: "Evidence of management oversight and risk committee meetings.", location: "Legal" },
        { id: "REQ-SOC-08", title: "User Access Reviews", description: "Quarterly reviews of system access for all users.", location: "IT/IAM" },
        { id: "REQ-SOC-09", title: "Onboarding/Offboarding Logs", description: "Evidence of timely access grant/revocation for employees.", location: "HR/IT" },
        { id: "REQ-SOC-10", title: "Risk Assessment", description: "Formal annual risk assessment documenting threats and mitigations.", location: "Risk Mgmt" },
        { id: "REQ-SOC-11", title: "Incident Response Testing", description: "Tabletop exercise report or actual incident post-mortem.", location: "SecOps" }
    ],
    'HIPAA': [
        { id: "REQ-HIP-01", title: "Security Risk Analysis", description: "Comprehensive assessment of potential risks to ePHI.", location: "Compliance" },
        { id: "REQ-HIP-02", title: "Sanction Policy & Records", description: "Policy and evidence of enforcement for security violations.", location: "HR" },
        { id: "REQ-HIP-03", title: "Notice of Privacy Practices", description: "Copy of the NPP and evidence of distribution to patients.", location: "Legal" },
        { id: "REQ-HIP-04", title: "Business Associate Agreements", description: "Signed BAAs for all third parties handling ePHI.", location: "Procurement" },
        { id: "REQ-HIP-05", title: "Contingency Plan Backup", description: "Specific procedures and evidence for ePHI data backup.", location: "IT" },
        { id: "REQ-HIP-06", title: "Facility Access Controls", description: "Logs or policies for physical access to ePHI areas.", location: "Facilities" },
        { id: "REQ-HIP-07", title: "Workstation Security", description: "Policy for workstation use and security (locks, screens).", location: "IT" },
        { id: "REQ-HIP-08", title: "Audit Log Reviews", description: "Evidence of periodic reviews of access to ePHI.", location: "SecOps" },
        { id: "REQ-HIP-09", title: "Encryption of ePHI", description: "Evidence of encryption for ePHI at rest and in transit.", location: "Engineering" }
    ],
    'GDPR': [
        { id: "REQ-GDPR-01", title: "Record of Processing Activities", description: "Article 30 RoPA document (Data Inventory).", location: "DPO" },
        { id: "REQ-GDPR-02", title: "DPIA Reports", description: "Impact assessments for high-risk data processing activities.", location: "Compliance" },
        { id: "REQ-GDPR-03", title: "Privacy Policy (External)", description: "Customer-facing privacy notice explaining data rights.", location: "Legal" },
        { id: "REQ-GDPR-04", title: "Data Breach Notification Log", description: "Internal register of incidents and notification status.", location: "DPO" },
        { id: "REQ-GDPR-05", title: "Subject Request (DSAR) Log", description: "Evidence of handling data access/erasure requests.", location: "Support" },
        { id: "REQ-GDPR-06", title: "Standard Contractual Clauses", description: "Evidence of SCCs for international data transfers.", location: "Legal" },
        { id: "REQ-GDPR-07", title: "Consent Management", description: "Evidence of valid consent collection where applicable.", location: "Marketing" }
    ],
    'NIST CSF': [
        { id: "REQ-NIST-01", title: "Physical Asset Inventory", description: "Inventory of physical devices and systems (ID.AM-1).", location: "IT" },
        { id: "REQ-NIST-02", title: "Software Asset Inventory", description: "Inventory of software and applications (ID.AM-2).", location: "IT" },
        { id: "REQ-NIST-03", title: "Cybersecurity Policy", description: "Documented organizational information security policy (ID.GV-1).", location: "Governance" },
        { id: "REQ-NIST-04", title: "Maintenance Logs", description: "Evidence of asset maintenance and repair (PR.MA-1).", location: "IT" },
        { id: "REQ-NIST-05", title: "Incident Response Plan", description: "Documented response plan and roles (RS.RP-1).", location: "SecOps" },
        { id: "REQ-NIST-06", title: "Recovery Plan", description: "Processes to restore operations after a disaster (RC.RP-1).", location: "SecOps" },
        { id: "REQ-NIST-07", title: "Continuous Monitoring", description: "Evidence of active network/system monitoring (DE.CM-1).", location: "SecOps" }
    ],
    'PCI DSS': [
        { id: "REQ-PCI-01", title: "Network Diagram", description: "Current diagram showing CDE and connections to other networks.", location: "IT/Ops" },
        { id: "REQ-PCI-02", title: "Firewall Configurations", description: "Evidence of firewall rule reviews (every 6 months).", location: "IT/Ops" },
        { id: "REQ-PCI-03", title: "Changing Default Passwords", description: "Evidence that vendor defaults were removed from systems.", location: "IT/Ops" },
        { id: "REQ-PCI-04", title: "Restricting Access to CDE", description: "Current access list for the Cardholder Data Environment.", location: "IT/IAM" },
        { id: "REQ-PCI-05", title: "MFA for Remote Access", description: "Evidence of 2FA/MFA for all remote administrative access.", location: "IT/Security" },
        { id: "REQ-PCI-06", title: "Anti-Virus Scans/Logs", description: "Evidence of active AV and recent scanning results.", location: "IT/Ops" },
        { id: "REQ-PCI-07", title: "ASV Scanning Reports", description: "Quarterly external vulnerability scans by an ASV.", location: "SecOps" },
        { id: "REQ-PCI-08", title: "Physical Access to CDE", description: "Log of visitors and visitor badges for the server room/DC.", location: "Facilities" },
        { id: "REQ-PCI-09", title: "Information Security Policy", description: "Latest version of the annual security policy.", location: "Governance" }
    ]
};

export const createEvidenceRouter = (
    t: any,
    adminProcedure: any,
    publicProcedure: any,
    protectedProcedure: any
) => {
    return t.router({
        getFrameworks: publicProcedure
            .query(async () => {
                return Object.keys(FRAMEWORK_SEEDS).map(name => ({
                    id: name,
                    name: name
                }));
            }),
        list: publicProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const results = await db.getEvidence(input.clientId);
                // Flatten structure for report consumption
                return results.map((r: any) => ({
                    id: r.id,
                    evidenceId: r.evidenceId,
                    description: r.description,
                    status: r.status,
                    lastVerified: r.lastVerified,
                    control: r.control,
                    fileCount: r.fileCount,
                    // Map missing fields expected by frontend
                    framework: r.framework,
                    title: r.description || r.evidenceId,
                    collectionFrequency: 'On Demand', // Default
                    lastVerificationDate: r.lastVerified
                }));
            }),

        listOpenRequests: publicProcedure
            .input(z.object({
                clientId: z.number(),
                framework: z.string().optional()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();

                // Fetch pending evidence requests
                const filters = [
                    eq(schema.evidence.clientId, input.clientId),
                    eq(schema.evidence.status, 'pending')
                ];

                if (input.framework && input.framework !== 'all') {
                    filters.push(eq(schema.evidence.framework, input.framework));
                }

                const requests = await dbConn.select({
                    evidence: schema.evidence,
                    control: schema.controls
                })
                    .from(schema.evidence)
                    .leftJoin(schema.clientControls, eq(schema.evidence.clientControlId, schema.clientControls.id))
                    .leftJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
                    .where(and(...filters));

                return requests.map(r => ({
                    clientControl: {
                        id: r.evidence.clientControlId,
                        controlId: r.control?.id,
                        customDescription: r.control?.description
                    },
                    controlName: r.control?.name,
                    control: r.control?.controlId || r.evidence.evidenceId, // String ID for UI
                    // Use evidence framework as fallback
                    framework: r.evidence.framework || r.control?.framework,
                    // Standardize ID fields
                    id: r.evidence.id, // Numeric PK
                    evidenceId: r.evidence.evidenceId, // String ID (e.g. REQ-ISO-01)
                    evidenceLabel: r.evidence.description || r.evidence.evidenceId, // Friendly label
                    evidenceDescription: r.evidence.description || r.control?.description // Use control description as fallback
                }));
            }),

        getByControl: publicProcedure
            .input(z.object({ clientControlId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return await dbConn.select().from(schema.evidence)
                    .where(eq(schema.evidence.clientControlId, input.clientControlId))
                    .orderBy(desc(schema.evidence.createdAt));
            }),

        create: publicProcedure
            .input(z.object({
                clientId: z.number(),
                clientControlId: z.number(),
                evidenceId: z.string(),
                description: z.string().optional(),
                type: z.string().optional(),
                status: z.string().optional(),
                owner: z.string().nullable().optional(),
                location: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const [newEvidence] = await dbConn.insert(schema.evidence).values({
                    ...input,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as any).returning();
                return newEvidence;
            }),

        delete: publicProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.evidence)
                    .where(eq(schema.evidence.id, input.id));
                return { success: true };
            }),

        updateStatus: publicProcedure
            .input(z.object({
                evidenceId: z.number(),
                status: z.enum(['verified', 'rejected', 'collected', 'pending', 'expired', 'not_applicable'])
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // 1. Update Evidence Status
                await dbConn.update(schema.evidence)
                    .set({
                        status: input.status,
                        lastVerified: input.status === 'verified' ? new Date() : null,
                        updatedAt: new Date()
                    } as any)
                    .where(eq(schema.evidence.id, input.evidenceId));

                // 2. "Live Wire": Propagate to Control and Risk
                if (input.status === 'verified') {
                    // Get the evidence to find clientControlId
                    const [evidence] = await dbConn.select().from(schema.evidence).where(eq(schema.evidence.id, input.evidenceId));

                    if (evidence && evidence.clientControlId) {
                        // A. Update Client Control to 'implemented'
                        await dbConn.update(schema.clientControls)
                            .set({ status: 'implemented', implementationDate: new Date() })
                            .where(eq(schema.clientControls.id, evidence.clientControlId));

                        // B. Find linked treatments and update effectiveness
                        // Get the controlId from clientControl
                        const [clientControl] = await dbConn.select().from(schema.clientControls).where(eq(schema.clientControls.id, evidence.clientControlId));

                        if (clientControl) {
                            const controlId = clientControl.controlId;

                            // Find all treatmentControls for this control and client
                            const linkedTreatments = await dbConn.select()
                                .from(schema.treatmentControls)
                                .where(and(
                                    eq(schema.treatmentControls.controlId, controlId),
                                    eq(schema.treatmentControls.clientId, evidence.clientId)
                                ));

                            // Update them to 'effective'
                            if (linkedTreatments.length > 0) {
                                await dbConn.update(schema.treatmentControls)
                                    .set({ effectiveness: 'effective', updatedAt: new Date() })
                                    .where(and(
                                        eq(schema.treatmentControls.controlId, controlId),
                                        eq(schema.treatmentControls.clientId, evidence.clientId)
                                    ));

                                // C. Recalculate Risk for each affected treatment
                                for (const tc of linkedTreatments) {
                                    // Get treatment to find riskAssessmentId
                                    const [treatment] = await dbConn.select().from(schema.riskTreatments).where(eq(schema.riskTreatments.id, tc.treatmentId));
                                    if (treatment) {
                                        await recalculateRiskScore(dbConn, treatment.riskAssessmentId);
                                    }
                                }
                            }
                        }
                    }
                }

                return { success: true };
            }),

        linkIntegration: protectedProcedure
            .input(z.object({
                evidenceId: z.number(),
                provider: z.string(), // 'github', 'aws', 'jira'
                resourceId: z.string(), // e.g. PR URL, S3 ARN
                metadata: z.record(z.any()).optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // Update evidence to point to integration
                const safeLocation = input.resourceId ? input.resourceId.substring(0, 1024) : '';
                await dbConn.update(schema.evidence)
                    .set({
                        type: 'api',
                        location: safeLocation, // Use location for the resource link
                        description: `Linked to ${input.provider}: ${safeLocation}`,
                        status: 'collected', // Automatically mark as collected
                        updatedAt: new Date()
                    } as any)
                    .where(eq(schema.evidence.id, input.evidenceId));

                // In a real implementation: Trigger a fetch/verify job for this resource

                return { success: true };
            }),

        getFiles: publicProcedure
            .input(z.object({ evidenceId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return dbConn.select().from(schema.evidenceFiles)
                    .where(eq(schema.evidenceFiles.evidenceId, input.evidenceId));
            }),

        analyze: publicProcedure
            .input(z.object({
                evidenceId: z.number(),
                controlName: z.string().optional(),
                controlDescription: z.string().nullable().optional(), // Allow null
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();

                // Get the evidence item to check for existing content
                const [evidenceItem] = await dbConn.select().from(schema.evidence).where(eq(schema.evidence.id, input.evidenceId));

                if (!evidenceItem) throw new Error("Evidence not found");

                // Check for attached files
                const files = await dbConn.select().from(schema.evidenceFiles)
                    .where(eq(schema.evidenceFiles.evidenceId, input.evidenceId))
                    .orderBy(desc(schema.evidenceFiles.createdAt))
                    .limit(1);

                let content = "";

                if (files.length > 0) {
                    const file = files[0];
                    content = `File Name: ${file.filename}\nContent Type: ${file.contentType}\nFile Size: ${file.fileSize} bytes\n`;

                    // In a real implementation: Fetch file content from S3/Storage and extract text (PDF/DOCX)
                    // For now, we simulate extraction based on file metadata and description
                    content += `(Simulated Extraction): This document appears to be a ${file.filename.split('.').pop()} file related to ${input.controlName || 'compliance'}.`;
                } else if (evidenceItem.description && evidenceItem.description.length > 20) {
                    content = evidenceItem.description;
                } else {
                    content = "No file attached and description is too short.";
                }

                if (content.includes("No file attached")) {
                    return {
                        analysis: {
                            isCompliant: false,
                            reasoning: "No evidence file attached or description provided.",
                            keyFindings: ["Missing documentation"],
                            confidence: "HIGH"
                        },
                        provider: "System",
                        model: "Validation"
                    };
                }

                const systemPrompt = "You are an expert compliance auditor. Analyze the provided evidence content against the control requirements. Be strict but fair.";
                const userPrompt = `
Control Name: ${input.controlName || 'Unknown'}
Control Description: ${input.controlDescription || 'No description provided'}

Evidence Content/Description:
${content.substring(0, 5000)}

Analyze if this evidence satisfies the control requirements.
Provide a structured JSON response:
{
  "isCompliant": boolean (true if sufficient, false if gaps exist),
  "reasoning": "Concise summary of why it complies or fails",
  "keyFindings": ["List of specific observations", "Positive or negative points"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

                try {
                    const response = await llmService.generate({
                        systemPrompt,
                        userPrompt,
                        temperature: 0.2,
                        jsonMode: true,
                        feature: "evidence_analysis"
                    });

                    let analysis;
                    try {
                        analysis = JSON.parse(response.text);
                    } catch (e) {
                        // Fallback if JSON parsing fails
                        analysis = {
                            isCompliant: false,
                            reasoning: "Failed to parse AI response. " + response.text.substring(0, 100),
                            keyFindings: ["AI Analysis Error"],
                            confidence: "LOW"
                        };
                    }

                    // Save analysis result to evidence (using existing description or metadata if available, but schema doesn't have JSON column yet)
                    // We'll just return it for UI display for now.

                    return {
                        analysis,
                        provider: response.provider,
                        model: response.model
                    };
                } catch (error: any) {
                    console.error("Evidence analysis failed:", error);
                    // Return a mock failure response instead of crashing
                    return {
                        analysis: {
                            isCompliant: false,
                            reasoning: "AI Service unavailable or failed. Please try again later.",
                            keyFindings: ["Analysis failed"],
                            confidence: "LOW"
                        },
                        provider: "System",
                        model: "Error"
                    };
                }
            } // Close async function

            ), // Close mutation

        seed: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                framework: z.string().optional().default('ISO 27001')
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();
                const framework = input.framework;
                console.log(`[Evidence Seed] Called for Client ID: ${input.clientId}, Framework: ${framework}`);

                // Check if evidence requests for this framework already exist
                // We assume if generic requests (clientControlId: 0) exist with this framework tag, it's already seeded.


                const selectedRequests = FRAMEWORK_SEEDS[framework] || FRAMEWORK_SEEDS['ISO 27001'];

                // Fetch ONLY existing IDs for this client/framework to avoid duplicates
                const existing = await dbConn.select({ evidenceId: schema.evidence.evidenceId }).from(schema.evidence)
                    .where(and(
                        eq(schema.evidence.clientId, input.clientId),
                        eq(schema.evidence.framework, framework)
                    ));

                const existingIds = new Set(existing.map(e => e.evidenceId));
                console.log(`[Evidence Seed] Found ${existingIds.size} existing items for framework ${framework}`);

                // Filter out requests that already exist
                const insertData = selectedRequests
                    .filter(r => !existingIds.has(r.id))
                    .map(r => ({
                        clientId: input.clientId,
                        clientControlId: 0,
                        evidenceId: r.id,
                        title: r.title,
                        description: r.description,
                        type: "file",
                        status: "pending",
                        owner: ctx.user?.email || "auditor@complianceos.com",
                        location: r.location,
                        framework: framework,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));

                console.log(`[Evidence Seed] Attempting to insert ${insertData.length} new items`);

                try {
                    if (insertData.length > 0) {
                        // Map 'title' to 'description' as 'title' column doesn't exist in schema
                        const insertPayload = insertData.map(r => ({
                            clientId: r.clientId,
                            clientControlId: r.clientControlId,
                            evidenceId: r.evidenceId,
                            description: r.title, // This is the key fix
                            type: r.type,
                            status: r.status,
                            owner: r.owner,
                            location: r.location,
                            framework: r.framework,
                            createdAt: r.createdAt,
                            updatedAt: r.updatedAt
                        }));
                        await dbConn.insert(schema.evidence).values(insertPayload as any);
                    }
                } catch (err: any) {
                    console.error("[Evidence Seed Error]", err);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to seed evidence: ${err.message}`,
                        cause: err
                    });
                }

                return {
                    success: true,
                    count: insertData.length,
                    message: insertData.length > 0 ? `Added ${insertData.length} new requests for ${framework}` : `All ${framework} requests already exist`
                };
            }),

        suggestions: t.router({
            // Get suggestions for a specific control
            get: publicProcedure
                .input(z.object({
                    controlId: z.string().optional(),
                    controlName: z.string().optional(),
                    framework: z.string().optional(),
                    category: z.string().optional()
                }))
                .query(async ({ input }: any) => {
                    const dbConn = await getDb();

                    // Fetch all templates
                    const templates = await dbConn.select().from(schema.evidenceTemplates);

                    // Filter templates by matching control pattern
                    const searchText = [
                        input.controlId,
                        input.controlName,
                        input.category
                    ].filter(Boolean).join(' ').toLowerCase();

                    const matched = templates.filter((t: any) => {
                        // Check framework match (if specified)
                        if (t.framework && input.framework && t.framework !== input.framework) {
                            return false;
                        }

                        // Check pattern match (case-insensitive)
                        try {
                            const pattern = new RegExp(t.controlPattern, 'i');
                            return pattern.test(searchText);
                        } catch {
                            // Fallback to simple contains match
                            return searchText.includes(t.controlPattern.toLowerCase());
                        }
                    });

                    // Sort by priority (higher first)
                    return matched.sort((a: any, b: any) => (b.priority || 50) - (a.priority || 50));
                }),

            // List all templates (admin)
            list: publicProcedure.query(async () => {
                const dbConn = await getDb();
                return dbConn.select().from(schema.evidenceTemplates);
            }),

            // Create template
            create: adminProcedure
                .input(z.object({
                    name: z.string(),
                    controlPattern: z.string(),
                    framework: z.string().optional(),
                    category: z.string().optional(),
                    suggestedSources: z.array(z.string()).optional(),
                    sampleDescription: z.string().optional(),
                    integrationType: z.string().optional(),
                    priority: z.number().optional(),
                }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await getDb();

                    const [template] = await dbConn.insert(schema.evidenceTemplates).values({
                        ...input,
                    }).returning();

                    return template;
                }),

            // Delete template
            delete: adminProcedure
                .input(z.object({ id: z.number() }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await getDb();

                    await dbConn.delete(schema.evidenceTemplates)
                        .where(eq(schema.evidenceTemplates.id, input.id));

                    return { success: true };
                }),

            // Seed common templates
            seed: adminProcedure.mutation(async () => {
                const dbConn = await getDb();

                const commonTemplates = [
                    {
                        name: "Access Control Evidence",
                        controlPattern: "access.*control|AC-|A\\.9|CC6",
                        suggestedSources: ["User access review logs", "Role matrix spreadsheet", "IAM policy screenshots"],
                        sampleDescription: "Screenshot of IAM policy showing least privilege access configuration",
                        integrationType: "file",
                        priority: 80
                    },
                    {
                        name: "Encryption Evidence",
                        controlPattern: "encrypt|cryptograph|SC-|A\\.10|CC6\\.1",
                        suggestedSources: ["TLS certificate export", "Encryption configuration screenshots", "Key management policy"],
                        sampleDescription: "Export of SSL/TLS certificate showing AES-256 encryption",
                        integrationType: "file",
                        priority: 75
                    },
                    {
                        name: "Logging & Monitoring",
                        controlPattern: "log|monitor|audit.*trail|AU-|A\\.12|CC7",
                        suggestedSources: ["CloudWatch/SIEM screenshot", "Audit log export", "Alert configuration"],
                        sampleDescription: "Screenshot of SIEM dashboard showing security event monitoring",
                        integrationType: "api",
                        priority: 70
                    },
                    {
                        name: "Backup Evidence",
                        controlPattern: "backup|recover|continuity|CP-|A\\.12\\.3",
                        suggestedSources: ["Backup job logs", "Recovery test results", "Backup policy document"],
                        sampleDescription: "Backup job completion logs showing daily automated backups",
                        integrationType: "api",
                        priority: 65
                    },
                    {
                        name: "Vulnerability Management",
                        controlPattern: "vulnerab|scan|patch|RA-5|SI-|A\\.12\\.6",
                        suggestedSources: ["Vulnerability scan report", "Patch management logs", "Remediation tickets"],
                        sampleDescription: "Quarterly vulnerability scan report from Qualys/Nessus",
                        integrationType: "file",
                        priority: 80
                    },
                    {
                        name: "Security Training",
                        controlPattern: "train|awareness|AT-|A\\.7\\.2",
                        suggestedSources: ["Training completion reports", "LMS screenshots", "Signed acknowledgements"],
                        sampleDescription: "Training platform export showing employee completion rates",
                        integrationType: "file",
                        priority: 50
                    },
                    {
                        name: "Change Management",
                        controlPattern: "change.*manage|CM-|A\\.12\\.1|CC8",
                        suggestedSources: ["Change tickets (Jira/ServiceNow)", "CAB meeting minutes", "Approval workflows"],
                        sampleDescription: "Sample change ticket showing approval workflow and testing evidence",
                        integrationType: "api",
                        priority: 60
                    },
                    {
                        name: "Incident Response",
                        controlPattern: "incident|IR-|A\\.16|CC7\\.4",
                        suggestedSources: ["Incident tickets", "Post-mortem reports", "Runbook documentation"],
                        sampleDescription: "Incident response playbook and sample incident ticket",
                        integrationType: "file",
                        priority: 70
                    }
                ];

                let inserted = 0;
                for (const t of commonTemplates) {
                    try {
                        await dbConn.insert(schema.evidenceTemplates).values(t);
                        inserted++;
                    } catch {
                        // Skip duplicates
                    }
                }

                return { inserted };
            }),
        }),

        addComment: protectedProcedure.input(z.object({
            evidenceId: z.number(),
            content: z.string()
        })).mutation(async ({ input, ctx }: any) => {
            const dbConn = await getDb();
            const [comment] = await dbConn.insert(schema.evidenceComments).values({
                evidenceId: input.evidenceId,
                userId: ctx.user.id,
                content: input.content
            } as any).returning();
            return comment;
        }),

        getComments: protectedProcedure.input(z.object({
            evidenceId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await getDb();
            const comments = await dbConn.select({
                id: schema.evidenceComments.id,
                content: schema.evidenceComments.content,
                createdAt: schema.evidenceComments.createdAt,
                userId: schema.evidenceComments.userId,
                userName: schema.users.name,
                userEmail: schema.users.email
            })
                .from(schema.evidenceComments)
                .leftJoin(schema.users, eq(schema.evidenceComments.userId, schema.users.id))
                .where(eq(schema.evidenceComments.evidenceId, input.evidenceId))
                .orderBy(desc(schema.evidenceComments.createdAt));
            return comments;
        }),

        getAllComments: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ input, ctx }: any) => {
            const dbConn = await getDb();

            // Get all evidence IDs for this client
            const clientEvidence = await dbConn.select({ id: schema.evidence.id }).from(schema.evidence)
                .where(eq(schema.evidence.clientId, input.clientId));

            const evidenceIds = clientEvidence.map((e: any) => e.id);

            if (evidenceIds.length === 0) return [];

            const comments = await dbConn.select({
                id: schema.evidenceComments.id,
                content: schema.evidenceComments.content,
                createdAt: schema.evidenceComments.createdAt,
                userName: schema.users.name,
                userEmail: schema.users.email,
                evidenceId: schema.evidenceComments.evidenceId,
                evidenceTitle: schema.evidence.evidenceId
            })
                .from(schema.evidenceComments)
                .innerJoin(schema.evidence, eq(schema.evidenceComments.evidenceId, schema.evidence.id))
                .leftJoin(schema.users, eq(schema.evidenceComments.userId, schema.users.id))
                .where(inArray(schema.evidenceComments.evidenceId, evidenceIds))
                .orderBy(desc(schema.evidenceComments.createdAt))
                .limit(50);

            return comments;
        }),
        pack: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                framework: z.string().optional()
            }))
            .mutation(async ({ input }) => {
                const dbConn = await getDb();
                // Fetch verified evidence items
                const evidenceList = await dbConn.select().from(schema.evidence)
                    .where(and(
                        eq(schema.evidence.clientId, input.clientId),
                        input.framework ? eq(schema.evidence.framework, input.framework) : undefined,
                        eq(schema.evidence.status, 'verified')
                    ));

                if (evidenceList.length === 0) {
                    // We can either throw or return empty. throw seems appropriate if they asked for a pack.
                    // But let's verify if filtering by status='verified' is too strict for testing? 
                    // The requirement is "sealed 'Evidence Pack'". Usually implies verified.
                }

                const evidenceIds = evidenceList.map((e) => e.id);

                // Fetch associated files for these evidence items
                const files = evidenceIds.length > 0 ? await dbConn.select().from(schema.evidenceFiles)
                    .where(inArray(schema.evidenceFiles.evidenceId, evidenceIds)) : [];

                const fs = await import('fs');
                const path = await import('path');
                const crypto = await import('crypto');

                // Ensure uploads directory exists (local storage emulation)
                const uploadDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadDir)) {
                    await fs.promises.mkdir(uploadDir, { recursive: true });
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `Compliance_Evidence_${input.clientId}_${input.framework || 'ALL'}_${timestamp}.zip`;
                const filePath = path.join(uploadDir, filename);
                const output = fs.createWriteStream(filePath);

                const archive = archiver('zip', {
                    zlib: { level: 9 }
                });

                return new Promise((resolve, reject) => {
                    output.on('close', () => {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
                        resolve({
                            url: `${baseUrl}/uploads/${filename}`,
                            filename,
                            fileCount: files.length,
                            size: archive.pointer(),
                            manifest: {
                                generatedAt: new Date(),
                                framework: input.framework || "All",
                                itemCount: evidenceList.length,
                                fileCount: files.length
                            }
                        });
                    });

                    archive.on('error', (err) => {
                        console.error("Archiver Error:", err);
                        reject(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create zip pack', cause: err }));
                    });

                    archive.pipe(output);

                    // Add Manifest
                    const manifest = {
                        generatedAt: new Date(),
                        framework: input.framework || "All",
                        items: evidenceList.map((e) => {
                            const relatedFiles = files.filter((f) => f.evidenceId === e.id);
                            return {
                                id: e.evidenceId,
                                description: e.description,
                                files: relatedFiles.map((f) => {
                                    let hash = 'manual-verification-required';

                                    // Calculate hash for local files
                                    if (f.url && f.url.startsWith('/uploads/')) {
                                        try {
                                            const localFileName = f.url.split('/').pop();
                                            const localPath = path.join(process.cwd(), 'uploads', localFileName);
                                            if (fs.existsSync(localPath)) {
                                                const fileBuffer = fs.readFileSync(localPath);
                                                hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                                            }
                                        } catch (e) {
                                            console.warn("Failed to hash file", f.filename, e);
                                        }
                                    }

                                    return {
                                        name: f.filename,
                                        size: f.fileSize,
                                        hash: hash
                                    };
                                }),
                                status: e.status
                            };
                        })
                    };
                    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

                    // Add Files
                    // Track which files we successfully added
                    const processedFiles = new Set();

                    // 1. Add actual files
                    files.forEach((f) => {
                        const evidence = evidenceList.find((e) => e.id === f.evidenceId);
                        const folderName = evidence ? evidence.evidenceId : 'Uncategorized';

                        // Handle local files
                        if (f.url && f.url.startsWith('/uploads/')) {
                            // Extract just the filename from the URL path
                            const localFileName = f.url.split('/').pop();
                            const localPath = path.join(process.cwd(), 'uploads', localFileName);

                            if (fs.existsSync(localPath)) {
                                archive.file(localPath, { name: `${folderName}/${f.filename}` });
                                processedFiles.add(f.id);
                            } else {
                                archive.append(`File defined but missing on server: ${f.filename}\nPath: ${localPath}`, { name: `${folderName}/${f.filename}.missing.txt` });
                            }
                        } else if (f.url) {
                            // Remote URL - just drop a text link file
                            archive.append(`Remote File Link: ${f.url}`, { name: `${folderName}/${f.filename}.url` });
                            processedFiles.add(f.id);
                        }
                    });

                    // 2. Add summary text for evidence items that have NO files
                    evidenceList.forEach((e) => {
                        const hasFiles = files.some((f) => f.evidenceId === e.id);
                        if (!hasFiles) {
                            const fileContent = `Evidence ID: ${e.evidenceId}\nDescription: ${e.description}\nStatus: ${e.status}\nNote: No files attached to this verified evidence item.`;
                            archive.append(fileContent, { name: `${e.evidenceId}/_info.txt` });
                        }
                    });

                    archive.finalize();
                });
            }),
    });
};
