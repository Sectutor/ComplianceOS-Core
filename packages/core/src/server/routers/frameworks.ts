
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { controls } from "../../schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import * as db from "../../db";
import * as XLSX from 'xlsx';
import { nistAiRmfControls } from '../../data/frameworks/nist_ai_rmf';

export const createFrameworksRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        importCustom: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                type: z.enum(["pci_dss_v4", "cis_v8", "ccm_v4", "iso22301", "hitrust", "fedramp", "fedramp_low", "fedramp_high", "cyber_essentials", "nist_ai_rmf", "iso27001", "soc2", "cis_v8_system"]),
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
                }

                try {
                    if (newControls.length > 0) {
                        const d = await db.getDb();
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

                return result.rows.map((r: any) => ({
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
            })
    });
};
