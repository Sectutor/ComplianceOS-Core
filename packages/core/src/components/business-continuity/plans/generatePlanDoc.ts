import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, Header, Footer, ImageRun, AlignmentType, PageNumber, PageOrientation, VerticalAlign, TableOfContents } from "docx";
import { saveAs } from "file-saver";
import { getBcpStyles } from "@/lib/docx/bcp-styles";
import { parseMarkdownToDocx } from "@/lib/docx/markdown-parser";

/**
 * Generates a Professional MS Word Document for the Business Continuity Plan
 */
export async function generatePlanDocument(plan: any) {
    if (!plan) return;

    // 1. Prepare Styles
    const styles = getBcpStyles();

    // 2. Prepare Sections content
    // We already have enriched content sections in plan.sections (intro, scope, etc.)
    // We also have direct lists like callList, strategies, bias

    // Sort sections by order if they exist
    const sections = plan.sections ? [...plan.sections].sort((a: any, b: any) => a.order - b.order) : [];

    // 3. Define Header / Footer
    const header = new Header({
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: "CONFIDENTIAL - BUSINESS CONTINUITY PLAN", size: 16, color: "999999" }),
                ],
                alignment: AlignmentType.RIGHT,
            }),
        ],
    });

    const footer = new Footer({
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: `${plan.title} (v${plan.version}) | `, size: 18 }),
                    new TextRun({
                        children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                        size: 18,
                    }),
                ],
                alignment: AlignmentType.CENTER,
            }),
        ],
    });

    // 4. Construct Document Content
    const docChildren: any[] = [];

    // --- COVER PAGE ---
    // (Add spacing or logo placeholder)
    docChildren.push(new Paragraph({ text: "", spacing: { before: 3000 } })); // Top padding

    docChildren.push(new Paragraph({
        text: plan.title,
        style: "CoverTitle"
    }));

    docChildren.push(new Paragraph({
        text: `Version: ${plan.version}`,
        style: "CoverSubtitle"
    }));

    docChildren.push(new Paragraph({
        text: `Status: ${plan.status ? plan.status.toUpperCase() : "DRAFT"}`,
        style: "CoverSubtitle"
    }));

    docChildren.push(new Paragraph({
        text: `Generated: ${new Date().toLocaleDateString()}`,
        style: "CoverSubtitle"
    }));

    docChildren.push(new Paragraph({
        text: (plan.content as any)?.metadata?.department
            ? `Department: ${(plan.content as any).metadata.department}`
            : "",
        style: "CoverSubtitle",
        spacing: { after: 2000 }
    }));

    // Page Break after Cover
    docChildren.push(new Paragraph({
        children: [new TextRun({ text: "", break: 1 })],
        pageBreakBefore: true
    }));


    // --- TABLE OF CONTENTS ---
    docChildren.push(new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
    }));

    docChildren.push(new Paragraph({
        children: [
            new TextRun({
                text: "NOTE: Right-click above and select 'Update Field' to refresh page numbers.",
                italics: true,
                size: 16,
                color: "666666"
            }),
            new TextRun({ text: "", break: 1 }) // Spacing
        ],
        spacing: { after: 400 }
    }));

    // Page Break before content starts
    docChildren.push(new Paragraph({
        children: [new TextRun({ text: "", break: 1 })],
        pageBreakBefore: true
    }));

    // --- SECTIONS ---

    // Define standard ordering and titles
    const STANDARD_SECTIONS: Record<string, { order: number, title: string, level?: number }> = {
        'intro': { order: 1, title: "1. Introduction" },
        'scope': { order: 2, title: "2. Scope & Objectives" },
        'assumptions': { order: 3, title: "2.1 Assumptions & Dependencies", level: 2 },
        'activation_criteria': { order: 10, title: "3. Activation Procedures" }, // Main header for Activation
        'escalation_procedures': { order: 11, title: "3.2 Escalation Procedures", level: 2 },
        // 'strategies' usually dynamic
    };

    // Helper to get sort weight
    const getSortOrder = (s: any) => {
        if (s.sectionKey && STANDARD_SECTIONS[s.sectionKey]) return STANDARD_SECTIONS[s.sectionKey].order;
        return (s.order || 100) + 20; // User defined sections come after standard ones
    };

    const sortedSections = sections.sort((a: any, b: any) => getSortOrder(a) - getSortOrder(b));

    for (const section of sortedSections) {
        if (!section.content) continue;

        // Determine if we need to inject a header
        const key = section.sectionKey;
        const stdConfig = STANDARD_SECTIONS[key];

        if (stdConfig) {
            // Check if content already starts with header
            const hasHeader = /^\s*#{1,6}\s/.test(section.content);

            // Special handling for Activation Criteria: It acts as the "Parent" 3. header usually.
            // If we are at 'activation_criteria', we print "3. Activation Procedures" (H1) and then maybe "3.1 Criteria" (H2)
            if (key === 'activation_criteria') {
                docChildren.push(new Paragraph({
                    text: "3. Activation Procedures",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 120 }
                }));
                // The content itself might be the criteria. Let's add 3.1 header for it.
                docChildren.push(new Paragraph({
                    text: "3.1 Activation Criteria",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 100 }
                }));
            } else if (!hasHeader) {
                // Inject Standard Title
                docChildren.push(new Paragraph({
                    text: stdConfig.title,
                    heading: stdConfig.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 100 }
                }));
            }
        }

        const parsedParagraphs = parseMarkdownToDocx(section.content);
        docChildren.push(...parsedParagraphs);
    }

    // --- APPENDICES / DATA TABLES (If not in sections) ---

    // Call List Appendix
    const callList = (plan.content as any)?.callList;
    if (callList && Array.isArray(callList) && callList.length > 0) {
        docChildren.push(new Paragraph({
            text: "Appendix: Key Contact List",
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true
        }));

        docChildren.push(createTable([
            ["Name", "Role", "Email"],
            ...callList.map((c: any) => [c.name || "", c.role || "", c.email || ""])
        ]));
    }

    // Strategies Appendix
    if (plan.strategies && plan.strategies.length > 0) {
        docChildren.push(new Paragraph({
            text: "Appendix: Recovery Strategies",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 }
        }));

        docChildren.push(createTable([
            ["Strategy", "Type", "Cost", "Description"],
            ...plan.strategies.map((s: any) => [
                s.title || "",
                s.type || "-",
                s.estimatedCost || "-",
                s.description || ""
            ])
        ], [30, 15, 15, 40])); // Width %
    }


    // 5. Create Document
    const doc = new Document({
        styles: styles,
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
                }
            },
            headers: { default: header },
            footers: { default: footer },
            children: docChildren,
        }],
    });

    // 6. Pack & Save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BCP-${plan.title.replace(/[^a-z0-9]/gi, '_')}-${plan.version}.docx`);
}

function createTable(rows: string[][], columnWidthsPercents?: number[]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map((rowCells, rowIndex) =>
            new TableRow({
                children: rowCells.map((cellText, cellIndex) =>
                    new TableCell({
                        children: [new Paragraph({
                            text: cellText,
                            style: rowIndex === 0 ? "TableHeader" : "TableCell"
                        })],
                        shading: rowIndex === 0 ? { fill: "1C4D8D", color: "auto" } : rowIndex % 2 === 0 ? { fill: "F2F2F2", color: "auto" } : undefined, // Header Blue, Alt Rows Grey
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        },
                        width: columnWidthsPercents ? { size: columnWidthsPercents[cellIndex], type: WidthType.PERCENTAGE } : undefined
                    })
                )
            })
        )
    });
}
