import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { llmService } from "../../lib/llm/service";
// @ts-ignore
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";

// ── Helper: find the best matching column header ────────────────────
const TITLE_ALIASES = ['control id', 'control_id', 'controlid', 'control number', 'control name',
    'requirement id', 'req id', 'title', 'control', 'identifier', 'id', 'name',
    'ref', 'reference', 'section', 'number'];
const DESC_ALIASES = ['description', 'requirement', 'control description', 'requirement text',
    'control text', 'statement', 'objective', 'guidance', 'text', 'detail', 'details',
    'summary', 'content', 'supplemental guidance'];

function findBestColumn(headers: string[], aliases: string[]): string | null {
    const clean = (s: string) => s.toLowerCase().replace(/[\n\r]+/g, ' ').trim();
    // Exact match first
    for (const alias of aliases) {
        const match = headers.find(h => clean(h) === alias);
        if (match) return match;
    }
    // Contains match (but require alias to be a substantial part of the header - at least 3 chars)
    for (const alias of aliases) {
        if (alias.length < 3) continue; // skip short aliases like 'id' for partial matching
        const match = headers.find(h => clean(h).includes(alias));
        if (match) return match;
    }
    return null;
}

// ── Helper: extract requirements directly from spreadsheet ──────────
function extractFromSpreadsheet(buffer: Buffer): { requirements: any[]; method: string } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log(`[StudioRouter] Workbook sheets: [${workbook.SheetNames.join(', ')}]`);

    let bestResult: { requirements: any[]; method: string } = { requirements: [], method: 'none' };
    let bestSheetName = '';

    // Try all sheets and pick the best result
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rawRows.length < 2) continue;

        console.log(`[StudioRouter] Sheet "${sheetName}": ${rawRows.length} raw rows`);

        const result = tryExtractFromRows(rawRows);
        if (result.requirements.length > bestResult.requirements.length) {
            bestResult = result;
            bestSheetName = sheetName;
        }
    }

    if (bestResult.requirements.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Could not extract any requirements from the spreadsheet." });
    }

    // ── BRUTE FORCE FALLBACK ──
    // If we have many raw rows but few extracted requirements, assume the smart detection failed.
    // In this case, just read the sheet row-by-row, assuming Col 1 = Title, Col 2 = Description.
    const rawRowsForSanity: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[bestSheetName], { header: 1, defval: '' });
    const extractionRatio = bestResult.requirements.length / Math.max(1, rawRowsForSanity.length);

    // Trigger brute force if we got < 10 items AND that's less than 10% of the total rows (and total rows > 20)
    // Or if we got < 3 items but have > 10 rows.
    const shouldBruteForce = (rawRowsForSanity.length > 20 && extractionRatio < 0.1) || (rawRowsForSanity.length > 10 && bestResult.requirements.length < 3);

    if (shouldBruteForce) {
        console.log(`[StudioRouter] Smart extraction yielded poor results (${bestResult.requirements.length}/${rawRowsForSanity.length}). Switching to brute force.`);
        
        const bruteForceReqs = rawRowsForSanity
            .map((row, idx) => {
                // Skip likely header rows (first 3 rows that contain "title" or "description")
                if (idx < 3) {
                    const rowStr = row.join(' ').toLowerCase();
                    if (rowStr.includes('title') || rowStr.includes('description') || rowStr.includes('control')) return null;
                }

                // Find first two non-empty cells
                const cells = row.filter((c: any) => String(c).trim().length > 0);
                if (cells.length === 0) return null;

                let title = '';
                let description = '';

                if (cells.length === 1) {
                    // Only one cell? Treat as description, generate ID
                    description = String(cells[0]).trim();
                    title = `REQ-${idx + 1}`;
                } else {
                    // First cell is title, second is description (regardless of column position)
                    title = String(cells[0]).trim();
                    description = String(cells[1]).trim();
                }

                return { title, description };
            })
            .filter(r => r !== null && (r.title.length > 0 || r.description.length > 0));

        if (bruteForceReqs.length > bestResult.requirements.length) {
            console.log(`[StudioRouter] Brute force found ${bruteForceReqs.length} items. Using these instead.`);
            bestResult = { requirements: bruteForceReqs, method: 'brute_force' };
        }
    }

    console.log(`[StudioRouter] Best sheet: "${bestSheetName}" with ${bestResult.requirements.length} requirements (${bestResult.method})`);
    return bestResult;
}

