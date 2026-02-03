import { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from "docx";

// Helper to ensure we always have a string
const safeString = (input: any): string => {
    if (input === null || input === undefined) return "";
    return String(input);
};

export function parseMarkdownToDocx(rawText: any): (Paragraph | Table)[] {
    let text = safeString(rawText);
    if (!text) return [];

    // Normalize newlines
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix: Force newlines before headers if they are stuck inline
    text = text.replace(/([^\n])\s*(#{1,6}\s)/g, '$1\n$2');

    // Fix: Force newlines before list items if stuck inline
    text = text.replace(/([^\n])\s*(\* \*\*)/g, '$1\n$2');
    text = text.replace(/([^\n])\s*(\*\s)/g, '$1\n$2');

    const lines = text.split('\n');

    // Intermediate Nodes
    type Node =
        | { type: 'header', level: number, content: string }
        | { type: 'paragraph', content: string, bold?: boolean }
        | { type: 'bullet', content: string }
        | { type: 'table', rows: string[][] };

    let nodes: Node[] = [];
    let tableBuffer: string[] = [];

    // Helper to flush table buffer
    const flushTable = () => {
        if (tableBuffer.length > 0) {
            const cleanedRows = tableBuffer
                .filter(row => !row.match(/^\s*\|?\s*:?-+:?\s*\|/))
                .map(row => {
                    const cells = row.split('|');
                    if (row.trim().startsWith('|') && cells.length > 0 && cells[0].trim() === '') cells.shift();
                    if (row.trim().endsWith('|') && cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
                    return cells.map(c => c.trim());
                });

            if (cleanedRows.length > 0) {
                // Normalize column count to ensure all rows have equal cells (fixes missing borders)
                const maxCols = Math.max(...cleanedRows.map(r => r.length));
                cleanedRows.forEach(row => {
                    while (row.length < maxCols) {
                        row.push("");
                    }
                });

                nodes.push({ type: 'table', rows: cleanedRows });
            }
            tableBuffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // TABLE DETECTION (Enhanced)
        // Check for standard pipe line OR bulleted pipe line
        const isTableLine = /^\s*\|/.test(line) || /^\s*[\*\-]\s*\|/.test(line);

        if (isTableLine) {
            // Clean leading bullet if present
            const cleanLine = line.replace(/^\s*[\*\-]\s*/, '');
            tableBuffer.push(cleanLine);
            continue;
        } else if (tableBuffer.length > 0) {
            flushTable();
        }

        if (!line) continue;
        if (line.match(/^[\*\-]\s*$/)) continue;

        // Headers
        if (line.match(/^#{1,6}\s/)) {
            const match = line.match(/^(#{1,6})\s/);
            const level = match ? match[1].length : 3;
            nodes.push({ type: 'header', level, content: line.replace(/^#{1,6}\s/, '') });
            continue;
        }

        // List Items
        if (line.startsWith('* ') || line.startsWith('- ')) {
            nodes.push({ type: 'bullet', content: line.substring(2) });
            continue;
        } else if (line.match(/^\d+\.\s/)) {
            nodes.push({ type: 'bullet', content: line.replace(/^\d+\.\s/, '') });
            continue;
        }

        // Paragraph
        nodes.push({ type: 'paragraph', content: line });
    }
    // Flush table if end of file
    flushTable();


    // 2. Post-Process Nodes (Logic Adjustments & Label Detection)
    const finalNodes: Node[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const curr = nodes[i];

        // Bullet Header Conversion Logic
        if (curr.type === 'bullet') {
            const cleanText = curr.content.trim();

            // Check for various forms of "Label:"
            // - Ends with :
            // - Ends with :**
            // - Ends with :*
            const endsWithColon = cleanText.endsWith(':') || cleanText.endsWith(':**') || cleanText.endsWith(':*');
            const hasColon = cleanText.includes(':');
            const isShort = cleanText.length < 100;

            if (isShort && (endsWithColon || (hasColon && cleanText.startsWith('**')))) {
                // It's a header label!
                // Clean ALL asterisks to be safe
                const coreText = cleanText.replace(/\*/g, '').trim();

                finalNodes.push({ type: 'paragraph', content: coreText, bold: true });
            } else {
                finalNodes.push(curr);
            }
        } else {
            finalNodes.push(curr);
        }
    }

    // 3. Render to Docx
    const docChildren: (Paragraph | Table)[] = [];

    for (const node of finalNodes) {
        if (node.type === 'header') {
            docChildren.push(new Paragraph({
                children: parseInlineStyles(node.content),
                heading: node.level === 1 ? HeadingLevel.HEADING_1 :
                    node.level === 2 ? HeadingLevel.HEADING_2 :
                        HeadingLevel.HEADING_3,
                spacing: { before: node.level === 1 ? 200 : 150, after: 100 },
            }));
        } else if (node.type === 'table') {
            docChildren.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: node.rows.map((row, rIdx) =>
                        new TableRow({
                            children: row.map((cellText, cIdx) =>
                                new TableCell({
                                    children: [new Paragraph({
                                        children: parseInlineStyles(cellText),
                                        style: rIdx === 0 ? "TableHeader" : "TableCell"
                                    })],
                                    shading: rIdx === 0 ? { fill: "1C4D8D", color: "auto", val: ShadingType.CLEAR } : rIdx % 2 === 0 ? { fill: "F2F2F2", color: "auto", val: ShadingType.CLEAR } : undefined,
                                    width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                                    }
                                })
                            )
                        })
                    )
                })
            );
            docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));

        } else if (node.type === 'bullet') {
            const parts = node.content.split('\n');
            const children: any[] = [];
            parts.forEach((part, idx) => {
                if (idx > 0) children.push(new TextRun({ text: "\n" }));
                children.push(...parseInlineStyles(part));
            });

            docChildren.push(new Paragraph({
                children: children,
                bullet: { level: 0 },
                spacing: { after: 120 }
            }));
        } else if (node.type === 'paragraph') {
            // Check for bold flag
            const children = parseInlineStyles(node.content, node.bold);

            docChildren.push(new Paragraph({
                children: children,
                spacing: { after: 120 }
            }));
        }
    }

    return docChildren;
}

function parseInlineStyles(text: string, forceBold: boolean = false): TextRun[] {
    const runs: TextRun[] = [];

    // Split logic
    const parts = text.split(/(\*\*.*?\*\*|\*\*.*?\*)/g);

    for (const part of parts) {
        if (part.startsWith('**') && (part.endsWith('**') || part.endsWith('*')) && part.length > 3) {
            let cleanText = part.substring(2);
            if (cleanText.endsWith('**')) {
                cleanText = cleanText.substring(0, cleanText.length - 2);
            } else if (cleanText.endsWith('*')) {
                cleanText = cleanText.substring(0, cleanText.length - 1);
            }

            runs.push(new TextRun({
                text: cleanText,
                bold: true // Already bold from Markdown
            }));
        } else {
            const subParts = part.split(/(\*.*?\*)/g);
            for (const sp of subParts) {
                if (sp.startsWith('*') && sp.endsWith('*') && sp.length > 2 && !sp.includes('**')) {
                    runs.push(new TextRun({
                        text: sp.substring(1, sp.length - 1),
                        italics: true,
                        bold: forceBold ? true : undefined
                    }));
                } else if (sp) {
                    runs.push(new TextRun({
                        text: sp,
                        bold: forceBold ? true : undefined
                    }));
                }
            }
        }
    }
    return runs;
}
