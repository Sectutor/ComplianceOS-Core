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
  Tab,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
  LevelFormat,
} from "docx";

interface PolicySection {
  title: string;
  content: string;
}

interface PolicyExportData {
  name: string;
  content: string;
  sections: string[];
  version: number;
  clientName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  templateId?: string;
  framework?: string;
  logoUrl?: string | null;
  // Contact information
  contactName?: string | null;
  contactTitle?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}

// Brand colors
// Premium Corporate Brand colors
const BRAND_PRIMARY = "0F172A"; // Deep Navy (Headings)
const BRAND_ACCENT = "2563EB"; // Vibrant Blue (Highlights)
const BRAND_SUCCESS = "059669"; // Emerald (Approved Status)
const BRAND_WARNING = "D97706"; // Amber (Draft Status)
const BRAND_TEXT = "334155"; // Slate (Body text)
const BRAND_MUTED = "64748B"; // Muted/Meta text
const BRAND_BG_LIGHT = "F8FAFC"; // Light background for tables
const BRAND_BORDER = "E2E8F0"; // Subtle borders

// Parse content into sections
function parseContentToSections(content: string, sectionTitles: string[]): PolicySection[] {
  const sections: PolicySection[] = [];

  if (!content) {
    // If no content, create empty sections from titles
    return sectionTitles.map(title => ({ title, content: '' }));
  }

  // Split by ## headers
  const parts = content.split(/^## /gm);

  for (const part of parts) {
    if (!part.trim()) continue;

    const lines = part.split('\n');
    const title = lines[0].trim();
    const sectionContent = lines.slice(1).join('\n').trim();

    sections.push({ title, content: sectionContent });
  }

  // If no sections found, treat entire content as one section
  if (sections.length === 0 && content.trim()) {
    sections.push({ title: 'Policy Content', content: content });
  }

  return sections;
}

// Helper to create a table from markdown lines
function createTableFromMarkdown(lines: string[]): Table {
  // Remove markdown separator row (contains ---) and filter empty lines
  const dataRows = lines.filter(line => !line.includes('---') && line.trim().length > 0);

  if (dataRows.length === 0) return new Table({ rows: [] });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_ACCENT },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_ACCENT },
      left: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
    },
    rows: dataRows.map((line, rowIndex) => {
      // Split by pipe, remove empty start/end if they exist
      const cells = line.split('|').map(c => c.trim());
      // Markdown tables often have leading/trailing pipes like "| A | B |", split gives ["", "A", "B", ""]
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();

      const isHeader = rowIndex === 0;

      return new TableRow({
        children: cells.map(cell => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: cell,
              bold: isHeader,
              color: isHeader ? "FFFFFF" : BRAND_TEXT,
              font: isHeader ? "Segoe UI" : "Calibri",
              size: isHeader ? 22 : 20
            })],
            spacing: { before: 60, after: 60 }
          })],
          shading: {
            type: ShadingType.SOLID,
            color: isHeader ? BRAND_PRIMARY : (rowIndex % 2 === 0 ? "FFFFFF" : BRAND_BG_LIGHT)
          },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.05), right: convertInchesToTwip(0.05) }
        }))
      });
    })
  });
}