function tryExtractFromRows(rawRows: any[][]): { requirements: any[]; method: string } {
    // Strategy: try each of the first 30 rows as a potential header row.
    // For each candidate, count how many subsequent rows have at least 1 non-empty cell.
    // Pick the header row that yields the most populated data rows.

    let bestHeaderIdx = 0;
    let bestPopulatedCount = 0;

    const scanLimit = Math.min(30, rawRows.length - 1);
    for (let h = 0; h < scanLimit; h++) {
        const headerRow = rawRows[h];
        const colCount = headerRow.length;

        // Skip rows that look empty
        const nonEmptyCols = headerRow.filter((c: any) => String(c || '').trim().length > 0).length;
        if (nonEmptyCols < 2) continue;

        // Count how many rows AFTER this header have at least 2 non-empty cells
        let populated = 0;
        const dataLimit = Math.min(rawRows.length, h + 500); // check up to 500 data rows
        for (let d = h + 1; d < dataLimit; d++) {
            const row = rawRows[d];
            let nonEmpty = 0;
            for (let c = 0; c < Math.min(colCount, row.length); c++) {
                if (String(row[c] || '').trim().length > 0) {
                    nonEmpty++;
                    if (nonEmpty >= 2) break;
                }
            }
            if (nonEmpty >= 2) populated++;
        }

        if (populated > bestPopulatedCount) {
            bestPopulatedCount = populated;
            bestHeaderIdx = h;
        }
    }

    console.log(`[StudioRouter] Best header row index: ${bestHeaderIdx} (${bestPopulatedCount} populated data rows)`);

    // Build headers from the winning row
    const headerRow = rawRows[bestHeaderIdx];
    const headers: string[] = headerRow.map((cell: any, idx: number) => {
        const val = String(cell || '').replace(/[\n\r]+/g, ' ').trim();
        return val || `_col_${idx}`;
    });

    const visibleHeaders = headers.filter(h => !h.startsWith('_col_'));
    console.log(`[StudioRouter] Headers (${visibleHeaders.length} named): [${visibleHeaders.slice(0, 10).join(', ')}${visibleHeaders.length > 10 ? '...' : ''}]`);

    // Build data rows
    const dataRows = rawRows.slice(bestHeaderIdx + 1);
    const rows: Record<string, any>[] = dataRows.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header, idx) => {
            obj[header] = idx < row.length ? row[idx] : '';
        });
        return obj;
    });

    // Log first 3 data rows to understand structure
    console.log(`[StudioRouter] === Sample Data Rows (first 3) ===`);
    for (let i = 0; i < Math.min(3, rows.length); i++) {
        const row = rows[i];
        const nonEmpty = Object.entries(row)
            .filter(([k, v]) => String(v).trim().length > 0 && !k.startsWith('_col_'))
            .map(([k, v]) => `"${k}": "${String(v).substring(0, 60)}"`);
        console.log(`Row ${i}: { ${nonEmpty.slice(0, 8).join(', ')}${nonEmpty.length > 8 ? ', ...' : ''} }`);
    }

    // Try alias-based column detection
    const titleCol = findBestColumn(headers, TITLE_ALIASES);
    const descCol = findBestColumn(headers, DESC_ALIASES);

    console.log(`[StudioRouter] Title col: "${titleCol}", Desc col: "${descCol}"`);

    if (titleCol || descCol) {
        const requirements = rows
            .map(row => {
                const title = titleCol ? String(row[titleCol] || '').trim() : '';
                const desc = descCol ? String(row[descCol] || '').trim() : '';
                return { title, description: desc };
            })
            .filter(r => r.title.length > 0 || r.description.length > 0);

        // Sanity check: if we have 100+ data rows but only extracted < 10 requirements,
        // the column detection probably failed (e.g., picked a metadata column)
        if (rows.length > 100 && requirements.length < 10) {
            const uniqueTitles = new Set(requirements.map(r => r.title)).size;
            console.log(`[StudioRouter] WARNING: Only ${requirements.length} requirements from ${rows.length} rows (${uniqueTitles} unique titles). Trying fallback.`);
            // Don't return yet, fall through to fallback
        } else {
            return { requirements, method: 'direct_parse' };
        }
    }

    // Fallback: use first two non-trivial columns
    const usableHeaders = headers.filter(h => !h.startsWith('_col_'));
    const col1 = usableHeaders[0] || headers[0];
    const col2 = usableHeaders.length > 1 ? usableHeaders[1] : headers[1];
    console.log(`[StudioRouter] Fallback columns: "${col1}", "${col2}"`);

    const requirements = rows
        .map(row => ({
            title: String(row[col1] || '').trim(),
            description: col2 ? String(row[col2] || '').trim() : '',
        }))
        .filter(r => r.title.length > 0 || r.description.length > 0);

    return { requirements, method: 'direct_parse_fallback' };
}

// ── AI extraction with chunking for large texts ─────────────────────
const CHUNK_SIZE = 15000; // Increased back to ~4k tokens, as we are now using a more efficient format
const MAX_AI_TOKENS = 4096; // Standard safe output limit

