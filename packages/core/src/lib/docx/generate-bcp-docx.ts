/**
 * BCP Document Generator
 * Generates a professional Business Continuity Plan document in DOCX format
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle } from "docx";
import { parseMarkdownToDocx } from "./markdown-parser";
import { getBcpStyles } from "./bcp-styles";

interface BcpSection {
    sectionKey: string;
    content: string;
    order: number;
}

interface RecoveryObjective {
    activity: string;
    rto?: string;
    rpo?: string;
    mtpd?: string;
    criticality?: string;
}

interface BcpExportData {
    plan: {
        title: string;
        version?: string;
        status?: string;
        lastTestedDate?: Date | string;
    };
    sections: BcpSection[];
    bias?: Array<{ title: string; rtos?: RecoveryObjective[] }>;
    strategies?: Array<{ title: string; description?: string }>;
    scenarios?: Array<{ title: string; description?: string; likelihood?: string; potentialImpact?: string }>;
    exercises?: Array<{ title: string; type: string; status?: string; startDate?: Date | string }>;
}

const BRAND_PRIMARY = "1C4D8D";
const BRAND_SECONDARY = "5B9BD5";

export async function generateBcpDocx(data: BcpExportData): Promise<Buffer> {
    const styles = getBcpStyles();
    const children: (Paragraph | Table)[] = [];

    // --- Cover Page ---
    children.push(
        new Paragraph({ children: [] }), // Spacer
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({
            children: [new TextRun({ text: data.plan.title, bold: true, size: 64, color: BRAND_PRIMARY, font: "Calibri Light" })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 480 }
        }),
        new Paragraph({
            children: [new TextRun({ text: `Version ${data.plan.version || "1.0"}`, size: 32, color: "666666" })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240 }
        }),
        new Paragraph({
            children: [new TextRun({ text: `Status: ${data.plan.status || "Draft"}`, size: 28, color: "666666" })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240 }
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 24, color: "999999" })],
            alignment: AlignmentType.RIGHT
        }),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- Table of Contents Placeholder ---
    children.push(
        new Paragraph({ text: "Table of Contents", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: "[Update in Word: References > Update Table]", italics: true, color: "999999", size: 22 })] }),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- Main Sections from Database ---
    const sortedSections = [...(data.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const section of sortedSections) {
        const parsed = parseMarkdownToDocx(section.content);
        children.push(...parsed);
        children.push(new Paragraph({ children: [] })); // Spacer
    }

    // --- Recovery Objectives Table ---
    if (data.bias && data.bias.length > 0) {
        children.push(
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "Recovery Time Objectives (RTO/RPO)", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } })
        );

        const allRtos: RecoveryObjective[] = [];
        for (const bia of data.bias) {
            if (bia.rtos) allRtos.push(...bia.rtos);
        }

        if (allRtos.length > 0) {
            const headerRow = new TableRow({
                children: ["Activity", "Criticality", "RTO", "RPO", "MTPD"].map(h =>
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 22 })], alignment: AlignmentType.CENTER })],
                        shading: { fill: BRAND_PRIMARY, type: ShadingType.CLEAR }
                    })
                )
            });

            const dataRows = allRtos.map(rto =>
                new TableRow({
                    children: [
                        rto.activity || "-",
                        rto.criticality || "-",
                        rto.rto || "-",
                        rto.rpo || "-",
                        rto.mtpd || "-"
                    ].map(val =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: val, size: 22 })] })]
                        })
                    )
                })
            );

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...dataRows]
            }));
        }
    }

    // --- Strategies Summary ---
    if (data.strategies && data.strategies.length > 0) {
        children.push(
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "Recovery Strategies", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } })
        );
        for (const strat of data.strategies) {
            children.push(
                new Paragraph({ text: strat.title, heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ children: [new TextRun({ text: strat.description || "No description provided.", size: 22 })] }),
                new Paragraph({ children: [] })
            );
        }
    }

    // --- Scenario Analysis ---
    if (data.scenarios && data.scenarios.length > 0) {
        children.push(
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "Disruptive Scenarios", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } })
        );
        for (const scen of data.scenarios) {
            children.push(
                new Paragraph({ text: scen.title, heading: HeadingLevel.HEADING_3 }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Likelihood: `, bold: true, size: 22 }),
                        new TextRun({ text: scen.likelihood || "N/A", size: 22 }),
                        new TextRun({ text: "  |  Impact: ", bold: true, size: 22 }),
                        new TextRun({ text: scen.potentialImpact || "N/A", size: 22 })
                    ]
                }),
                new Paragraph({ children: [new TextRun({ text: scen.description || "", size: 22 })] }),
                new Paragraph({ children: [] })
            );
        }
    }

    // --- Exercise History ---
    if (data.exercises && data.exercises.length > 0) {
        children.push(
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "Exercise & Test History", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } })
        );
        const headerRow = new TableRow({
            children: ["Title", "Type", "Date", "Status"].map(h =>
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 22 })], alignment: AlignmentType.CENTER })],
                    shading: { fill: BRAND_PRIMARY, type: ShadingType.CLEAR }
                })
            )
        });
        const dataRows = data.exercises.map(ex =>
            new TableRow({
                children: [
                    ex.title,
                    ex.type,
                    ex.startDate ? new Date(ex.startDate).toLocaleDateString() : "-",
                    ex.status || "-"
                ].map(val =>
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: val, size: 22 })] })]
                    })
                )
            })
        );
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        }));
    }

    // --- Create Document ---
    const doc = new Document({
        styles: styles,
        sections: [{
            children: children
        }]
    });

    return await Packer.toBuffer(doc);
}
