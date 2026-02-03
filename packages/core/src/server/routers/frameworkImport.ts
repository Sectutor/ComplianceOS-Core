
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { TRPCError } from '@trpc/server';
import { getDb } from '../../db'; // Assuming relative path from server/routers/frameworkImport.ts
import * as schema from '../../schema';
import { eq, sql } from 'drizzle-orm';

// Helper to find sheet by fuzzy name match
const findSheet = (workbook: XLSX.WorkBook, keywords: string[]): XLSX.WorkSheet | null => {
    const sheetName = workbook.SheetNames.find(name =>
        keywords.some(k => name.toLowerCase().includes(k.toLowerCase()))
    );
    return sheetName ? workbook.Sheets[sheetName] : null;
};

// Helper to find header row by looking for key columns
const findHeaderRow = (sheet: XLSX.WorkSheet, keyColumns: string[], maxSearchRows = 20): { row: number, data: any[] } | null => {
    // Convert first N rows to array of arrays to inspect
    const range = XLSX.utils.decode_range(sheet['!ref'] || "A1:Z100");
    range.e.r = Math.min(range.e.r, maxSearchRows); // Limit search

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: range, defval: '' }) as any[][];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].map(c => String(c).trim());
        // Check if all key columns are present in this row (fuzzy match)
        const allFound = keyColumns.every(key =>
            row.some(cell => cell.toLowerCase() === key.toLowerCase() || cell.toLowerCase().includes(key.toLowerCase()))
        );
        if (allFound) {
            return { row: i, data: rows[i] };
        }
    }
    return null;
};

