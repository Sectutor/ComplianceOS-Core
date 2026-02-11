
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from project root (running from root)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });



const REMOTE_BASE_URL = "https://raw.githubusercontent.com/OWASP/AISVS/main/1.0/en/";

const FILES = [
    { filename: "0x10-C01-Training-Data-Governance.md", order: 1 },
    { filename: "0x10-C02-User-Input-Validation.md", order: 2 },
    { filename: "0x10-C03-Model-Lifecycle-Management.md", order: 3 },
    { filename: "0x10-C04-Infrastructure.md", order: 4 },
    { filename: "0x10-C05-Access-Control-and-Identity.md", order: 5 },
    { filename: "0x10-C06-Supply-Chain.md", order: 6 },
    { filename: "0x10-C07-Model-Behavior.md", order: 7 },
    { filename: "0x10-C08-Memory-Embeddings-and-Vector-Database.md", order: 8 },
    { filename: "0x10-C09-Orchestration-and-Agentic-Action.md", order: 9 },
    { filename: "0x10-C10-Adversarial-Robustness.md", order: 10 },
    { filename: "0x10-C11-Privacy.md", order: 11 },
    { filename: "0x10-C12-Monitoring-and-Logging.md", order: 12 },
    { filename: "0x10-C13-Human-Oversight.md", order: 13 },
];

async function main() {
    console.log("Starting AISVS import...");
    const db = await getDb();

    // 1. Create or Get Framework
    const existingFrameworks = await db.select().from(complianceFrameworks)
        .where(eq(complianceFrameworks.shortCode, "AISVS"));

    let frameworkId: number;

    if (existingFrameworks.length > 0) {
        console.log("Framework 'AISVS' already exists, updating...");
        frameworkId = existingFrameworks[0].id;
    } else {
        console.log("Creating new framework 'AISVS'...");
        const [fw] = await db.insert(complianceFrameworks).values({
            name: "OWASP Artificial Intelligence Security Verification Standard (AISVS)",
            shortCode: "AISVS",
            version: "1.0",
            description: "The AISVS provides a structured checklist to evaluate and verify the security and ethical considerations of AI-driven applications.",
            type: "framework"
        }).returning();
        frameworkId = fw.id;
    }

    // 2. Process Files
    for (const file of FILES) {
        const url = REMOTE_BASE_URL + file.filename;
        console.log(`Fetching ${url}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Failed to fetch ${url}: ${res.statusText}`);
                continue;
            }
            const text = await res.text();

            await processFile(db, frameworkId, file.order, text);

        } catch (error) {
            console.error(`Error processing ${file.filename}:`, error);
        }
    }

    console.log("Import completed.");
    process.exit(0);
}

async function processFile(db: any, frameworkId: number, order: number, content: string) {
    // Extract Phase Name (H1)
    const h1Match = content.match(/^#\s+(.+)$/m);
    const fullPhaseName = h1Match ? h1Match[1].trim() : `Phase ${order}`;
    const phaseName = fullPhaseName;

    console.log(`Processing Phase: ${phaseName}`);

    // Create Phase
    const existingPhases = await db.select().from(implementationPhases)
        .where(and(
            eq(implementationPhases.frameworkId, frameworkId),
            eq(implementationPhases.order, order)
        ));

    let phaseId: number;
    if (existingPhases.length > 0) {
        phaseId = existingPhases[0].id;
        // Update name if needed
        await db.update(implementationPhases)
            .set({ name: phaseName, description: `Requirements for ${phaseName}` })
            .where(eq(implementationPhases.id, phaseId));
    } else {
        const [ph] = await db.insert(implementationPhases).values({
            frameworkId,
            name: phaseName,
            order,
            description: `Requirements for ${phaseName}`
        }).returning();
        phaseId = ph.id;
    }

    // Parse Requirements
    const sections = content.split(/^##\s+/m).slice(1);

    for (const section of sections) {
        const lines = section.split('\n');
        const h2Title = lines[0].trim();

        const tableStartIndex = lines.findIndex(l => l.trim().startsWith('|'));

        if (tableStartIndex === -1) continue;

        const guidanceText = lines.slice(1, tableStartIndex).join('\n').trim();
        const fullGuidance = `**${h2Title}**\n\n${guidanceText}`;

        let rowIdx = tableStartIndex;
        if (lines[rowIdx] && lines[rowIdx].toLowerCase().includes('description')) {
            rowIdx++;
        }
        if (lines[rowIdx] && lines[rowIdx].includes('---')) {
            rowIdx++;
        }

        for (let i = rowIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('|')) continue;

            const parts = line.split('|').map(s => s.trim()).filter(s => s !== '');
            // Simple mapping assumption based on AISVS format:
            // | Identifier | Description | Level | Role |

            if (parts.length < 2) continue;

            const identifier = parts[0].replace(/\*\*/g, '').trim();
            // Basic cleansing of Markdown bold in description if it wraps the whole string
            let description = parts[1];
            if (description.startsWith('**') && description.endsWith('**')) {
                description = description.slice(2, -2);
            }

            // Check existence
            const existingReqs = await db.select().from(frameworkRequirements)
                .where(
                    and(
                        eq(frameworkRequirements.frameworkId, frameworkId),
                        eq(frameworkRequirements.identifier, identifier)
                    )
                );

            if (existingReqs.length > 0) {
                // Update
                await db.update(frameworkRequirements).set({
                    phaseId,
                    title: description.substring(0, 490),
                    description: description,
                    guidance: fullGuidance,
                    mappingTags: ["AISVS", `Level ${parts[2] || '?'}`]
                }).where(eq(frameworkRequirements.id, existingReqs[0].id));
            } else {
                await db.insert(frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier,
                    title: description.substring(0, 490),
                    description: description,
                    guidance: fullGuidance,
                    mappingTags: ["AISVS", `Level ${parts[2] || '?'}`]
                });
            }
        }
    }
}

main().catch(console.error);
