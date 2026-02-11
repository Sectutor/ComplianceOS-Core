
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { controls } from "../../schema";
import * as schema from "../../schema";
import { eq, and, isNull, sql, asc, or, ilike } from "drizzle-orm";
import * as db from "../../db";
import * as XLSX from 'xlsx';
import { nistAiRmfControls } from '../../data/frameworks/nist_ai_rmf';

export const createFrameworksRouter = (t: any, protectedProcedure: any) => {
    console.log('[FrameworksRouter] Initializing createFrameworksRouter...');
    return t.router({
        importCustom: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                type: z.enum(["pci_dss_v4", "cis_v8", "ccm_v4", "iso22301", "hitrust", "fedramp", "fedramp_low", "fedramp_high", "cyber_essentials", "nist_ai_rmf", "iso27001", "soc2", "cis_v8_system", "owasp_aisvs", "owasp_asvs", "owasp_masvs", "owasp_samm", "owasp_api_top10", "owasp_top10", "owasp_top10_2021", "owasp_ml_top10", "owasp_scvs"]),
                fileContent: z.string().optional(), // Base64, optional for system frameworks
            }))
            .mutation(async ({ ctx, input }: any) => {
                let newControls: any[] = [];
                let frameworkName = "";

                if (input.type === "pci_dss_v4") {
                    const buffer = Buffer.from(input.fileContent || "", 'base64');
                    const workbook = XLSX.read(buffer, { type: 'buffer' });
                    frameworkName = "PCI DSS v4.0 (Custom)";
                    const sheetNames = workbook.SheetNames.filter(n => n.startsWith('Requirement'));

                    for (const sheetName of sheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                        for (const row of rows) {
                            if (!row || row.length === 0) continue;
                            const cell0 = row[0] ? String(row[0]).trim() : '';
                            const match = cell0.match(/^(\d+(?:\.\d+)+)\s+([\s\S]*)/);
                            if (match) {
                                const id = match[1];
                                const text = match[2].trim();
                                const guidance = row[2] ? String(row[2]).trim().replace(/^Purpose\s*/i, '').trim() : '';

                                newControls.push({
                                    controlId: id,
                                    name: `${id} - ${text.substring(0, 80).replace(/[\r\n]+/g, ' ')}${text.length > 80 ? '...' : ''}`,
                                    description: text,
                                    framework: frameworkName,
                                    category: sheetName,
                                    implementationGuidance: guidance,
                                    clientId: input.clientId,
                                    status: "active",
                                    version: 1,
                                    grouping: "PCI DSS"
                                });
                            }
                        }
                    }
                } else if (input.type === "cis_v8") {
                    const buffer = Buffer.from(input.fileContent || "", 'base64');
                    const workbook = XLSX.read(buffer, { type: 'buffer' });
                    frameworkName = "CIS Controls v8";
                    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Assume first sheet
                    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // CIS V8 typically has headers: "CIS Control", "Title", "Asset Type", "Security Function", "Description"
                    // We need to find the header row first
                    let headerRowIndex = 0;
                    for (let i = 0; i < Math.min(rows.length, 10); i++) {
                        const r = rows[i];
                        if (r && r.some((c: any) => String(c).includes("CIS Control") || String(c).includes("Safeguard"))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    // Map columns
                    const headers = rows[headerRowIndex].map((h: any) => String(h).toLowerCase());
                    const idIdx = headers.findIndex(h => h.includes("cis control") || h.includes("safeguard") || h === "id");
                    const titleIdx = headers.findIndex(h => h.includes("title"));
                    const descIdx = headers.findIndex(h => h.includes("description"));
                    const assetIdx = headers.findIndex(h => h.includes("asset type"));

                    for (let i = headerRowIndex + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[idIdx]) continue;

                        const id = String(row[idIdx]).trim();
                        // Skip if not a valid ID or just a section header check? 
                        // CIS IDs are usually numbers like 1.1, 1.2
                        if (!id.match(/^\d+(\.\d+)*$/)) continue;

                        newControls.push({
                            controlId: id,
                            name: row[titleIdx] || `CIS Control ${id}`,
                            description: row[descIdx] || "",
                            framework: frameworkName,
                            category: "CIS Control",
                            implementationGuidance: row[assetIdx] ? `Asset Type: ${row[assetIdx]}` : "",
                            clientId: input.clientId,
                            status: "active",
                            version: 1,
                            grouping: "CIS v8"
                        });
                    }
                } else if (input.type === "ccm_v4") {
                    const buffer = Buffer.from(input.fileContent || "", 'base64');
                    const workbook = XLSX.read(buffer, { type: 'buffer' });
                    frameworkName = "CSA CCM v4";
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // CCM V4 headers: "Control ID", "Control Title", "Control Specification", "Domain"
                    let headerRowIndex = 0;
                    for (let i = 0; i < Math.min(rows.length, 10); i++) {
                        const r = rows[i];
                        if (r && r.some((c: any) => String(c).toLowerCase().includes("control id"))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    const headers = rows[headerRowIndex].map((h: any) => String(h).toLowerCase());
                    const idIdx = headers.findIndex(h => h.includes("control id"));
                    const titleIdx = headers.findIndex(h => h.includes("control title"));
                    const descIdx = headers.findIndex(h => h.includes("control specification"));
                    const domainIdx = headers.findIndex(h => h.includes("domain"));

                    for (let i = headerRowIndex + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[idIdx]) continue;

                        const id = String(row[idIdx]).trim();
                        // CSA IDs are like AIS-01, BCR-01
                        if (id.length < 3) continue;

                        newControls.push({
                            controlId: id,
                            name: row[titleIdx] || id,
                            description: row[descIdx] || "",
                            framework: frameworkName,
                            category: row[domainIdx] || "Cloud Security",
                            implementationGuidance: "",
                            clientId: input.clientId,
                            status: "active",
                            version: 1,
                            grouping: "CCM v4"
                        });
                    }
                } else if (input.type === "iso22301") {
                    frameworkName = "ISO 22301:2019";
                    const { iso22301Controls } = await import('../../data/frameworks/iso22301');
                    newControls = iso22301Controls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "ISO 22301"
                    }));
                } else if (input.type === "hitrust") {
                    frameworkName = "HITRUST-Aligned (Representative)";
                    const { hitrustControls } = await import('../../data/frameworks/hitrust');
                    newControls = hitrustControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "HITRUST"
                    }));
                } else if (input.type === "fedramp") {
                    frameworkName = "FedRAMP Moderate";
                    const { fedrampModerateControls } = await import('../../data/frameworks/fedramp');
                    newControls = fedrampModerateControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See NIST 800-53 Rev 5 guidance.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "FedRAMP"
                    }));
                } else if (input.type === "fedramp_low") {
                    frameworkName = "FedRAMP Low";
                    const { fedrampLowControls } = await import('../../data/frameworks/fedramp');
                    newControls = fedrampLowControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See NIST 800-53 Rev 5 guidance.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "FedRAMP"
                    }));
                } else if (input.type === "fedramp_high") {
                    frameworkName = "FedRAMP High";
                    const { fedrampHighControls } = await import('../../data/frameworks/fedramp');
                    newControls = fedrampHighControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See NIST 800-53 Rev 5 guidance.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "FedRAMP"
                    }));
                } else if (input.type === "cyber_essentials") {
                    frameworkName = "Cyber Essentials / Plus";
                    const { cyberEssentialsControls } = await import('../../data/frameworks/cyberessentials');
                    newControls = cyberEssentialsControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See NCSC Cyber Essentials Requirements for IT Infrastructure.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "Cyber Essentials"
                    }));
                } else if (input.type === "nist_ai_rmf") {
                    frameworkName = "NIST AI RMF";
                    newControls = nistAiRmfControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See NIST AI 100-1 for detailed guidance.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "NIST AI RMF"
                    }));
                } else if (input.type === "iso27001") {
                    frameworkName = "ISO 27001:2022";
                    const { iso27001Controls } = await import('../../data/frameworks/iso27001');
                    newControls = iso27001Controls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See ISO/IEC 27001:2022 Annex A for detailed guidance.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "ISO 27001"
                    }));
                } else if (input.type === "soc2") {
                    frameworkName = "SOC 2 Type II";
                    const { soc2Controls } = await import('../../data/frameworks/soc2');
                    newControls = soc2Controls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See Trust Services Criteria for Security, Availability, Confidentiality, Processing Integrity, and Privacy.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "SOC 2"
                    }));
                } else if (input.type === "cis_v8_system") {
                    frameworkName = "CIS Controls v8";
                    const { cisControls } = await import('../../data/frameworks/cis');
                    newControls = cisControls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: frameworkName,
                        category: c.category,
                        implementationGuidance: "See CIS Critical Security Controls v8 for implementation steps.",
                        clientId: input.clientId,
                        status: "active",
                        version: 1,
                        grouping: "CIS v8"
                    }));
                } else if (input.type === "owasp_aisvs") {
                    frameworkName = "OWASP AISVS (AI Security)";
                    // Use bulkAssign later
                } else if (input.type === "owasp_asvs") {
                    frameworkName = "OWASP ASVS (App Security)";
                    // Use bulkAssign later
                } else if (input.type === "owasp_masvs") {
                    frameworkName = "OWASP MASVS (Mobile Security)";
                    // Use bulkAssign later
                } else if (input.type === "owasp_samm") {
                    frameworkName = "OWASP SAMM (Maturity Model)";
                    // Use bulkAssign later
                } else if (input.type === "owasp_api_top10") {
                    frameworkName = "OWASP API Security Top 10";
                    // Use bulkAssign later
                } else if (input.type === "owasp_top10") {
                    frameworkName = "OWASP Web Top 10";
                } else if (input.type === "owasp_top10_2021") {
                    frameworkName = "OWASP Web Top 10 (2021)";
                } else if (input.type === "owasp_ml_top10") {
                    frameworkName = "OWASP ML Security Top 10";
                } else if (input.type === "owasp_scvs") {
                    frameworkName = "OWASP SCVS (Supply Chain Security)";
                }

                try {
                    const d = await db.getDb();
                    if (input.type === "owasp_aisvs" || input.type === "owasp_asvs" || input.type === "owasp_masvs" || input.type === "owasp_samm" || input.type === "owasp_api_top10" || input.type === "owasp_top10" || input.type === "owasp_top10_2021" || input.type === "owasp_ml_top10" || input.type === "owasp_scvs") {
                        await db.bulkAssignControls(input.clientId, frameworkName);
                        // Count how many were assigned
                        const count = await d.select({ count: sql<number>`count(*)` })
                            .from(schema.clientControls)
                            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
                            .where(and(
                                eq(schema.clientControls.clientId, input.clientId),
                                eq(schema.controls.framework, frameworkName)
                            ));
                        return { success: true, count: Number(count[0]?.count || 0) };
                    }

                    if (newControls.length > 0) {
                        // Delete existing for this framework/client to avoid duplicates on re-import
                        await d.delete(controls).where(and(
                            eq(controls.clientId, input.clientId),
                            eq(controls.framework, frameworkName)
                        ));

                        await d.insert(controls).values(newControls);

                        // Force client refresh or cache clear if needed
                    }

                    return { success: true, count: newControls.length };
                } catch (err: any) {
                    console.error("[FrameworkImport] Mutation failed:", err);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: err.message || "Failed to import framework controls"
                    });
                }
            }),

        list: protectedProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const targetId = input?.clientId || ctx.user?.clientId;
                const d = await db.getDb();
                const result = await d.execute(sql`
          SELECT 
            framework, 
            MAX(client_id) as client_id,
            MAX(created_at) as imported_at,
            COUNT(*) as control_count
          FROM ${controls} 
          WHERE client_id IS NULL OR client_id = ${targetId}
          GROUP BY framework
         `);

                return (result.rows || result).map((r: any) => ({
                    id: r.framework, // Use name as ID
                    name: r.framework,
                    scope: r.client_id ? 'custom' : 'system',
                    importedAt: r.imported_at,
                    controlCount: r.control_count,
                    version: "1.0"
                }));
            }),

        delete: protectedProcedure
            .input(z.object({
                frameworkName: z.string(),
                clientId: z.number().optional()
            }))
            .mutation(async ({ ctx, input }: any) => {
                const targetId = input.clientId || ctx.user?.clientId;
                if (!targetId) throw new Error("Client ID required");

                const d = await db.getDb();
                await d.delete(controls).where(and(
                    eq(controls.clientId, targetId),
                    eq(controls.framework, input.frameworkName)
                ));
                return { success: true };
            }),

        getWorkProcessData: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkId: z.string() // shortCode like 'scvs' or full name
            }))
            .query(async ({ input }: { input: { clientId: number, frameworkId: string } }) => {
                const dbConn = await db.getDb();
                console.log(`[FrameworksRouter] Fetching work process data for client ${input.clientId}, framework ${input.frameworkId}`);

                // 1. Resolve framework name if it's a shortCode
                let frameworkName = input.frameworkId;
                const frameworks = await dbConn.select().from(schema.complianceFrameworks)
                    .where(eq(schema.complianceFrameworks.shortCode, input.frameworkId.toUpperCase()))
                    .limit(1);

                if (frameworks.length > 0) {
                    frameworkName = frameworks[0].name;
                }

                // 2. Fetch controls with client status and evidence counts
                const results = await dbConn.select({
                    id: schema.clientControls.id,
                    controlId: schema.controls.controlId,
                    name: schema.controls.name,
                    description: schema.controls.description,
                    status: schema.clientControls.status,
                    category: schema.controls.category,
                    implementationGuidance: schema.controls.implementationGuidance,
                    evidenceCount: sql<number>`(
                        SELECT count(*)::int 
                        FROM ${schema.evidenceRequests} 
                        WHERE ${schema.evidenceRequests.clientControlId} = ${schema.clientControls.id} 
                        AND ${schema.evidenceRequests.status} != 'rejected'
                    )`.mapWith(Number)
                })
                    .from(schema.clientControls)
                    .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
                    .where(and(
                        eq(schema.clientControls.clientId, input.clientId),
                        sql`${schema.controls.framework} IN (${frameworkName}, ${input.frameworkId.toUpperCase()}, ${input.frameworkId})`
                    ))
                    .orderBy(asc(schema.controls.controlId));

                console.log(`[FrameworksRouter] Found ${results.length} controls for ${frameworkName}`);
                return results;
            }),

        getOnboardingFrameworks: protectedProcedure
            .query(async ({ ctx }: any) => {
                const dbConn = await db.getDb();

                const allowedCodes = new Set([
                    'ISO27001',
                    'SOC2',
                    'GDPR',
                    'NISTCSF',
                    'NIST80053',
                    'NIST800171',
                    'PCIDSSV4',
                    'CISV8',
                    'ISO22301',
                    'FEDRAMP_LOW',
                    'FEDRAMP_MODERATE',
                    'FEDRAMP_HIGH',
                    'CCMV4',
                    'CYBERESSENTIALS',
                    'HITRUST'
                ]);
                const canonicalNameByCode: Record<string, string> = {
                    ISO27001: 'ISO 27001:2022',
                    SOC2: 'SOC 2 Type II',
                    GDPR: 'GDPR',
                    NISTCSF: 'NIST CSF 2.0',
                    NIST80053: 'NIST SP 800-53 Rev 5',
                    NIST800171: 'NIST SP 800-171',
                    PCIDSSV4: 'PCI DSS v4.0',
                    CISV8: 'CIS Controls v8',
                    ISO22301: 'ISO 22301:2019',
                    FEDRAMP_LOW: 'FedRAMP Low',
                    FEDRAMP_MODERATE: 'FedRAMP Moderate',
                    FEDRAMP_HIGH: 'FedRAMP High',
                    CCMV4: 'CSA CCM v4',
                    CYBERESSENTIALS: 'Cyber Essentials',
                    HITRUST: 'HITRUST'
                };
                const resolveShortCode = (text: string | null | undefined) => {
                    if (!text) return null;
                    const t = String(text).toUpperCase();
                    if (t.includes('ISO') && t.includes('27001')) return 'ISO27001';
                    if (t.includes('SOC') && t.includes('2')) return 'SOC2';
                    if (t.includes('GDPR')) return 'GDPR';
                    if (t.includes('NIST') && t.includes('CSF')) return 'NISTCSF';
                    if (t.includes('800-53') || (t.includes('800') && t.includes('53'))) return 'NIST80053';
                    if (t.includes('800-171') || (t.includes('800') && t.includes('171'))) return 'NIST800171';
                    if (t.includes('PCI') && t.includes('DSS')) return 'PCIDSSV4';
                    if (t.includes('CIS') && t.includes('V8')) return 'CISV8';
                    if (t.includes('CIS') && t.includes('CONTROLS') && !t.includes('V7')) return 'CISV8';
                    if (t.includes('ISO') && t.includes('22301')) return 'ISO22301';
                    if (t.includes('FEDRAMP') && t.includes('LOW')) return 'FEDRAMP_LOW';
                    if (t.includes('FEDRAMP') && t.includes('MODERATE')) return 'FEDRAMP_MODERATE';
                    if (t.includes('FEDRAMP') && t.includes('HIGH')) return 'FEDRAMP_HIGH';
                    if ((t.includes('CSA') || t.includes('CCM')) && t.includes('V4')) return 'CCMV4';
                    if (t.includes('CYBER') && t.includes('ESSENTIAL')) return 'CYBERESSENTIALS';
                    if (t.includes('HITRUST')) return 'HITRUST';
                    return null;
                };

                // Fetch frameworks from the database
                const frameworks = await dbConn
                    .select()
                    .from(schema.complianceFrameworks)
                    .orderBy(asc(schema.complianceFrameworks.name));

                // Fetch counts for each framework
                // We use parallel queries for efficiency since this is only called during onboarding

                const dbItems = await Promise.all(frameworks.map(async (fw: any) => {
                    const controlCount = await dbConn
                        .select({ count: sql<number>`count(*)` })
                        .from(schema.controls)
                        .where(
                            or(
                                ilike(schema.controls.framework, `%${fw.name}%`),
                                sql`${fw.name} ILIKE '%' || ${schema.controls.framework} || '%'`,
                                sql`REPLACE(REPLACE(${schema.controls.framework}, ' ', ''), '-', '') ILIKE '%' || REPLACE(REPLACE(${fw.shortCode}, ' ', ''), '-', '') || '%'`,
                                sql`REPLACE(REPLACE(${schema.controls.framework}, ' ', ''), '-', '') ILIKE '%' || REPLACE(REPLACE(${fw.name}, ' ', ''), '-', '') || '%'`
                            )
                        );


                    return {
                        id: fw.id,
                        name: fw.name,
                        shortCode: fw.shortCode,
                        version: fw.version,
                        description: fw.description,
                        type: fw.type,
                        createdAt: fw.createdAt,
                        updatedAt: fw.updatedAt,
                        controlCount: Number(controlCount[0]?.count || 0)
                    };
                }));

                const curated = dbItems
                    .map((r: any) => {
                        const code = resolveShortCode(r.shortCode || r.name);
                        return code && allowedCodes.has(code)
                            ? { ...r, shortCode: code, name: canonicalNameByCode[code] || r.name }
                            : null;
                    })
                    .filter(Boolean) as any[];

                const existingShortCodes = new Set(curated.map((r: any) => String(r.shortCode)));
                const controlFrameworks = await dbConn.select({
                    framework: schema.controls.framework,
                    count: sql<number>`count(*)`
                }).from(schema.controls).groupBy(schema.controls.framework);

                for (const cf of controlFrameworks) {
                    const name = String(cf.framework || '').trim();
                    if (!name) continue;
                    const code = resolveShortCode(name);
                    if (!code || !allowedCodes.has(code) || existingShortCodes.has(code)) continue;
                    curated.push({
                        id: `derived-${code}`,
                        name: canonicalNameByCode[code] || name,
                        shortCode: code,
                        version: null,
                        description: null,
                        type: 'framework',
                        createdAt: null,
                        updatedAt: null,
                        controlCount: Number(cf.count || 0)
                    });
                    existingShortCodes.add(code);
                }

                for (const code of Array.from(allowedCodes)) {
                    if (!existingShortCodes.has(code)) {
                        curated.push({
                            id: `default-${code}`,
                            name: canonicalNameByCode[code] || code,
                            shortCode: code,
                            version: null,
                            description: null,
                            type: 'framework',
                            createdAt: null,
                            updatedAt: null,
                            controlCount: 0
                        });
                        existingShortCodes.add(code);
                    }
                }

                curated.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
                return curated;
            })
    });
};
