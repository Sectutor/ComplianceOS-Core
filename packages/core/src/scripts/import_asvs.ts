
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from project root (running from root)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const REMOTE_BASE_URL = "https://raw.githubusercontent.com/OWASP/ASVS/v4.0.3/4.0/en/";

const FILES = [
    { filename: "0x10-V1-Architecture.md", order: 1 },
    { filename: "0x11-V2-Authentication.md", order: 2 },
    { filename: "0x12-V3-Session-management.md", order: 3 },
    { filename: "0x12-V4-Access-Control.md", order: 4 },
    { filename: "0x13-V5-Validation-Sanitization-Encoding.md", order: 5 },
    { filename: "0x14-V6-Cryptography.md", order: 6 },
    { filename: "0x15-V7-Error-Logging.md", order: 7 },
    { filename: "0x16-V8-Data-Protection.md", order: 8 },
    { filename: "0x17-V9-Communications.md", order: 9 },
    { filename: "0x18-V10-Malicious-Code.md", order: 10 },
    { filename: "0x19-V11-Business-Logic.md", order: 11 },
    { filename: "0x20-V12-Files-Resources.md", order: 12 },
    { filename: "0x21-V13-API.md", order: 13 },
    { filename: "0x22-V14-Config.md", order: 14 },
];

async function main() {
    console.log("Starting OWASP ASVS 4.0.3 import...");
    const db = await getDb();

    // 1. Create or Get Framework
    const existingFrameworks = await db.select().from(complianceFrameworks)
        .where(eq(complianceFrameworks.shortCode, "ASVS"));

    let frameworkId: number;

    if (existingFrameworks.length > 0) {
        console.log("Framework 'ASVS' already exists, updating...");
        frameworkId = existingFrameworks[0].id;
    } else {
        console.log("Creating new framework 'ASVS'...");
        const [fw] = await db.insert(complianceFrameworks).values({
            name: "OWASP Application Security Verification Standard (ASVS)",
            shortCode: "ASVS",
            version: "4.0.3",
            description: "A standard for web application security controls that provides a basis for testing web application technical security controls and also provides developers with a list of requirements for secure development.",
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

    console.log("ASVS Import completed.");
    process.exit(0);
}

async function processFile(db: any, frameworkId: number, order: number, content: string) {
    // Extract Phase Name (H1)
    const h1Match = content.match(/^#\s+(.+)$/m);
    let fullPhaseName = h1Match ? h1Match[1].trim() : `V${order}`;

    // Cleanup names like "V5: Validation, Sanitization and Encoding" to just the title
    fullPhaseName = fullPhaseName.replace(/^V\d+\s+/, '').replace(/^V\d+:\s+/, '');

    console.log(`Processing Chapter V${order}: ${fullPhaseName}`);

    // Create Phase
    const existingPhases = await db.select().from(implementationPhases)
        .where(and(
            eq(implementationPhases.frameworkId, frameworkId),
            eq(implementationPhases.order, order)
        ));

    let phaseId: number;
    if (existingPhases.length > 0) {
        phaseId = existingPhases[0].id;
        await db.update(implementationPhases)
            .set({ name: fullPhaseName, description: `Requirements for ${fullPhaseName}` })
            .where(eq(implementationPhases.id, phaseId));
    } else {
        const [ph] = await db.insert(implementationPhases).values({
            frameworkId,
            name: fullPhaseName,
            order,
            description: `Requirements for ${fullPhaseName}`
        }).returning();
        phaseId = ph.id;
    }

    // Parse Requirements
    // ASVS uses ## for sections (e.g. ## V2.1 Password Security)
    const sections = content.split(/^##\s+/m).slice(1);

    for (const section of sections) {
        const lines = section.split('\n');
        const h2Title = lines[0].trim();

        const tableStartIndex = lines.findIndex(l => l.trim().startsWith('|'));

        if (tableStartIndex === -1) continue;

        const guidanceText = lines.slice(1, tableStartIndex).join('\n').trim();
        const fullGuidance = `**${h2Title}**\n\n${guidanceText}`;

        let rowIdx = tableStartIndex;
        // Skip header and separator
        if (lines[rowIdx] && (lines[rowIdx].toLowerCase().includes('description') || lines[rowIdx].toLowerCase().includes('requirement'))) {
            rowIdx++;
        }
        if (lines[rowIdx] && lines[rowIdx].includes('---')) {
            rowIdx++;
        }

        for (let i = rowIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('|')) continue;

            const parts = line.split('|').map(s => s.trim()).filter(s => s !== '');
            // ASVS Table: | # | Description | L1 | L2 | L3 | CWE | NIST |

            if (parts.length < 2) continue;

            const identifier = parts[0].replace(/\*\*/g, '').trim();
            let description = parts[1];
            if (description.startsWith('**') && description.endsWith('**')) {
                description = description.slice(2, -2);
            }

            // Clean description (remove links like [C6](...))
            description = description.replace(/\[C\d+\]\(https?:\/\/[^\s\)]+\)/g, '').trim();

            const levelTags = [];
            // parts[2] is L1, parts[3] is L2, parts[4] is L3
            if (parts[2] && parts[2].includes('✓')) levelTags.push("L1");
            if (parts[3] && (parts[3].includes('✓') || parts[3].includes('OS assisted'))) levelTags.push("L2");
            if (parts[4] && (parts[4].includes('✓') || parts[4].includes('HSM'))) levelTags.push("L3");

            const mappingTags = ["ASVS", ...levelTags];
            if (parts[5] && parts[5] !== '' && !parts[5].includes('--')) mappingTags.push(`CWE-${parts[5]}`);

            // Check existence
            const existingReqs = await db.select().from(frameworkRequirements)
                .where(
                    and(
                        eq(frameworkRequirements.frameworkId, frameworkId),
                        eq(frameworkRequirements.identifier, identifier)
                    )
                );

            const title = description.substring(0, 490);

            if (existingReqs.length > 0) {
                await db.update(frameworkRequirements).set({
                    phaseId,
                    title: title,
                    description: description,
                    guidance: fullGuidance,
                    mappingTags: mappingTags
                }).where(eq(frameworkRequirements.id, existingReqs[0].id));
            } else {
                await db.insert(frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier,
                    title: title,
                    description: description,
                    guidance: fullGuidance,
                    mappingTags: mappingTags
                });
            }
        }
    }
}

main().catch(console.error);
