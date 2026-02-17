import './env-loader';
import { getDb } from "./packages/core/src/db";
import { clientControls, controls } from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";
import { iso27001Controls } from "./packages/core/src/data/frameworks/iso27001";

async function testGetSoA(clientId: number) {
    console.log(`Testing getSoA for client ${clientId}...`);
    const dbConn = await getDb();

    // 1. Fetch existing
    const existing = await dbConn.select({
        clientControl: clientControls,
        control: controls
    })
        .from(clientControls)
        .innerJoin(controls, eq(clientControls.controlId, controls.id))
        .where(and(
            eq(clientControls.clientId, clientId),
            eq(controls.framework, "ISO 27001:2022")
        ));

    console.log(`Existing count: ${existing.length}`);
    if (existing.length > 0) return;

    // 2. Check global
    const globalControls = await dbConn.select()
        .from(controls)
        .where(eq(controls.framework, "ISO 27001:2022"));

    console.log(`Global count: ${globalControls.length}`);

    if (globalControls.length === 0) {
        console.log("Seeding globals...");
        const toInsert = iso27001Controls.map(c => ({
            controlId: c.id,
            name: c.name,
            description: c.description,
            framework: "ISO 27001:2022",
            category: c.category,
            status: 'active' as const,
            version: 1
        }));
        await dbConn.insert(controls).values(toInsert);
        console.log("Seeding globals done.");
    }

    // Refresh globals
    const globals = await dbConn.select()
        .from(controls)
        .where(eq(controls.framework, "ISO 27001:2022"));

    console.log(`Seeding client assignments (${globals.length})...`);
    const clientBatch = globals.map((c: any) => ({
        clientId: clientId,
        controlId: c.id,
        clientControlId: c.controlId,
        status: 'not_implemented' as const,
        applicability: 'applicable'
    }));

    // Insert in chunks to be safe
    const chunkSize = 20;
    for (let i = 0; i < clientBatch.length; i += chunkSize) {
        process.stdout.write(`.`);
        await dbConn.insert(clientControls).values(clientBatch.slice(i, i + chunkSize));
    }
    console.log("\nSeeding client assignments done.");
    process.exit(0);
}

testGetSoA(1).catch(err => {
    console.error("CRASH:", err);
    process.exit(1);
});
