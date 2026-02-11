import { getDb } from "../db";
import { complianceFrameworks, frameworkRequirements, controls, implementationPhases } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function promote(shortCode: string) {
    console.log(`Promoting ${shortCode} Requirements to Master Controls...`);
    const db = await getDb();

    // 1. Get Framework ID
    const [fw] = await db.select().from(complianceFrameworks)
        .where(eq(complianceFrameworks.shortCode, shortCode));

    if (!fw) {
        console.error(`${shortCode} framework not found. Run import script first.`);
        return;
    }

    console.log(`Found Framework: ${fw.name} (ID: ${fw.id})`);

    // 2. Fetch Requirements with Phase Info
    const reqs = await db.select({
        req: frameworkRequirements,
        phaseName: implementationPhases.name
    })
        .from(frameworkRequirements)
        .leftJoin(implementationPhases, eq(frameworkRequirements.phaseId, implementationPhases.id))
        .where(eq(frameworkRequirements.frameworkId, fw.id));

    console.log(`Found ${reqs.length} requirements.`);

    // 3. Upsert into Controls
    let added = 0;
    let updated = 0;

    for (const { req, phaseName } of reqs) {
        const existing = await db.select().from(controls)
            .where(and(
                eq(controls.controlId, req.identifier),
                eq(controls.framework, shortCode)
            ));

        const controlData = {
            controlId: req.identifier,
            name: (req.title || req.identifier).substring(0, 255),
            description: req.description,
            framework: shortCode,
            status: "active" as const,
            evidenceType: "Document",
            frequency: "Annual",
            implementationGuidance: req.guidance,
            category: phaseName || "General"
        };

        if (existing.length > 0) {
            await db.update(controls)
                .set(controlData)
                .where(eq(controls.id, existing[0].id));
            updated++;
        } else {
            await db.insert(controls).values(controlData);
            added++;
        }
    }

    console.log(`Promotion Complete for ${shortCode}: ${added} added, ${updated} updated.`);
}

async function main() {
    const shortCode = process.argv[2] || "ASVS";
    await promote(shortCode);
    process.exit(0);
}

main().catch(console.error);
