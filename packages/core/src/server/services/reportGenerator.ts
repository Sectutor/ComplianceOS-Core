import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ImageRun,
    LevelFormat
} from "docx";
import * as db from "../../db";
import { roadmapReports } from "../../schema";
import * as fs from "fs/promises";
import * as path from "path";
import { generateAIContent, generateSectionIntro, AIReportContext } from "./reportAI";

// Section identifiers
export type ReportSection =
    | "cover_page"
    | "executive_summary"
    | "strategic_vision"
    | "risk_appetite"
    | "objectives_timeline"
    | "implementation_plan"
    | "resource_allocation"
    | "kpis_metrics"
    | "governance"
    | "appendix"
    | "execution_dashboard"
    | "detailed_task_log";

export interface ReportConfig {
    clientId: number;
    roadmapId?: number;
    implementationPlanId?: number;
    title: string;
    version?: string;
    includedSections: ReportSection[];
    dataSources?: {
        gapAnalysis?: boolean;
        riskAssessment?: boolean;
        controls?: boolean;
        policies?: boolean;
    };
    branding?: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
    };
    generatedBy: number;
}

export interface ReportData {
    client: any;
    roadmap?: any;
    roadmapMilestones?: any[];
    gapAnalysis?: any[];
    riskAssessments?: any[];
    controls?: any[];
    policies?: any[];
    implementationPlan?: any;
    implementationTasks?: any[];
    requirements?: any[]; // Added detailed framework requirements
}

// ... (existing code, handled by context replacement usually, but for replace_file_content I need to be precise. 
// I will target the specific method and interface update separately if needed, but the tool allows contiguous block.
// The interface is at the top, the method is further down.
// I should probably use multi_replace for safety since they are far apart.)
// Wait, the prompt implies I should use multi_replace if non-contiguous.
// I will use multi_replace_file_content.

/**
 * Core Report Generator Service
 * Generates professional DOCX documents from roadmap and compliance data
 */
export class ReportGenerator {
    private config: ReportConfig;
    private data: ReportData;
    private htmlContent: string = "";

    constructor(config: ReportConfig, data: ReportData) {
        this.config = config;
        this.data = data;
        // Initialize HTML structure
        this.htmlContent = "";
    }