export const createFrameworkImportRouter = (t: any, clientProcedure: any) => {
    return t.router({
        importFramework: clientProcedure
            .input(z.object({
                clientId: z.number(),
                fileContent: z.string(), // Base64 encoded
                type: z.enum(['cis_v8', 'ccm_v4'])
            }))
            .mutation(async ({ input }: any) => {
                console.log(`[FrameworkImport] Starting import for type: ${input.type}`);
                try {
                    const db = await getDb();

                    // Decode file
                    const buffer = Buffer.from(input.fileContent, 'base64');
                    console.log(`[FrameworkImport] File decoded, size: ${buffer.length}`);

                    const workbook = XLSX.read(buffer, { type: 'buffer' });
                    console.log(`[FrameworkImport] Workbook read. Sheets: ${workbook.SheetNames.join(', ')}`);

                    let controlsToInsert: any[] = [];
                    let frameworkName = "";
                    let frameworkVersion = "";

                    if (input.type === 'cis_v8') {
                        // Fuzzy match sheet name
                        const sheet = findSheet(workbook, ['control', 'v8', 'cis']);
                        if (!sheet) throw new TRPCError({ code: 'BAD_REQUEST', message: `Could not find a 'Controls' sheet in the uploaded file. Available: ${workbook.SheetNames.join(', ')}` });

                        // Find header row containing specific columns
                        const headerInfo = findHeaderRow(sheet, ['CIS Safeguard', 'Title', 'Description', 'Security Function']);
                        if (!headerInfo) {
                            console.error("[FrameworkImport] Header search failed for CIS.");
                            throw new TRPCError({ code: 'BAD_REQUEST', message: `Could not find table headers (CIS Safeguard, Title) in the first 20 rows.` });
                        }
                        console.log(`[FrameworkImport] CIS Headers found at row ${headerInfo.row}`);

                        // Parse data using the found header row
                        // We need to properly map the messy headers to our keys if they aren't exact, 
                        // but for now let's assume if we found the row, sheet_to_json will use those values as keys.
                        // using 'range' starting at the header row
                        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: headerInfo.row });

                        frameworkName = "CIS Critical Security Controls";
                        frameworkVersion = "8.1"; // Could parse from metadata if needed, but 8.1 is target

                        controlsToInsert = rows.map((row) => {
                            // Clean keys: sometimes there are surrounding spaces or slight variations if we rely on sheet_to_json keys
                            // Improved: normalize keys? For now, standard sheet_to_json with our identified row should work well 
                            // IF the user hasn't renamed "CIS Safeguard" to "ID". 
                            // Since we verified the presence of "CIS Safeguard" in findHeaderRow, we can rely on it being a key.

                            return {
                                controlCode: row['CIS Safeguard']?.toString(),
                                title: row['Title'],
                                description: row['Description'],
                                grouping: `${row['CIS Control'] || ''} - ${row['Security Function'] || ''}`,
                                originalData: {
                                    assetType: row['Asset Type'],
                                    securityFunction: row['Security Function'],
                                    cisControl: row['CIS Control']
                                }
                            };
                        }).filter(c => c.controlCode && c.title);

                    } else if (input.type === 'ccm_v4') {
                        const sheet = findSheet(workbook, ['ccm', 'cloud control', 'matrix']);
                        if (!sheet) throw new TRPCError({ code: 'BAD_REQUEST', message: `Could not find a 'CCM' sheet in the uploaded file. Available: ${workbook.SheetNames.join(', ')}` });

                        const headerInfo = findHeaderRow(sheet, ['Control ID', 'Control Title', 'Control Specification', 'Control Domain']);
                        if (!headerInfo) {
                            console.error("[FrameworkImport] Header search failed for CCM.");
                            throw new TRPCError({ code: 'BAD_REQUEST', message: `Could not find table headers (Control ID, Control Title) in the first 20 rows.` });
                        }
                        console.log(`[FrameworkImport] CCM Headers found at row ${headerInfo.row}`);

                        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: headerInfo.row });

                        frameworkName = "Cloud Controls Matrix";
                        frameworkVersion = "4.0.7";

                        controlsToInsert = rows.map((row) => ({
                            controlCode: row['Control ID']?.toString(),
                            title: row['Control Title'],
                            description: row['Control Specification'],
                            grouping: row['Control Domain'],
                            originalData: {
                                controlDomain: row['Control Domain']
                            }
                        })).filter(c => c.controlCode && c.title);
                    }

                    if (controlsToInsert.length === 0) {
                        console.warn("[FrameworkImport] No controls found after parsing.");
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid controls found in file' });
                    }

                    console.log(`[FrameworkImport] Found ${controlsToInsert.length} controls to insert.`);

                    // 1. Create Framework Record
                    const [framework] = await db.insert(schema.clientFrameworks).values({
                        clientId: input.clientId,
                        name: frameworkName,
                        version: frameworkVersion,
                        sourceFileName: input.type === 'cis_v8' ? 'cis_controls_v8.xlsx' : 'ccm_v4.xlsx', // Simplified
                        status: 'active'
                    }).returning();
                    console.log(`[FrameworkImport] Framework record created: ${framework.id}`);

                    // 2. Bulk Insert Controls
                    const controlsWithFrameworkId = controlsToInsert.map(c => ({
                        ...c,
                        frameworkId: framework.id
                    }));

                    await db.insert(schema.clientFrameworkControls).values(controlsWithFrameworkId);
                    console.log(`[FrameworkImport] Bulk insert complete.`);

                    return { success: true, count: controlsToInsert.length, frameworkId: framework.id };

                } catch (error: any) {
                    console.error("[FrameworkImport] CRITICAL ERROR:", error);
                    if (error instanceof TRPCError) throw error;

                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Import failed: ${error.message || 'Unknown server error'}`,
                        cause: error
                    });
                }
            }),

        // Custom Framework Import (Premium Feature)
        importCustomFramework: clientProcedure
            .input(z.object({
                clientId: z.number(),
                frameworkName: z.string().min(1),
                frameworkVersion: z.string().optional().default("1.0"),
                // New format: Record<ExcelColumnName, DBFieldName>
                columnMappings: z.record(z.string(), z.string()),
                fileContent: z.string(), // Base64 encoded
                sheetName: z.string().optional(),
                headerRow: z.number().optional().default(1)
            }))
            .mutation(async ({ input }: any) => {
                console.log(`[FrameworkImport] Custom import for: ${input.frameworkName}`);
                console.log(`[FrameworkImport] Sheet: ${input.sheetName}, Header Row: ${input.headerRow}`);
                console.log(`[FrameworkImport] Column mappings:`, input.columnMappings);
                try {
                    const db = await getDb();

                    // Decode file
                    const buffer = Buffer.from(input.fileContent, 'base64');
                    const workbook = XLSX.read(buffer, { type: 'buffer' });

                    // Get the specified sheet or default to first
                    const sheetName = input.sheetName || workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];

                    if (!sheet) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: `Sheet "${sheetName}" not found` });
                    }

                    // Get headers from specified row
                    const headerRowIndex = (input.headerRow || 1) - 1;
                    const sheetRef = sheet['!ref'];

                    if (!sheetRef) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sheet appears to be empty' });
                    }

                    const range = XLSX.utils.decode_range(sheetRef);
                    const headers: string[] = [];

                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
                        const cell = sheet[cellAddress];
                        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                            headers.push(String(cell.v));
                        } else {
                            headers.push(`Column${col + 1}`);
                        }
                    }

                    // Parse data with headers starting from header row
                    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
                        header: headers,
                        range: headerRowIndex
                    });

                    // Skip header row itself
                    const dataRows = rows.slice(1);

                    if (dataRows.length === 0) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No data found in file' });
                    }

                    // Build reverse mapping: DB field -> Excel column
                    const fieldToExcelCol: Record<string, string> = {};
                    for (const [excelCol, dbField] of Object.entries(input.columnMappings)) {
                        if (dbField && dbField !== "__SKIP__") {
                            fieldToExcelCol[dbField as string] = excelCol;
                        }
                    }

                    // Validate required fields are mapped
                    if (!fieldToExcelCol.controlCode || !fieldToExcelCol.title) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Control Code and Title must be mapped' });
                    }

                    const controlsToInsert = dataRows.map((row) => {
                        const control: any = {
                            controlCode: row[fieldToExcelCol.controlCode]?.toString() || "",
                            title: row[fieldToExcelCol.title]?.toString() || "",
                            originalData: row
                        };

                        // Map optional fields
                        if (fieldToExcelCol.description) {
                            control.description = row[fieldToExcelCol.description]?.toString() || "";
                        }
                        if (fieldToExcelCol.grouping) {
                            control.grouping = row[fieldToExcelCol.grouping]?.toString() || "";
                        }
                        if (fieldToExcelCol.owner) {
                            control.owner = row[fieldToExcelCol.owner]?.toString() || "";
                        }
                        if (fieldToExcelCol.status) {
                            control.status = row[fieldToExcelCol.status]?.toString() || "not_implemented";
                        }
                        if (fieldToExcelCol.implementationNotes) {
                            control.implementationNotes = row[fieldToExcelCol.implementationNotes]?.toString() || "";
                        }
                        if (fieldToExcelCol.evidenceLocation) {
                            control.evidenceLocation = row[fieldToExcelCol.evidenceLocation]?.toString() || "";
                        }
                        if (fieldToExcelCol.justification) {
                            control.justification = row[fieldToExcelCol.justification]?.toString() || "";
                        }

                        return control;
                    }).filter(c => c.controlCode && c.title);

                    if (controlsToInsert.length === 0) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid controls found after mapping' });
                    }

                    console.log(`[FrameworkImport] Found ${controlsToInsert.length} controls to insert.`);

                    // Create Framework Record
                    const [framework] = await db.insert(schema.clientFrameworks).values({
                        clientId: input.clientId,
                        name: input.frameworkName,
                        version: input.frameworkVersion,
                        sourceFileName: 'custom_import.xlsx',
                        status: 'active'
                    }).returning();

                    // Bulk Insert Controls
                    const controlsWithFrameworkId = controlsToInsert.map(c => ({
                        ...c,
                        frameworkId: framework.id
                    }));

                    await db.insert(schema.clientFrameworkControls).values(controlsWithFrameworkId);
                    console.log(`[FrameworkImport] Custom import complete for framework ${framework.id}`);

                    return { success: true, count: controlsToInsert.length, frameworkId: framework.id };
                } catch (error: any) {
                    console.error("[FrameworkImport] Custom import error:", error);
                    if (error instanceof TRPCError) throw error;
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Import failed: ${error.message || 'Unknown error'}`,
                        cause: error
                    });
                }
            }),

        listFrameworks: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Get frameworks with control counts
                const frameworks = await db.select({
                    id: schema.clientFrameworks.id,
                    clientId: schema.clientFrameworks.clientId,
                    name: schema.clientFrameworks.name,
                    version: schema.clientFrameworks.version,
                    sourceFileName: schema.clientFrameworks.sourceFileName,
                    importedAt: schema.clientFrameworks.importedAt,
                    status: schema.clientFrameworks.status,
                    controlCount: sql<number>`count(${schema.clientFrameworkControls.id})`
                })
                    .from(schema.clientFrameworks)
                    .leftJoin(schema.clientFrameworkControls, eq(schema.clientFrameworks.id, schema.clientFrameworkControls.frameworkId))
                    .where(eq(schema.clientFrameworks.clientId, input.clientId))
                    .groupBy(schema.clientFrameworks.id);

                return frameworks;
            }),

        getFramework: clientProcedure
            .input(z.object({ frameworkId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [framework] = await db.select().from(schema.clientFrameworks)
                    .where(eq(schema.clientFrameworks.id, input.frameworkId));
                return framework || null;
            }),

        getDashboardStats: clientProcedure
            .input(z.object({ frameworkId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                const controls = await db.select({
                    status: schema.clientFrameworkControls.status
                })
                    .from(schema.clientFrameworkControls)
                    .where(eq(schema.clientFrameworkControls.frameworkId, input.frameworkId));

                const total = controls.length;
                const statusCounts = controls.reduce((acc: Record<string, number>, curr: { status: string | null }) => {
                    const s = curr.status || 'not_implemented';
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                // Calculate generic compliance score (Implemented / Total Applicable)
                // Excluding 'not_applicable' from denominator if desired, but standards vary.
                // For simplicity: (Implemented / Total) * 100 for now, or just return raw counts.
                // Let's return raw counts and let frontend visualize.

                return {
                    total,
                    implemented: statusCounts['implemented'] || 0,
                    inProgress: statusCounts['in_progress'] || 0,
                    notImplemented: statusCounts['not_implemented'] || 0,
                    notApplicable: statusCounts['not_applicable'] || 0,
                    score: total > 0 ? Math.round(((statusCounts['implemented'] || 0) / total) * 100) : 0
                };
            }),

        getFrameworkControls: clientProcedure
            .input(z.object({
                frameworkId: z.number(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.number().nullish(), // Use cursor-based pagination or offset? Let's stick to simple offset for table
                page: z.number().min(1).default(1)
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const limit = input.limit;
                const offset = (input.page - 1) * limit;

                // Get total count
                const [countResult] = await db.select({ count: sql<number>`count(*)` })
                    .from(schema.clientFrameworkControls)
                    .where(eq(schema.clientFrameworkControls.frameworkId, input.frameworkId));

                const total = Number(countResult.count);

                // Get data
                const items = await db.select({
                    id: schema.clientFrameworkControls.id,
                    frameworkId: schema.clientFrameworkControls.frameworkId,
                    controlCode: schema.clientFrameworkControls.controlCode,
                    title: schema.clientFrameworkControls.title,
                    description: schema.clientFrameworkControls.description,
                    grouping: schema.clientFrameworkControls.grouping,
                    status: schema.clientFrameworkControls.status,
                    mappedControlCode: schema.clientControls.clientControlId // The active client control code
                })
                    .from(schema.clientFrameworkControls)
                    .leftJoin(schema.clientFrameworkMappings, eq(schema.clientFrameworkControls.id, schema.clientFrameworkMappings.frameworkControlId))
                    .leftJoin(schema.clientControls, eq(schema.clientFrameworkMappings.clientControlId, schema.clientControls.id))
                    .where(eq(schema.clientFrameworkControls.frameworkId, input.frameworkId))
                    .orderBy(schema.clientFrameworkControls.id)
                    .limit(limit)
                    .offset(offset);

                return {
                    items,
                    total,
                    page: input.page,
                    pageSize: limit,
                    totalPages: Math.ceil(total / limit)
                };
            }),

        deleteFramework: clientProcedure
            .input(z.object({ frameworkId: z.number() }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                console.log(`[FrameworkImport] Deleting framework ${input.frameworkId}`);

                // Delete controls first (cascade usually handles this in DB, but being explicit is safer if no cascade)
                await db.delete(schema.clientFrameworkControls)
                    .where(eq(schema.clientFrameworkControls.frameworkId, input.frameworkId));

                // Delete framework
                await db.delete(schema.clientFrameworks)
                    .where(eq(schema.clientFrameworks.id, input.frameworkId));

                return { success: true };
            }),

        mapControl: clientProcedure
            .input(z.object({
                frameworkControlId: z.number(),
                clientControlId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                // 1. Create Mapping
                await db.insert(schema.clientFrameworkMappings).values({
                    frameworkControlId: input.frameworkControlId,
                    clientControlId: input.clientControlId
                });

                // 2. Sync Status (One-way sync from Master -> Framework Control)
                const [clientControl] = await db.select().from(schema.clientControls)
                    .where(eq(schema.clientControls.id, input.clientControlId));

                if (clientControl && clientControl.status) {
                    const statusMap: any = {
                        'implemented': 'implemented',
                        'connected': 'implemented',
                        'not_applicable': 'not_applicable',
                        'in_progress': 'in_progress',
                        'not_implemented': 'not_implemented'
                    };
                    const targetStatus = statusMap[clientControl.status] || 'in_progress';

                    await db.update(schema.clientFrameworkControls)
                        .set({ status: targetStatus })
                        .where(eq(schema.clientFrameworkControls.id, input.frameworkControlId));
                }

                return { success: true };
            }),

        unmapControl: clientProcedure
            .input(z.object({ frameworkControlId: z.number() }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(schema.clientFrameworkMappings)
                    .where(eq(schema.clientFrameworkMappings.frameworkControlId, input.frameworkControlId));
                return { success: true };
            }),

        getMapping: clientProcedure
            .input(z.object({ frameworkControlId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [mapping] = await db.select({
                    id: schema.clientFrameworkMappings.id,
                    clientControlId: schema.clientFrameworkMappings.clientControlId,
                    controlCode: schema.clientControls.clientControlId, // The code, e.g. "AC-1"
                    customDescription: schema.clientControls.customDescription
                })
                    .from(schema.clientFrameworkMappings)
                    .innerJoin(schema.clientControls, eq(schema.clientFrameworkMappings.clientControlId, schema.clientControls.id))
                    .where(eq(schema.clientFrameworkMappings.frameworkControlId, input.frameworkControlId));

                return mapping || null;
            })
    });
};