const extractAIRequirements = async (text: string) => {
    const systemPrompt = `You are a compliance expert. Extract a list of distinct requirements or controls from the provided text.

OUTPUT FORMAT:
For each requirement, output a block exactly like this:

===REQ===
Title: [Short ID or Title]
Description: [Full text of the requirement]
===END===

Do not output JSON. Do not output markdown lists. Just the blocks.
Extract EVERY single requirement.`;

    // For large texts, split into chunks and merge results
    const chunks: string[] = [];
    if (text.length > CHUNK_SIZE) {
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            chunks.push(text.substring(i, i + CHUNK_SIZE));
        }
        console.log(`[StudioRouter] Text too large (${text.length} chars), splitting into ${chunks.length} chunks`);
    } else {
        chunks.push(text);
    }

    let allRequirements: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
        console.log(`[StudioRouter] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);

        const response = await llmService.generate({
            systemPrompt,
            userPrompt: chunks[i],
            jsonMode: false, // Changed to false for custom format
            feature: 'framework_studio',
            maxTokens: MAX_AI_TOKENS,
        });

        // Parse custom format
        const rawText = response.text;
        const reqBlocks = rawText.split('===REQ===');
        
        for (const block of reqBlocks) {
            if (!block.trim()) continue;
            
            const titleMatch = block.match(/Title:\s*(.*?)(?:\n|$)/);
            const descMatch = block.match(/Description:\s*([\s\S]*?)(?:===END===|$)/);
            
            if (titleMatch || descMatch) {
                const title = titleMatch ? titleMatch[1].trim() : '';
                let description = descMatch ? descMatch[1].trim() : '';
                
                // Cleanup description if it captured ===END===
                description = description.replace('===END===', '').trim();
                
                if (title || description) {
                    allRequirements.push({ title, description });
                }
            }
        }
    }

    return allRequirements;
};

export const createStudioRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        extractRequirements: protectedProcedure
            .input(z.object({
                text: z.string().min(10),
            }))
            .mutation(async ({ input }: any) => {
                try {
                    console.log("[StudioRouter] extractRequirements started");
                    const requirements = await extractAIRequirements(input.text);
                    console.log("[StudioRouter] extractRequirements finished:", requirements.length);
                    return { requirements };
                } catch (error: any) {
                    console.error("AI Extraction failed:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `AI Extraction failed: ${error.message}`
                    });
                }
            }),

        extractFromFile: protectedProcedure
            .input(z.object({
                fileData: z.string(), // Base64 encoded
                fileName: z.string(),
                fileType: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                try {
                    console.log(`[StudioRouter] extractFromFile started: ${input.fileName} (${input.fileType})`);
                    const buffer = Buffer.from(input.fileData, 'base64');

                    console.log(`[StudioRouter] Buffer size: ${buffer.length} bytes`);

                    // ── Spreadsheet files: parse directly, no AI needed ──
                    const isSpreadsheet =
                        input.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                        input.fileType === "application/vnd.ms-excel" ||
                        input.fileType === "text/csv" ||
                        input.fileName.endsWith(".xlsx") ||
                        input.fileName.endsWith(".xls") ||
                        input.fileName.endsWith(".csv");

                    if (isSpreadsheet) {
                        console.log("[StudioRouter] Spreadsheet detected — using direct parse (no AI)");
                        const { requirements, method } = extractFromSpreadsheet(buffer);
                        console.log(`[StudioRouter] Direct parse complete: ${requirements.length} requirements (method: ${method})`);
                        return { requirements };
                    }

                    // ── Non-spreadsheet files: extract text then use AI ──
                    let extractedText = "";

                    if (input.fileType === "application/pdf" || input.fileName.endsWith(".pdf")) {
                        console.log("[StudioRouter] Parsing PDF...");
                        const parser = new PDFParse({ data: buffer });
                        const data = await parser.getText();
                        extractedText = data.text;
                        console.log("[StudioRouter] PDF Parsing complete.");
                    }
                    else if (input.fileType.startsWith("text/") || input.fileName.endsWith(".txt") || input.fileName.endsWith(".md")) {
                        extractedText = buffer.toString('utf-8');
                    }
                    else {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Unsupported file type. Please upload a PDF, Excel, CSV, or Text file."
                        });
                    }

                    if (!extractedText || extractedText.trim().length < 10) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Could not extract sufficient text from the file."
                        });
                    }

                    console.log(`[StudioRouter] Extracted text length: ${extractedText.length}. Calling AI...`);
                    const requirements = await extractAIRequirements(extractedText);
                    console.log("[StudioRouter] AI Extraction finished:", requirements.length);
                    return { requirements };

                } catch (error: any) {
                    console.error("File AI Extraction failed:", error);
                    if (error instanceof TRPCError) throw error;

                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `File AI Extraction failed: ${error.message}`
                    });
                }
            }),
    });
};