    /**
     * Convert text with bullet points (•) to proper Word document paragraphs
     */
    private createBulletedParagraphs(text: string): Paragraph[] {
        const paragraphs: Paragraph[] = [];
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('•')) {
                // This is a bullet point
                const bulletText = trimmedLine.substring(1).trim();
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "• ",
                                bold: true,
                                size: 24
                            }),
                            new TextRun({
                                text: bulletText,
                                size: 24
                            })
                        ],
                        spacing: { before: 100, after: 100 },
                        indent: { left: 720, hanging: 360 } // Indent for bullet points
                    })
                );
            } else if (trimmedLine.match(/^\d+\./)) {
                // This is a numbered list item
                const numberText = trimmedLine;
                paragraphs.push(
                    new Paragraph({
                        text: numberText,
                        spacing: { before: 100, after: 100 },
                        indent: { left: 720, hanging: 360 } // Indent for numbered lists
                    })
                );
            } else if (trimmedLine.endsWith(':')) {
                // This is a heading/subheading
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 },
                    })
                );
            } else if (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length < 50) {
                // This looks like a heading (all caps and not too long)
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                    })
                );
            } else {
                // Regular paragraph
                paragraphs.push(
                    new Paragraph({
                        text: trimmedLine,
                        spacing: { before: 100, after: 100 },
                    })
                );
            }
        }

        return paragraphs;
    }

    /**
     * Create a professional paragraph with proper spacing
     */
    private createProfessionalParagraph(text: string, isHeading: boolean = false): Paragraph {
        if (isHeading) {
            return new Paragraph({
                text: text,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
            });
        }

        return new Paragraph({
            text: text,
            spacing: { before: 100, after: 100 },
        });
    }

    /**
     * Parse rich task description into structured object
     */
    private parseTaskDescription(description: string): Record<string, string[]> {
        const sections: Record<string, string[]> = {};

        if (!description) return sections;

        // If no markdown headers, treat whole description as summary
        if (!description.includes('**')) {
            sections['Summary'] = [description];
            return sections;
        }

        const parts = description.split('**');
        let currentHeader = 'Summary';

        parts.forEach((part, i) => {
            if (i === 0 && !part.trim()) return;

            // Check if part corresponds to a known header key
            const isHeader = ['Key Activities:', 'Deliverables:', 'Estimated Duration:', 'Tips:'].some(h => part.trim() === h || part.trim() === h.replace(':', ''));

            if (isHeader) {
                currentHeader = part.replace(':', '').trim();
            } else {
                // It's content
                const lines = part.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0)
                    .map(l => l.replace(/^- /, '')); // Remove bullet dash if present

                if (lines.length > 0) {
                    sections[currentHeader] = lines;
                }
            }
        });

        return sections;
    }

    /**
     * Generate the complete DOCX document
     */
    async generate(): Promise<Buffer> {
        console.log("DEBUG [ReportGenerator.generate]: Starting report generation");
        console.log("DEBUG [ReportGenerator.generate]: Included sections:", this.config.includedSections);

        const sections: (Paragraph | Table)[] = [];

        // Always include cover page
        console.log("DEBUG [ReportGenerator.generate]: Generating cover page");
        sections.push(...this.generateCoverPage());

        // Generate selected sections (now async)
        for (const sectionId of this.config.includedSections) {
            console.log("DEBUG [ReportGenerator.generate]: Generating section:", sectionId);
            const sectionContent = await this.generateSection(sectionId);
            console.log("DEBUG [ReportGenerator.generate]: Section", sectionId, "has", sectionContent.length, "paragraphs");
            sections.push(...sectionContent);
        }

        console.log("DEBUG [ReportGenerator.generate]: Total paragraphs:", sections.length);

        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: sections,
            }],
        });

        // Convert to buffer
        console.log("DEBUG [ReportGenerator.generate]: Creating DOCX buffer");
        const buffer = await Packer.toBuffer(doc);
        console.log("DEBUG [ReportGenerator.generate]: Buffer created, size:", buffer.length, "bytes");
        return buffer;
    }

    /**
     * Generate a specific section
     */
    private async generateSection(sectionId: ReportSection): Promise<(Paragraph | Table)[]> {
        switch (sectionId) {
            case "cover_page":
                return this.generateCoverPage();
            case "executive_summary":
                return await this.generateExecutiveSummary();
            case "strategic_vision":
                return await this.generateStrategicVision();
            case "risk_appetite":
                return await this.generateRiskAppetite();
            case "objectives_timeline":
                return await this.generateObjectivesTimeline();
            case "implementation_plan":
                return await this.generateImplementationPlan();
            case "resource_allocation":
                return await this.generateResourceAllocation();
            case "kpis_metrics":
                return this.generateKPIsMetrics();
            case "governance":
                return await this.generateGovernance();
            case "appendix":
                return this.generateAppendix();
            case "execution_dashboard":
                return await this.generateExecutionDashboard();
            case "detailed_task_log":
                return this.generateDetailedTaskLog();
            default:
                return [];
        }
    }

    /**
     * SECTION GENERATORS
     */

    private generateCoverPage(): (Paragraph | Table)[] {
        const { client } = this.data;
        const { title } = this.config;
        const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        const versionStr = `Version: ${this.config.version || "Draft"}`;

        this.htmlContent += `
            <div style="text-align: center; padding: 50px 0; border-bottom: 2px solid #eee; margin-bottom: 40px;">
                <h1 style="font-size: 32px; color: #1a202c; margin-bottom: 20px; font-weight: bold;">${title}</h1>
                <h2 style="font-size: 24px; color: #4a5568; margin-bottom: 40px; font-weight: normal;">${client?.name || "Client Name"}</h2>
                <p style="font-size: 16px; color: #718096; margin-bottom: 10px;">${dateStr}</p>
                <p style="font-size: 14px; color: #a0aec0;">${versionStr}</p>
            </div>
        `;

        return [
            new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            new Paragraph({
                text: client?.name || "Client Name",
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            }),
            new Paragraph({
                text: dateStr,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            new Paragraph({
                text: versionStr,
                alignment: AlignmentType.CENTER,
            }),
        ];
    }

    private async generateExecutiveSummary(): Promise<(Paragraph | Table)[]> {
        const aiSummary = (this.data as any).aiExecutiveSummary;
        const summaryText = aiSummary || "[Executive Summary - AI generation pending]";

        // Generate HTML
        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    ${summaryText.replace(/\n/g, '<br/>')}
                </div>
            </section>
        `;

        const paragraphs = [
            new Paragraph({
                text: "Executive Summary",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        // Use professional formatting for executive summary
        const summaryParagraphs = this.createBulletedParagraphs(summaryText);
        paragraphs.push(...summaryParagraphs);

        return paragraphs;
    }

    private async generateStrategicVision(): Promise<(Paragraph | Table)[]> {
        const { roadmap, client } = this.data;

        // Generate AI Intro
        const intro = await generateSectionIntro("strategic_vision", { client, roadmap });

        // Use basic vision content without AI for now
        let visionContent = roadmap?.vision || "Strategic vision not defined.";

        // Add basic context if available
        if (client && roadmap) {
            const riskCount = this.data.riskAssessments?.length || 0;
            const controlCount = this.data.controls?.length || 0;
            const policyCount = this.data.policies?.length || 0;

            visionContent = `${roadmap.vision || "Strategic vision not defined."}

Business Context:
• Client: ${client.name}
• Industry: ${client.industry || "Not specified"}
• Framework: ${roadmap.framework || "Not specified"}
• Risks Identified: ${riskCount}
• Controls: ${controlCount}
• Policies: ${policyCount} `;
        }

        // Generate HTML
        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Strategic Vision & Business Context</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}
                    ${visionContent.replace(/\n/g, '<br/>')}
                </div>
            </section>
        `;

        const paragraphs = [
            new Paragraph({
                text: "Strategic Vision & Business Context",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { before: 100, after: 200 },
                })
            );
        }

        // Use professional formatting for vision content
        const visionParagraphs = this.createBulletedParagraphs(visionContent);
        paragraphs.push(...visionParagraphs);

        return paragraphs;
    }

    private async generateRiskAppetite(): Promise<(Paragraph | Table)[]> {
        const { roadmap, client } = this.data;

        // Generate AI Intro
        const intro = await generateSectionIntro("risk_appetite", { client, roadmap });

        const totalRisks = this.data.riskAssessments?.length || 0;
        const highRisks = (this.data.riskAssessments || []).filter((r: any) => r.inherentRisk === 'High' || r.inherentRisk === 'Very High').length;
        const implementedControls = (this.data.controls || []).filter((c: any) => c.status === 'implemented').length;
        const totalControls = (this.data.controls || []).length;
        const completionRate = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;

        const riskContent = `Risk Analysis Summary:
• Total Risks Identified: ${totalRisks}
• High / Critical Risks: ${highRisks}
• Controls Implemented: ${implementedControls} of ${totalControls}
• Implementation Rate: ${totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0}%

    Compliance Drivers:
1. Regulatory Requirements: ${roadmap?.framework || "Industry standards"}
2. Business Objectives: ${roadmap?.objectives?.join(", ") || "Not specified"}
3. Risk Mitigation: Focus on ${highRisks} high - priority risks
4. Control Implementation: Achieve target compliance through control deployment

Risk Appetite Statement:
The organization should maintain a moderate risk appetite, focusing on mitigating critical risks while implementing essential controls to achieve compliance with ${roadmap?.framework || "relevant frameworks"}.`;

        // Generate HTML
        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Risk Appetite & Compliance Drivers</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}
                    ${riskContent.replace(/\n/g, '<br/>')}
                </div>
            </section>
        `;

        const paragraphs = [
            new Paragraph({
                text: "Risk Appetite & Compliance Drivers",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { before: 100, after: 200 },
                })
            );
        }

        // Use professional formatting for risk content
        const riskParagraphs = this.createBulletedParagraphs(riskContent);
        paragraphs.push(...riskParagraphs);

        return paragraphs;
    }

    private async generateObjectivesTimeline(): Promise<(Paragraph | Table)[]> {
        const { roadmap, client } = this.data;

        // Generate AI Intro
        const intro = await generateSectionIntro("objectives_timeline", { client, roadmap });

        const objectives = roadmap?.objectives || ["Compliance Achievement", "Risk Reduction"];
        const milestones = this.data.roadmapMilestones || [];

        // Generate HTML
        let html = `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Key Objectives & Milestones Timeline</h2>
                
                ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}

                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 18px; color: #2d3748; margin-bottom: 15px;">Strategic Objectives</h3>
                    <ul style="padding-left: 20px; color: #4a5568;">
                        ${objectives.map((obj: string) => `<li style="margin-bottom: 10px;">${obj}</li>`).join('')}
                    </ul>
                </div>

                <div>
                    <h3 style="font-size: 18px; color: #2d3748; margin-bottom: 15px;">Target Timeline</h3>
                    <div style="border-left: 2px solid #e2e8f0; padding-left: 20px;">
        `;

        milestones.forEach((milestone: any) => {
            html += `
                        <div style="margin-bottom: 20px; position: relative;">
                            <div style="position: absolute; left: -25px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: #4299e1;"></div>
                            <div style="font-weight: bold; color: #2d3748;">${milestone.title}</div>
                            <div style="font-size: 14px; color: #718096;">Target: ${new Date(milestone.targetDate).toLocaleDateString()}</div>
                            <div style="color: #4a5568;">${milestone.description || ""}</div>
                        </div>
            `;
        });

        html += `
                    </div>
                </div>
            </section>
        `;

        this.htmlContent += html;

        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Key Objectives & Milestones Timeline",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { before: 100, after: 200 },
                })
            );
        }

        paragraphs.push(
            new Paragraph({
                text: "Strategic Objectives",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            })
        );

        // Create proper bullet points for objectives
        objectives.forEach((obj: string) => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "• ",
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: obj,
                            size: 24
                        })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: 720, hanging: 360 }
                })
            );
        });

        paragraphs.push(
            new Paragraph({
                text: "Target Timeline",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );

        milestones.forEach((milestone: any) => {
            paragraphs.push(
                new Paragraph({
                    text: `${milestone.title} (${new Date(milestone.targetDate).toLocaleDateString()})`,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 150, after: 50 },
                }),
                new Paragraph({
                    text: milestone.description || "",
                    spacing: { before: 50, after: 150 },
                })
            );
        });

        return paragraphs;
    }


    private async generateImplementationPlan(): Promise<(Paragraph | Table)[]> {
        const { implementationPlan, client, roadmap, requirements, implementationTasks } = this.data;

        // Generate AI Intro
        const intro = await generateSectionIntro("implementation_plan", { client, roadmap });

        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Implementation Plan",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { after: 200 },
                })
            );
        }

        const phases = implementationPlan?.phases || [];

        // Helper to process text arrays into paragraphs for cells
        const listToParagraphs = (items: string[]) => {
            return items.map(item => new Paragraph({
                text: item.replace(/^- /, ''), // clean bullets
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 }
            }));
        };

        const createHeaderCell = (text: string, widthPct: number) => {
            return new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
                    alignment: AlignmentType.LEFT,
                })],
                width: { size: widthPct, type: WidthType.PERCENTAGE },
                shading: { fill: "000000" }, // Black background
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
            });
        };

        // Combine Requirements and Custom Tasks
        // We will try to group everything by Phase
        for (const phase of phases) {
            const phaseReqs = requirements ? requirements.filter((r: any) => r.phaseId === phase.id) : [];

            // Match custom tasks to this phase
            // Strategy: Match by PDCA or NIST tags if available, or if the phase name matches
            const phaseTasks = (implementationTasks || []).filter((t: any) => {
                // If the task is already linked to a requirement in this phase, skip it to avoid duplicates (future enhancement: merge them)
                // For now, allow both if they exist, but ideally tasks shouldn't replicate reqs exactly.

                // Match by PDCA
                if (t.pdca && phase.name.toLowerCase().includes(t.pdca.toLowerCase())) return true;
                // Match by NIST
                if (t.nist && phase.name.toLowerCase().includes(t.nist.toLowerCase())) return true;

                // Fallback: If phase doesn't have specific tags, maybe check if task status matches phase intent
                return false;
            });

            // If no items at all for this phase, skip
            if (phaseReqs.length === 0 && phaseTasks.length === 0) continue;

            // Add Phase Header
            paragraphs.push(
                new Paragraph({
                    text: `Phase ${phase.name} (${phase.duration || "TBD"})`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 100 },
                }),
                new Paragraph({
                    text: phase.description || "Focus on preparation, gap analysis, and planning.",
                    spacing: { after: 200 },
                })
            );

            // Create Table Header
            const headerRow = new TableRow({
                children: [
                    createHeaderCell("Step / Task", 25),
                    createHeaderCell("Key Activities / Description", 30),
                    createHeaderCell("Deliverables", 25),
                    createHeaderCell("Timelines & Status", 20),
                ],
                tableHeader: true,
            });

            const rows: TableRow[] = [headerRow];

            // Render Requirements
            phaseReqs.forEach((req: any) => {
                const parsed = this.parseTaskDescription(req.description || "");
                const guidanceParsed = this.parseTaskDescription(req.guidance || "");

                const activities = parsed['Key Activities'] || parsed['Summary'] || [];
                const deliverables = parsed['Deliverables'] || [];
                const duration = parsed['Estimated Duration'] || parsed['Duration'] || ["TBD"];
                const tips = parsed['Tips'] || guidanceParsed['Tips'] || [];

                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: req.title, bold: true })] }),
                                new Paragraph({ text: req.identifier || "", spacing: { before: 50 }, style: "Succinct" })
                            ],
                            width: { size: 25, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: listToParagraphs(activities),
                            width: { size: 30, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: listToParagraphs(deliverables),
                            width: { size: 25, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "Standard Req", size: 16, color: "718096" })] }),
                                new Paragraph({ children: [new TextRun({ text: "Est: " + duration.join(", ") })] })
                            ],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                    ]
                }));
            });

            // Render Custom Tasks
            phaseTasks.forEach((t: any) => {
                const parsed = this.parseTaskDescription(t.description || "");

                // If description is just text, use it as activity
                const activities = parsed['Key Activities'] || parsed['Summary'] || (t.description ? [t.description] : ["No description"]);
                const deliverables = parsed['Deliverables'] || (t.deliverables as string[]) || [];

                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: t.title, bold: true })] }),
                                new Paragraph({ 
                                    children: [new TextRun({ text: `Task ID: ${t.id}`, size: 16, color: "718096" })],
                                    spacing: { before: 50 }
                                })
                            ],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            shading: { fill: "F7FAFC" } // Slight tint to distinguish user tasks
                        }),
                        new TableCell({
                            children: listToParagraphs(activities),
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: "F7FAFC" }
                        }),
                        new TableCell({
                            children: listToParagraphs(deliverables),
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            shading: { fill: "F7FAFC" }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: `Status: ${t.status?.replace('_', ' ')}`, bold: true })] }),
                                new Paragraph({ text: t.assigneeId ? `Assigned` : "Unassigned" })
                            ],
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            shading: { fill: "F7FAFC" }
                        }),
                    ]
                }));
            });

            // Add table to sections
            paragraphs.push(
                new Table({
                    rows: rows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                    }
                })
            );

            // Add spacer
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));

            // Generate HTML for the preview (Append to this.htmlContent)
            // Note: In the real implementation, we should sync this logic. 
            // For now, I will append a simplified HTML version to ensure the preview matches roughly.
            this.addToHtml(phase, phaseReqs, phaseTasks);
        }

        return paragraphs;
    }

    private addToHtml(phase: any, reqs: any[], tasks: any[]) {
        let html = `
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #2d3748; margin-bottom: 15px; font-weight: bold;">Phase ${phase.name}</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0;">
                    <thead style="background: #000; color: #fff;">
                        <tr>
                            <th style="padding: 10px; text-align: left;">Step / Task</th>
                            <th style="padding: 10px; text-align: left;">Details</th>
                            <th style="padding: 10px; text-align: left;">Deliverables</th>
                            <th style="padding: 10px; text-align: left;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const renderRow = (title: string, subtitle: string, activities: string[], deliverables: string[], status: string, isTask: boolean) => `
             <tr style="border-bottom: 1px solid #edf2f7; background-color: ${isTask ? '#f7fafc' : '#ffffff'};">
                <td style="padding: 12px; vertical-align: top; width: 25%;">
                    <strong>${title}</strong><br/><span style="font-size: 12px; color: #718096;">${subtitle}</span>
                </td>
                <td style="padding: 12px; vertical-align: top; width: 30%;">
                    <ul style="padding-left: 15px; margin: 0;">${activities.map(a => `<li>${a.replace(/^- /, '')}</li>`).join('')}</ul>
                </td>
                <td style="padding: 12px; vertical-align: top; width: 25%;">
                    <ul style="padding-left: 15px; margin: 0;">${deliverables.map(d => `<li>${d.replace(/^- /, '')}</li>`).join('')}</ul>
                </td>
                <td style="padding: 12px; vertical-align: top; width: 20%;">
                    <strong>${status}</strong>
                    ${isTask ? '' : '<br/><span style="font-size: 12px; color: #718096;">Standard Req</span>'}
                </td>
            </tr>
        `;

        reqs.forEach((r: any) => {
            const parsed = this.parseTaskDescription(r.description || "");
            // Activities
            const acts = parsed['Key Activities'] || parsed['Summary'] || [];
            const dels = parsed['Deliverables'] || [];
            html += renderRow(r.title, r.identifier, acts, dels, "Standard", false);
        });

        tasks.forEach((t: any) => {
            const parsed = this.parseTaskDescription(t.description || "");
            const acts = parsed['Key Activities'] || parsed['Summary'] || (t.description ? [t.description] : []);
            const dels = parsed['Deliverables'] || (t.deliverables as string[]) || [];
            html += renderRow(t.title, `Task ID: ${t.id}`, acts, dels, t.status?.replace('_', ' ') || 'Pending', true);
        });

        html += `</tbody></table></div>`;

        // Append to main HTML content (careful not to duplicate header)
        // Since we are iterating phases, we assume the header was added once before the loop? 
        // No, the original code added header inside generateImplementationPlan.
        // I need to ensure the header is added only once or handled properly.
        // My replacement function includes the full loop, so I'll handle it.

        // Hack: Append to class property
        this.htmlContent += html;
    }

    private async generateResourceAllocation(): Promise<(Paragraph | Table)[]> {
        const { client, roadmap } = this.data;
        const intro = await generateSectionIntro("resource_allocation", { client, roadmap });
        const content = "Resource allocation details..."; // Placeholder or actual data logic

        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Resource Allocation</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}
                    ${content}
                </div>
            </section>
        `;

        const paragraphs = [
            new Paragraph({
                text: "Resource Allocation",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { after: 200 },
                })
            );
        }

        paragraphs.push(new Paragraph({ text: content }));
        return paragraphs;
    }

    private generateKPIsMetrics(): (Paragraph | Table)[] {
        const { roadmap } = this.data;
        const kpis = roadmap?.kpiTargets || [];

        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: "KPIs & Success Metrics",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            }),
        ];

        // Generate HTML
        let kpisHtml = "";
        kpis.forEach((kpi: any) => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "• ",
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: `${kpi.name}: ${kpi.target}${kpi.unit}`,
                            size: 24
                        })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: 720, hanging: 360 }
                })
            );
            kpisHtml += `<li style="margin-bottom: 8px;"><strong>${kpi.name}</strong>: ${kpi.target}${kpi.unit}</li>`;
        });

        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">KPIs & Success Metrics</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    <ul>${kpisHtml}</ul>
                </div>
            </section>
        `;

        return paragraphs;
    }

    private async generateGovernance(): Promise<(Paragraph | Table)[]> {
        const { client, roadmap } = this.data;
        const intro = await generateSectionIntro("governance", { client, roadmap });
        const content = "Governance structure details...";

        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Governance</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                    ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}
                    ${content}
                </div>
            </section>
        `;

        const paragraphs = [
            new Paragraph({
                text: "Governance",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { after: 200 },
                })
            );
        }

        paragraphs.push(new Paragraph({ text: content }));
        return paragraphs;
    }

    private generateAppendix(): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Appendix",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            }),
        ];

        // Add data sources if selected
        if (this.config.dataSources?.gapAnalysis && this.data.gapAnalysis) {
            paragraphs.push(
                new Paragraph({
                    text: "Gap Analysis Results",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                })
            );
        }

        if (this.config.dataSources?.riskAssessment && this.data.riskAssessments) {
            paragraphs.push(
                new Paragraph({
                    text: "Risk Assessment Findings",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                })
            );
        }

        // Generate HTML
        let appendixHtml = "";
        if (this.config.dataSources?.gapAnalysis && this.data.gapAnalysis) {
            appendixHtml += `<h3>Gap Analysis Results</h3><p>Detailed gap analysis findings included in full report.</p>`;
        }
        if (this.config.dataSources?.riskAssessment && this.data.riskAssessments) {
            appendixHtml += `<h3>Risk Assessment Findings</h3><p>Detailed risk assessment findings included in full report.</p>`;
        }

        if (appendixHtml) {
            this.htmlContent += `
                <section style="margin-bottom: 40px;">
                    <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Appendix</h2>
                    <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                        ${appendixHtml}
                    </div>
                </section>
            `;
        }

        return paragraphs;
    }

    private async generateExecutionDashboard(): Promise<(Paragraph | Table)[]> {
        const { implementationPlan, implementationTasks, client, roadmap } = this.data;

        // Generate AI Intro
        const intro = await generateSectionIntro("execution_dashboard", { client, roadmap });

        const tasks = implementationTasks || [];

        const total = tasks.length;
        const done = tasks.filter((t: any) => t.status === 'done').length;
        const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
        const blocked = tasks.filter((t: any) => t.status === 'blocked').length;
        const backlog = tasks.filter((t: any) => t.status === 'backlog' || t.status === 'todo').length;

        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

        // Generate HTML
        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Execution Dashboard</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #4a5568;">
                     ${intro ? `<p style="margin-bottom: 20px; font-style: italic; color: #2d3748;">${intro}</p>` : ''}
                     <h3 style="font-size: 20px; color: #2d3748; margin-bottom: 15px;">Project Status: ${completionRate}% Complete</h3>
                     <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <th style="background-color: #f3f4f6; padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Total Tasks</th>
                            <th style="background-color: #d1fae5; padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Completed</th>
                            <th style="background-color: #dbeafe; padding: 10px; border: 1px solid #e5e7eb; text-align: left;">In Progress</th>
                            <th style="background-color: #fee2e2; padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Blocked</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 18px; font-weight: bold;">${total}</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 18px; font-weight: bold;">${done}</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 18px; font-weight: bold;">${inProgress}</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 18px; font-weight: bold;">${blocked}</td>
                        </tr>
                     </table>
                </div>
            </section>
        `;

        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Execution Dashboard",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        ];

        if (intro) {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: intro, italics: true })],
                    spacing: { after: 200 },
                })
            );
        }

        paragraphs.push(
            new Paragraph({
                text: `Project Status: ${completionRate}% Complete`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 },
            }),
            // Metric Grid
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "Total Tasks", alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
                            new TableCell({ children: [new Paragraph({ text: "Completed", alignment: AlignmentType.CENTER })], shading: { fill: "D1FAE5" } }),
                            new TableCell({ children: [new Paragraph({ text: "In Progress", alignment: AlignmentType.CENTER })], shading: { fill: "DBEAFE" } }),
                            new TableCell({ children: [new Paragraph({ text: "Blocked", alignment: AlignmentType.CENTER })], shading: { fill: "FEE2E2" } }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: String(total), alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_3 })] }),
                            new TableCell({ children: [new Paragraph({ text: String(done), alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_3 })] }),
                            new TableCell({ children: [new Paragraph({ text: String(inProgress), alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_3 })] }),
                            new TableCell({ children: [new Paragraph({ text: String(blocked), alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_3 })] }),
                        ],
                    })
                ]
            }),
            new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer
        );
        return paragraphs;
    }

    private generateDetailedTaskLog(): (Paragraph | Table)[] {
        const { implementationTasks } = this.data;
        const tasks = implementationTasks || [];

        // Group by Status
        const statusGroups = ['in_progress', 'todo', 'backlog', 'blocked', 'done'];
        const groupedTasks: Record<string, any[]> = {};

        statusGroups.forEach(status => {
            groupedTasks[status] = tasks.filter((t: any) => t.status === status);
        });

        const content: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Detailed Task Log",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            }),
        ];

        let logHtml = `<h2 style="font-size: 24px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Detailed Task Log</h2>`;

        statusGroups.forEach(status => {
            const groupTasks = groupedTasks[status];
            if (groupTasks.length > 0) {
                content.push(
                    new Paragraph({
                        text: status.replace('_', ' ').toUpperCase(),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 },
                    })
                );

                logHtml += `<h3 style="font-size: 18px; color: #4a5568; margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; display: inline-block;">${status.replace('_', ' ').toUpperCase()}</h3>`;

                // For each task, create a detailed block
                groupTasks.forEach((t: any) => {
                    const parsedDesc = this.parseTaskDescription(t.description || "");

                    // Create Task Header Row
                    const taskHeader = new Paragraph({
                        children: [
                            new TextRun({ text: `${t.title}`, bold: true, size: 24 }),
                            new TextRun({ text: ` (ID: ${t.id})`, size: 20, color: "718096" })
                        ],
                        spacing: { before: 200, after: 50 },
                        border: { bottom: { color: "E2E8F0", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    });
                    content.push(taskHeader);

                    logHtml += `
                        <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc;">
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${t.title} <span style="font-weight: normal; font-size: 12px; color: #718096;">(ID: ${t.id})</span></div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    `;

                    // Helper to generate formatted content section
                    const generateSection = (title: string, items: string[] | undefined, color: string = "dark") => {
                        if (!items || items.length === 0) return null;

                        // HTML Output
                        logHtml += `<div><h4 style="font-size: 12px; text-transform: uppercase; color: #4a5568; margin-bottom: 5px; font-weight: bold;">${title}</h4><ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4a5568;">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;

                        // DOCX Output
                        return [
                            new Paragraph({
                                text: title.toUpperCase(),
                                spacing: { before: 100, after: 50 },
                                border: { bottom: { color: "CBD5E0", space: 1, style: BorderStyle.DOTTED, size: 4 } }
                            }),
                            ...items.map(item => new Paragraph({
                                children: [
                                    new TextRun({ text: "• ", bold: true }),
                                    new TextRun({ text: item })
                                ],
                                indent: { left: 360, hanging: 360 },
                                spacing: { before: 40, after: 40 }
                            }))
                        ];
                    };

                    // Add Sections
                    const activities = generateSection("Key Activities", parsedDesc['Key Activities']);
                    if (activities) content.push(...activities);

                    const deliverables = generateSection("Deliverables", parsedDesc['Deliverables']);
                    if (deliverables) content.push(...deliverables);

                    const duration = generateSection("Estimated Duration", parsedDesc['Estimated Duration']);
                    if (duration) content.push(...duration);

                    const tips = generateSection("Tips", parsedDesc['Tips']);
                    if (tips) {
                        logHtml += `</div><div style="margin-top: 15px; background: #ebf8ff; padding: 10px; border-radius: 4px;"><h4 style="font-size: 12px; text-transform: uppercase; color: #2b6cb0; margin-bottom: 5px; font-weight: bold;">Professional Tips</h4><p style="margin: 0; font-size: 13px; color: #2c5282;">${parsedDesc['Tips'].join(' ')}</p></div>`;

                        content.push(
                            new Paragraph({
                                text: "PROFESSIONAL TIPS",
                                spacing: { before: 100, after: 50 },
                                shading: { fill: "EBF8FF" }
                            }),
                            ...parsedDesc['Tips'].map(tip => new Paragraph({
                                children: [new TextRun({ text: tip, italics: true })],
                                spacing: { before: 40, after: 40 },
                                shading: { fill: "EBF8FF" },
                            }))
                        );
                    } else {
                        logHtml += `</div>`;
                    }

                    logHtml += `</div>`;

                    // Add Summary if no specific sections found but description exists
                    if (Object.keys(parsedDesc).length === 1 && parsedDesc['Summary']) {
                        content.push(
                            new Paragraph({
                                text: parsedDesc['Summary'][0],
                                spacing: { before: 100, after: 100 }
                            })
                        );
                        logHtml += `<p style="margin-top: 10px; font-size: 14px; color: #4a5568;">${parsedDesc['Summary'][0]}</p></div>`;
                    }

                    content.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer between tasks
                });
            }
        });

        this.htmlContent += `
            <section style="margin-bottom: 40px;">
                <div style="font-size: 14px; line-height: 1.6; color: #4a5568;">
                    ${logHtml}
                </div>
            </section>
        `;

        return content;
    }

    /**
     * Save the generated report to database and file system
     */
    async saveReport(buffer: Buffer): Promise<number> {
        const fileName = `roadmap-report-${Date.now()}.docx`;
        const filePath = path.join("uploads", "reports", fileName);

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Write file
        await fs.writeFile(filePath, buffer);

        // Save metadata to database
        const dbConn = await db.getDb();
        const [report] = await dbConn.insert(roadmapReports).values({
            roadmapId: this.config.roadmapId,
            clientId: this.config.clientId,
            title: this.config.title,
            version: this.config.version || "draft",
            includedSections: this.config.includedSections,
            dataSources: this.config.dataSources,
            branding: this.config.branding,
            filePath,
            fileSize: buffer.length,
            content: this.htmlContent, // Save HTML content
            generatedBy: this.config.generatedBy,
        }).returning();

        return report.id;
    }
}

/**
 * Helper function to generate a report
 */
export async function generateRoadmapReport(
    config: ReportConfig,
    data: ReportData
): Promise<{ reportId: number; buffer: Buffer }> {
    try {
        console.log("DEBUG [generateRoadmapReport]: Creating ReportGenerator");
        const generator = new ReportGenerator(config, data);

        console.log("DEBUG [generateRoadmapReport]: Generating report content");
        const buffer = await generator.generate();

        console.log("DEBUG [generateRoadmapReport]: Report buffer size:", buffer.length, "bytes");

        console.log("DEBUG [generateRoadmapReport]: Saving report to database");
        const reportId = await generator.saveReport(buffer);

        console.log("DEBUG [generateRoadmapReport]: Report saved with ID:", reportId);
        return { reportId, buffer };
    } catch (error) {
        console.error("Error generating roadmap report:", error);
        throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
    }
}
