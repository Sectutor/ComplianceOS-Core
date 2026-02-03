import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Header,
    Footer,
    PageNumber,
    VerticalAlign,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
    PageBreak,
    convertInchesToTwip,
} from "docx";

interface RiskExportData {
    title: string;
    executiveSummary?: string;
    introduction?: string;
    scope?: string;
    methodology?: string;
    keyFindings?: string;
    recommendations?: string;
    conclusion?: string;
    assumptions?: string;
    references?: string;
    clientName: string;
    risks?: any[];
}

const BRAND_PRIMARY = "0F172A"; // Deep Navy
const BRAND_ACCENT = "2563EB"; // Vibrant Blue
const BRAND_TEXT = "334155"; // Slate
const BRAND_MUTED = "64748B"; // Muted
const BRAND_BG_LIGHT = "F8FAFC";
const BRAND_BORDER = "E2E8F0";

function parseInlineMarkdown(text: string): TextRun[] {
    const parts: TextRun[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
            parts.push(new TextRun({ text: text.substring(lastIndex, match.index) }));
        }
        // Matched bold text
        parts.push(new TextRun({
            text: match[1],
            bold: true
        }));
        lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
        parts.push(new TextRun({ text: text.substring(lastIndex) }));
    }

    if (parts.length === 0 && text.length > 0) {
        parts.push(new TextRun({ text: text }));
    }

    return parts;
}

function parseMarkdownToParagraphs(content: string, title?: string): (Paragraph | Table)[] {
    const paragraphs: (Paragraph | Table)[] = [];

    if (title) {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: title,
                    bold: true,
                    font: "Segoe UI",
                    size: 32,
                    color: BRAND_PRIMARY,
                }),
            ],
            spacing: { before: 400, after: 200 },
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_ACCENT },
            },
        }));
    }

    if (!content) {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: "[No content provided]", italics: true, color: BRAND_MUTED })],
            spacing: { before: 100, after: 100 },
        }));
        return paragraphs;
    }

    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 120 } }));
            continue;
        }

        if (trimmed.startsWith('#')) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const text = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, ''); // Strip bold markers from headers
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text, bold: true, size: 32 - (level * 2), color: BRAND_PRIMARY })],
                spacing: { before: 240, after: 120 }
            }));
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            // Remove the bullet char
            const listContent = trimmed.substring(2);
            paragraphs.push(new Paragraph({
                children: [
                    new TextRun({ text: "• ", bold: true, color: BRAND_ACCENT }),
                    ...parseInlineMarkdown(listContent)
                ],
                indent: { left: 360, hanging: 360 },
                spacing: { before: 80, after: 80 }
            }));
        } else {
            paragraphs.push(new Paragraph({
                children: parseInlineMarkdown(trimmed),
                spacing: { before: 120, after: 120 }
            }));
        }
    }

    return paragraphs;
}

export async function generateRiskReportDocx(data: RiskExportData): Promise<Buffer> {
    const children: (Paragraph | Table)[] = [];

    // Cover Page
    children.push(
        new Paragraph({
            children: [new TextRun({ text: "RISK MANAGEMENT REPORT", size: 24, font: "Segoe UI", bold: true, color: BRAND_ACCENT, characterSpacing: 20 })],
            spacing: { before: 2000, after: 400 },
        }),
        new Paragraph({
            children: [new TextRun({ text: data.title || "Risk Management Report", bold: true, font: "Segoe UI", size: 72, color: BRAND_PRIMARY })],
            spacing: { after: 400 },
            border: { left: { style: BorderStyle.SINGLE, size: 120, color: BRAND_ACCENT, space: 20 } },
            indent: { left: 400 }
        }),
        new Paragraph({
            children: [new TextRun({ text: data.clientName, font: "Segoe UI", size: 36, color: BRAND_MUTED })],
            spacing: { after: 1200 },
            indent: { left: 800 }
        }),
        new Paragraph({
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20, color: BRAND_MUTED })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 2400 }
        }),
        new Paragraph({ text: "", border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: BRAND_PRIMARY } }, spacing: { before: 400 } }),
        new Paragraph({ children: [new PageBreak()] })
    );


    // Sections
    const sections = [
        { title: "Executive Summary", content: data.executiveSummary },
        { title: "Introduction", content: data.introduction },
        { title: "Scope", content: data.scope },
        { title: "Methodology", content: data.methodology },
        { title: "Key Findings", content: data.keyFindings },
        { title: "Recommendations", content: data.recommendations },
        { title: "Risk Register", content: "", isTable: true },
        { title: "Conclusion", content: data.conclusion },
        { title: "Assumptions & Limitations", content: data.assumptions },
        { title: "References", content: data.references },
    ];

    for (const section of sections) {
        if (section.isTable && data.risks && data.risks.length > 0) {
            children.push(
                new Paragraph({
                    text: section.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }),
                riskRegisterTable(data.risks)
            );
            continue;
        }

        children.push(...parseMarkdownToParagraphs(section.content || "", section.title));
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Calibri", size: 24, color: BRAND_TEXT },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: data.title, size: 18, color: BRAND_MUTED }),
                                    new TextRun({ text: "\t\t" }),
                                    new TextRun({ text: "CONFIDENTIAL", size: 18, color: "CC0000", bold: true }),
                                ],
                                tabStops: [
                                    { type: "center" as any, position: 4680 },
                                    { type: "right" as any, position: 9360 }
                                ],
                                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BORDER } },
                                spacing: { after: 240 }
                            }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BRAND_MUTED }),
                                    new TextRun({ text: " of ", size: 18, color: BRAND_MUTED }),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: BRAND_MUTED }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                },
                children,
            },
        ],
    });

    return await Packer.toBuffer(doc);
}

function getReportRiskLevel(score: number): string {
    if (score >= 15) return 'Critical/Very High';
    if (score >= 9) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
}

function riskRegisterTable(risks: any[]): Table {
    const headerRow = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ID", bold: true })] })], shading: { fill: "E2E8F0", type: ShadingType.CLEAR } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Risk Title", bold: true })] })], shading: { fill: "E2E8F0", type: ShadingType.CLEAR } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Inherent", bold: true })] })], shading: { fill: "E2E8F0", type: ShadingType.CLEAR } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Residual", bold: true })] })], shading: { fill: "E2E8F0", type: ShadingType.CLEAR } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })], shading: { fill: "E2E8F0", type: ShadingType.CLEAR } }),
        ],
        tableHeader: true,
    });

    const rows = risks.map(risk => {
        const score = typeof risk.inherentScore === 'number' ? risk.inherentScore : 0;
        const level = getReportRiskLevel(score);

        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: risk.assessmentId || "-", size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: risk.title || "Untitled Risk", size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: level, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: risk.residualRisk || "-", size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: risk.status || "Draft", size: 20 })] })] }),
            ]
        });
    });

    return new Table({
        rows: [headerRow, ...rows],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}
