
import { getDb } from "../db";
import { complianceFrameworks, frameworkRequirements, controls } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    console.log("Promoting AISVS Requirements to Master Controls...");
    const db = await getDb();

    // 1. Get Framework ID
    const [fw] = await db.select().from(complianceFrameworks)
        .where(eq(complianceFrameworks.shortCode, "AISVS"));

    if (!fw) {
        console.error("AISVS framework not found. Run import_aisvs.ts first.");
        process.exit(1);
    }

    console.log(`Found Framework: ${fw.name} (ID: ${fw.id})`);

    // 2. Fetch Requirements
    const reqs = await db.select().from(frameworkRequirements)
        .where(eq(frameworkRequirements.frameworkId, fw.id));

    console.log(`Found ${reqs.length} requirements.`);

    // 3. Upsert into Controls
    let added = 0;
    let updated = 0;

    for (const req of reqs) {
        // Check if control exists by (controlId + framework)
        // Since controlId is not unique globally, but we scope by framework string in `controls` table.

        // Note: `controls` table has `framework` column as string.
        const existing = await db.select().from(controls)
            .where(and(
                eq(controls.controlId, req.identifier),
                eq(controls.framework, "AISVS")
            ));

        const controlData = {
            controlId: req.identifier,
            name: (req.title || req.identifier).substring(0, 255), // Fallback and truncate to 255 chars
            description: req.description,
            framework: "AISVS",

            status: "active" as const, // Cast to enum type if needed, or string literal
            evidenceType: "Document",
            frequency: "Annual",
            implementationGuidance: req.guidance
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

    console.log(`Use 'AISVS' as framework name.`);
    console.log(`Sync Complete: ${added} added, ${updated} updated.`);
    process.exit(0);
}

main().catch(console.error);