// Parse markdown content to docx paragraphs with enhanced styling and dynamic numbering
function parseMarkdownToParagraphs(content: string, sectionIndex?: number): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];
  let tableBuffer: string[] = [];
  const lines = content.split('\n');
  let subSectionCounter = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for table row
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      tableBuffer.push(trimmedLine);
      continue;
    }

    // If we have a buffered table, flush it
    if (tableBuffer.length > 0) {
      paragraphs.push(createTableFromMarkdown(tableBuffer));
      tableBuffer = []; // Clear buffer
    }

    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      continue;
    }

    // Handle headers with dynamic numbering
    if (trimmedLine.startsWith('### ')) {
      let text = trimmedLine.substring(4);

      // Dynamic numbering: If sectionIndex is provided, force consistent numbering
      if (sectionIndex !== undefined) {
        subSectionCounter++;
        // Clean existing numbering (e.g., "3.1", "1.1")
        text = text.replace(/^[\d\.]+\s*/, '').trim();
        text = `${sectionIndex}.${subSectionCounter} ${text}`;
      }

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            font: "Segoe UI",
            size: 24, // 12pt
            color: BRAND_PRIMARY,
          }),
        ],
        spacing: { before: 240, after: 120 },
      }));
    } else if (trimmedLine.startsWith('## ')) {
      let text = trimmedLine.substring(3);

      if (sectionIndex !== undefined) {
        subSectionCounter++;
        text = text.replace(/^[\d\.]+\s*/, '').trim();
        text = `${sectionIndex}.${subSectionCounter} ${text}`;
      }

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            font: "Segoe UI",
            size: 28, // 14pt
            color: BRAND_PRIMARY,
          }),
        ],
        spacing: { before: 360, after: 160 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
        }
      }));
    } else if (trimmedLine.startsWith('# ')) {
      // Top level header in content (should be rare if split correctly, but handle just in case)
      let text = trimmedLine.substring(2);

      if (sectionIndex !== undefined) {
        // Treat as sub-section or ignore? Let's treat as sub-section to maintain hierarchy
        subSectionCounter++;
        text = text.replace(/^[\d\.]+\s*/, '').trim();
        text = `${sectionIndex}.${subSectionCounter} ${text}`;
      }

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            font: "Segoe UI",
            size: 32, // 16pt
            color: BRAND_PRIMARY,
          }),
        ],
        spacing: { before: 480, after: 240 },
      }));
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: "• ", bold: true, color: BRAND_ACCENT }),
          ...parseInlineFormatting(trimmedLine.substring(2)),
        ],
        indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
        spacing: { before: 80, after: 80 },
      }));
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      // Numbered list
      const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
      if (match) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${match[1]}. `, bold: true, color: BRAND_PRIMARY }),
            ...parseInlineFormatting(match[2]),
          ],
          indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
          spacing: { before: 80, after: 80 },
        }));
      }
    } else if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // Simple table row simulation (since real markdown tables are complex to parse fully here)
      // We render them as simulated rows with shading
      if (!trimmedLine.includes('---')) {
        const cells = trimmedLine.split('|').filter(c => c.trim());
        paragraphs.push(new Paragraph({
          children: cells.map((cell, i) => new TextRun({
            text: (i > 0 ? ' | ' : '') + cell.trim(),
            font: "Consolas",
            size: 20,
            color: BRAND_TEXT,
          })),
          shading: { type: ShadingType.SOLID, color: BRAND_BG_LIGHT },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
            left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
            right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
            top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
          },
          indent: { left: convertInchesToTwip(0.1) },
          spacing: { before: 40, after: 40 },
        }));
      }
    } else {
      // Regular paragraph
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(trimmedLine),
        spacing: { before: 120, after: 120 },
      }));
    }
  }

  // Flush remaining table if exists
  if (tableBuffer.length > 0) {
    paragraphs.push(createTableFromMarkdown(tableBuffer));
  }

  return paragraphs;
}

// Parse inline formatting (bold, italic)
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let remaining = text;
  let lastIndex = 0;

  // Handle bold text
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index) }));
    }
    runs.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex) }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

// Create table of contents with new styling
function createTableOfContents(sections: PolicySection[]): Paragraph[] {
  const tocParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Table of Contents",
          bold: true,
          font: "Segoe UI",
          size: 32, // 16pt
          color: BRAND_PRIMARY,
        }),
      ],
      spacing: { before: 200, after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BORDER },
      },
    }),
  ];

  sections.forEach((section, index) => {
    tocParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true, color: BRAND_ACCENT }),
        new TextRun({ text: section.title, color: BRAND_TEXT }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `${index + 2}`, color: BRAND_MUTED }), // Page estimate
      ],
      tabStops: [
        { type: TabStopType.RIGHT, position: convertInchesToTwip(6.5), leader: "dot" },
      ],
      spacing: { before: 120, after: 120 },
    }));
  });

  return tocParagraphs;
}

// Create document control table with zebra striping and professional borders
function createDocumentControlTable(policy: PolicyExportData): Table {
  const rows = [
    ["Document Title", sanitizeText(policy.name)],
    ["Document ID", sanitizeText(policy.templateId) || `POL-${Date.now()}`],
    ["Version", `${policy.version}.0`],
    ["Status", sanitizeText(policy.status).charAt(0).toUpperCase() + sanitizeText(policy.status).slice(1)],
    ["Framework", sanitizeText(policy.framework) || "ISO 27001 / SOC 2"],
    ["Organization", sanitizeText(policy.clientName)],
    ...(policy.contactName ? [["Primary Contact", `${sanitizeText(policy.contactName)}${policy.contactTitle ? ` (${sanitizeText(policy.contactTitle)})` : ''}`]] : []),
    ...(policy.contactEmail ? [["Contact Email", sanitizeText(policy.contactEmail)]] : []),
    ["Effective Date", new Date(policy.createdAt).toLocaleDateString()],
    ["Last Review Date", new Date(policy.updatedAt).toLocaleDateString()],
    ["Next Review Date", new Date(new Date(policy.updatedAt).setFullYear(new Date(policy.updatedAt).getFullYear() + 1)).toLocaleDateString()],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: BRAND_ACCENT }, // Top heavy border
      bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND_ACCENT },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    rows: rows.map((row, index) => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: row[0], bold: true, size: 22, color: BRAND_PRIMARY, font: "Segoe UI" })],
            spacing: { before: 120, after: 120 }
          })],
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: index % 2 === 0 ? "FFFFFF" : BRAND_BG_LIGHT },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
            top: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
          },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: row[1], size: 22, color: BRAND_TEXT })],
            spacing: { before: 120, after: 120 }
          })],
          width: { size: 65, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: index % 2 === 0 ? "FFFFFF" : BRAND_BG_LIGHT },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_BORDER },
            top: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
          },
        }),
      ],
    })),
  });
}

// Create approval signature block
function createApprovalBlock(): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Document Approval",
          bold: true,
          size: 28,
          color: BRAND_PRIMARY,
        }),
      ],
      spacing: { before: 600, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Prepared By: ", bold: true }),
        new TextRun({ text: "_________________________" }),
        new TextRun({ text: "    Date: " }),
        new TextRun({ text: "_____________" }),
      ],
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Reviewed By: ", bold: true }),
        new TextRun({ text: "_________________________" }),
        new TextRun({ text: "    Date: " }),
        new TextRun({ text: "_____________" }),
      ],
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Approved By: ", bold: true }),
        new TextRun({ text: "_________________________" }),
        new TextRun({ text: "    Date: " }),
        new TextRun({ text: "_____________" }),
      ],
      spacing: { before: 200, after: 400 },
    }),
  ];
}

// Sanitize text to remove XML-invalid characters
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  // Remove control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F) which are invalid in XML 1.0
  // Keep tab (0x09), newline (0x0A), carriage return (0x0D)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF]/g, "");
}

import { logger } from './lib/logger';

export async function generateProfessionalDocx(policy: PolicyExportData): Promise<Buffer> {
  const sections = parseContentToSections(sanitizeText(policy.content), policy.sections || []);

  // Globally clean section titles for consistency in Body and TOC
  sections.forEach(section => {
    section.title = sanitizeText(section.title)
      .replace(/^[#*]+\s*/, '') // Remove markdown headers/bold
      .replace(/^[\d]+\.[\d\.]*\s*/, '') // Remove existing numbering
      .trim();
  });

  // Build section content
  const sectionContent: (Paragraph | Table)[] = [];
  sections.forEach((section, index) => {
    // Section header
    // Clean title of markdown and numbering
    const cleanTitle = sanitizeText(section.title)
      .replace(/^[#*]+\s*/, '') // Remove markdown headers/bold
      .replace(/^[\d]+\.[\d\.]*\s*/, '') // Remove existing numbering
      .trim();

    sectionContent.push(new Paragraph({
      children: [
        new TextRun({
          text: `${index + 1}. ${cleanTitle}`,
          bold: true,
          font: "Segoe UI",
          size: 36, // 18pt
          color: BRAND_PRIMARY,
        }),
      ],
      spacing: { before: 600, after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND_ACCENT }, // Thick visual divider
      },
    }));

    // Section content
    if (section.content) {
      sectionContent.push(...parseMarkdownToParagraphs(sanitizeText(section.content), index + 1));
    } else {
      sectionContent.push(new Paragraph({
        children: [new TextRun({ text: "[Content to be added]", italics: true, color: BRAND_MUTED })],
        spacing: { before: 100, after: 100 },
      }));
    }
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24, // 12pt
            color: BRAND_TEXT,
          },
        },
      },
    },
    sections: [
      // Cover Page - Premium Design with Accent Bar
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "POLICY DOCUMENT",
                size: 24,
                font: "Segoe UI",
                bold: true,
                color: BRAND_ACCENT,
                characterSpacing: 20,
              })
            ],
            spacing: { before: 2000, after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: sanitizeText(policy.name),
                bold: true,
                font: "Segoe UI",
                size: 72, // 36pt
                color: BRAND_PRIMARY,
              })
            ],
            spacing: { after: 400 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 120, color: BRAND_ACCENT, space: 20 }, // Thick accent bar
            },
            indent: { left: convertInchesToTwip(0.2) } // Add space for border
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: sanitizeText(policy.clientName),
                font: "Segoe UI",
                size: 36, // 18pt
                color: BRAND_MUTED,
              })
            ],
            spacing: { after: 1200 },
            indent: { left: convertInchesToTwip(0.4) }
          }),

          // Status Badge and Metadata
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 },
              insideHorizontal: { style: BorderStyle.NONE, size: 0 },
              insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "VERSION", size: 20, color: BRAND_MUTED, bold: true }),
                          new TextRun({ text: `\n${policy.version}.0`, size: 28, color: BRAND_TEXT, font: "Segoe UI" }),
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "STATUS", size: 20, color: BRAND_MUTED, bold: true }),
                          new TextRun({
                            text: `\n${sanitizeText(policy.status).toUpperCase()}`,
                            size: 28,
                            color: policy.status === 'approved' ? BRAND_SUCCESS : BRAND_WARNING,
                            font: "Segoe UI",
                            bold: true
                          }),
                        ]
                      })
                    ]
                  }),
                ]
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                size: 20,
                color: BRAND_MUTED,
              })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 2400 },
          }),

          // Bottom heavy border
          new Paragraph({
            text: "",
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 24, color: BRAND_PRIMARY }
            },
            spacing: { before: 400 }
          })
        ],
      },
      // Document Control Page
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: sanitizeText(policy.name), size: 18, color: BRAND_MUTED }),
                  new TextRun({ text: "\t\t" }), // Tab for right alignment
                  new TextRun({ text: "CONFIDENTIAL", size: 18, color: "CC0000", bold: true }),
                ],
                tabStops: [
                  { type: TabStopType.CENTER, position: convertInchesToTwip(3.25) }, // Center of 6.5
                  { type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) } // Fixed: Match margin width (was 8.5)
                ],
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BORDER }
                },
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
                  new TextRun({ text: "CONFIDENTIAL | ", size: 18, color: "CC0000" }),
                  new TextRun({ text: `Version ${policy.version}.0 | Page `, size: 18, color: BRAND_MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BRAND_MUTED }),
                  new TextRun({ text: " of ", size: 18, color: BRAND_MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: BRAND_MUTED }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Document Control",
                bold: true,
                font: "Segoe UI",
                size: 36,
                color: BRAND_PRIMARY,
              }),
            ],
            spacing: { after: 400 },
          }),
          createDocumentControlTable(policy),
          ...createApprovalBlock(),
        ],
      },
      // Table of Contents
      {
        properties: {
          // Inherit headers/footers
        },
        children: createTableOfContents(sections),
      },
      // Main Content
      {
        properties: {
          // Inherit
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: sanitizeText(policy.name), size: 20, color: BRAND_MUTED }),
                  new TextRun({ text: " | " }),
                  new TextRun({ text: sanitizeText(policy.clientName), size: 20, color: BRAND_MUTED }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: sanitizeText(policy.clientName), size: 18, color: BRAND_MUTED }),
                  new TextRun({ text: "\t" }),
                  new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 18, color: BRAND_MUTED })
                ],
                tabStops: [
                  { type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) }
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BORDER }
                },
                spacing: { before: 240 }
              })
            ]
          })
        },
        children: sectionContent,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Generate professional HTML for PDF conversion
export function generateProfessionalHtml(policy: PolicyExportData): string {
  const sections = parseContentToSections(policy.content, policy.sections || []);

  // Helper to convert markdown tables to HTML
  function convertMarkdownTablesToHtml(markdown: string): string {
    const lines = markdown.split('\n');
    let inTable = false;
    let tableBuffer: string[] = [];
    let result: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');

      if (isTableRow) {
        if (!inTable) inTable = true;
        tableBuffer.push(trimmed);
      } else {
        if (inTable) {
          // Process buffered table
          result.push(renderHtmlTable(tableBuffer));
          tableBuffer = [];
          inTable = false;
        }
        result.push(line);
      }
    }

    // Flush remaining table
    if (inTable && tableBuffer.length > 0) {
      result.push(renderHtmlTable(tableBuffer));
    }

    return result.join('\n');
  }

  function renderHtmlTable(lines: string[]): string {
    // Filter dashes
    const dataRows = lines.filter(l => !l.includes('---'));
    if (dataRows.length === 0) return '';

    let html = '<table>';
    dataRows.forEach((row, index) => {
      const cells = row.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();

      const tag = index === 0 ? 'th' : 'td';
      html += '<tr>';
      cells.forEach(cell => {
        html += `<${tag}>${cell}</${tag}>`;
      });
      html += '</tr>';
    });
    html += '</table>';
    return html;
  }


  // Generate TOC HTML
  const tocHtml = sections.map((section, index) =>
    `<div class="toc-item"><span class="toc-number">${index + 1}.</span> ${section.title}</div>`
  ).join('');

  // Generate sections HTML
  const sectionsHtml = sections.map((section, index) => {
    let contentHtml = section.content || '<p class="placeholder">[Content to be added]</p>';

    // Detect and convert markdown tables BEFORE other regex replacements
    // This prevents table rows from being broken by newline replacements
    contentHtml = convertMarkdownTablesToHtml(contentHtml);

    // Convert markdown to HTML
    contentHtml = contentHtml
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\.\s(.+)$/gm, '<li class="numbered">$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap lists
    contentHtml = contentHtml.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');
    contentHtml = contentHtml.replace(/(<li class="numbered">[\s\S]*?<\/li>)+/g, '<ol>$&</ol>');

    return `
      <div class="section">
        <h2 class="section-title"><span class="section-number">${index + 1}.</span> ${section.title}</h2>
        <div class="section-content"><p>${contentHtml}</p></div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2.5cm;
      @top-right {
        content: "${policy.name} | ${policy.clientName}";
        font-size: 9pt;
        color: #666;
      }
      @bottom-center {
        content: "CONFIDENTIAL | Version ${policy.version}.0 | Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #666;
      }
    }
    
    @page :first {
      @top-right { content: none; }
      @bottom-center { content: none; }
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    
    /* Cover Page */
    .cover-page {
      page-break-after: always;
      text-align: center;
      padding-top: 8%;
    }
    
    .cover-logo {
      max-width: 180px;
      max-height: 100px;
      margin-bottom: 40px;
    }
    
    .cover-title {
      font-size: 36pt;
      font-weight: bold;
      color: #1E3A5F;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      color: #666;
      margin-bottom: 60px;
    }
    
    .cover-divider {
      width: 200px;
      height: 3px;
      background: linear-gradient(90deg, #0066CC, #1E3A5F);
      margin: 40px auto;
    }
    
    .cover-client {
      font-size: 24pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    
    .cover-contact {
      font-size: 12pt;
      color: #444;
      margin-bottom: 3px;
    }
    
    .cover-contact-details {
      font-size: 10pt;
      color: #666;
      margin-bottom: 3px;
    }
    
    .cover-address {
      font-size: 10pt;
      color: #666;
      margin-bottom: 10px;
    }
    
    .cover-version {
      font-size: 14pt;
      color: #666;
      margin-bottom: 10px;
    }
    
    .cover-status {
      font-size: 14pt;
      font-weight: bold;
      color: ${policy.status === 'approved' ? '#2E7D32' : '#666'};
      margin-bottom: 20px;
    }
    
    .cover-date {
      font-size: 12pt;
      color: #666;
      margin-bottom: 80px;
    }
    
    .cover-confidential {
      margin-top: 60px;
    }
    
    .cover-confidential-label {
      font-size: 12pt;
      font-weight: bold;
      color: #CC0000;
      margin-bottom: 10px;
    }
    
    .cover-confidential-text {
      font-size: 10pt;
      color: #666;
      font-style: italic;
    }
    
    /* Document Control Page */
    .doc-control-page {
      page-break-after: always;
    }
    
    .page-title {
      font-size: 18pt;
      font-weight: bold;
      color: #1E3A5F;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0066CC;
    }
    
    .control-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    
    .control-table td {
      padding: 12px 15px;
      border: 1px solid #ddd;
    }
    
    .control-table td:first-child {
      width: 35%;
      font-weight: bold;
      background: #f5f5f5;
    }
    
    .approval-section {
      margin-top: 50px;
    }
    
    .approval-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1E3A5F;
      margin-bottom: 20px;
    }
    
    .approval-row {
      margin-bottom: 25px;
    }
    
    .approval-label {
      font-weight: bold;
      display: inline-block;
      width: 100px;
    }
    
    .approval-line {
      display: inline-block;
      width: 200px;
      border-bottom: 1px solid #333;
      margin-right: 30px;
    }
    
    /* Table of Contents */
    .toc-page {
      page-break-after: always;
    }
    
    .toc-item {
      padding: 8px 0;
      border-bottom: 1px dotted #ccc;
    }
    
    .toc-number {
      font-weight: bold;
      color: #0066CC;
      margin-right: 10px;
    }
    
    /* Content Sections */
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1E3A5F;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0066CC;
    }
    
    .section-number {
      color: #0066CC;
      margin-right: 10px;
    }
    
    .section-content {
      margin-left: 10px;
    }
    
    h2 { font-size: 16pt; color: #1E3A5F; margin-top: 25px; }
    h3 { font-size: 13pt; color: #333; margin-top: 20px; }
    h4 { font-size: 12pt; color: #444; margin-top: 15px; }
    
    p { margin: 10px 0; }
    
    ul, ol {
      margin: 10px 0 10px 25px;
      padding: 0;
    }
    
    li {
      margin: 6px 0;
    }
    
    .placeholder {
      color: #999;
      font-style: italic;
    }
    
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      border: 1px solid #e0e0e0;
    }
    
    th, td {
      border: 1px solid #e0e0e0;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #f8f9fa;
      color: #1E3A5F;
      font-weight: bold;
      border-bottom: 2px solid #0066CC;
    }
    
    tr:nth-child(even) {
      background-color: #fcfcfc;
    }

    strong {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    ${policy.logoUrl ? `<img src="${policy.logoUrl}" alt="Company Logo" class="cover-logo" />` : ''}
    <div class="cover-title">${policy.name}</div>
    <div class="cover-subtitle">${policy.framework || 'Information Security Policy'}</div>
    <div class="cover-divider"></div>
    <div class="cover-client">${policy.clientName}</div>
    ${policy.contactName ? `<div class="cover-contact">${policy.contactName}${policy.contactTitle ? ` - ${policy.contactTitle}` : ''}</div>` : ''}
    ${policy.contactEmail || policy.contactPhone ? `<div class="cover-contact-details">${[policy.contactEmail, policy.contactPhone].filter(Boolean).join(' | ')}</div>` : ''}
    ${policy.address ? `<div class="cover-address">${policy.address.replace(/\n/g, ', ')}</div>` : ''}
    <div class="cover-version">Version ${policy.version}.0</div>
    <div class="cover-status">Status: ${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}</div>
    <div class="cover-date">${new Date(policy.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div class="cover-confidential">
      <div class="cover-confidential-label">CONFIDENTIAL</div>
      <div class="cover-confidential-text">This document contains confidential information. Unauthorized distribution is prohibited.</div>
    </div>
  </div>
  
  <!-- Document Control Page -->
  <div class="doc-control-page">
    <div class="page-title">Document Control</div>
    <table class="control-table">
      <tr><td>Document Title</td><td>${policy.name}</td></tr>
      <tr><td>Document ID</td><td>${policy.templateId || 'POL-' + Date.now()}</td></tr>
      <tr><td>Version</td><td>${policy.version}.0</td></tr>
      <tr><td>Status</td><td>${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}</td></tr>
      <tr><td>Framework</td><td>${policy.framework || 'ISO 27001 / SOC 2'}</td></tr>
      <tr><td>Organization</td><td>${policy.clientName}</td></tr>
      ${policy.contactName ? `<tr><td>Primary Contact</td><td>${policy.contactName}${policy.contactTitle ? ` (${policy.contactTitle})` : ''}</td></tr>` : ''}
      ${policy.contactEmail ? `<tr><td>Contact Email</td><td>${policy.contactEmail}</td></tr>` : ''}
      ${policy.contactPhone ? `<tr><td>Contact Phone</td><td>${policy.contactPhone}</td></tr>` : ''}
      <tr><td>Effective Date</td><td>${new Date(policy.createdAt).toLocaleDateString()}</td></tr>
      <tr><td>Last Review Date</td><td>${new Date(policy.updatedAt).toLocaleDateString()}</td></tr>
      <tr><td>Next Review Date</td><td>${new Date(new Date(policy.updatedAt).setFullYear(new Date(policy.updatedAt).getFullYear() + 1)).toLocaleDateString()}</td></tr>
    </table>
    
    <div class="approval-section">
      <div class="approval-title">Document Approval</div>
      <div class="approval-row">
        <span class="approval-label">Prepared By:</span>
        <span class="approval-line"></span>
        <span>Date: </span>
        <span class="approval-line" style="width: 100px;"></span>
      </div>
      <div class="approval-row">
        <span class="approval-label">Reviewed By:</span>
        <span class="approval-line"></span>
        <span>Date: </span>
        <span class="approval-line" style="width: 100px;"></span>
      </div>
      <div class="approval-row">
        <span class="approval-label">Approved By:</span>
        <span class="approval-line"></span>
        <span>Date: </span>
        <span class="approval-line" style="width: 100px;"></span>
      </div>
    </div>
  </div>
  
  <!-- Table of Contents -->
  <div class="toc-page">
    <div class="page-title">Table of Contents</div>
    ${tocHtml}
  </div>
  
  <!-- Main Content -->
  <div class="content-pages">
    ${sectionsHtml}
  </div>
</body>
</html>`;
}
