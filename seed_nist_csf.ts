import dotenv from "dotenv";
dotenv.config({ path: "packages/core/.env" });
import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as schema from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";

// NIST CSF evidence requests to seed
const NIST_CSF_REQUESTS = [
    { id: "REQ-NIST-01", title: "Physical Asset Inventory", description: "Inventory of physical devices and systems (ID.AM-1).", location: "IT" },
    { id: "REQ-NIST-02", title: "Software Asset Inventory", description: "Inventory of software and applications (ID.AM-2).", location: "IT" },
    { id: "REQ-NIST-03", title: "Cybersecurity Policy", description: "Documented organizational information security policy (ID.GV-1).", location: "Governance" },
    { id: "REQ-NIST-04", title: "Maintenance Logs", description: "Evidence of asset maintenance and repair (PR.MA-1).", location: "IT" },
    { id: "REQ-NIST-05", title: "Incident Response Plan", description: "Documented response plan and roles (RS.RP-1).", location: "SecOps" },
    { id: "REQ-NIST-06", title: "Recovery Plan", description: "Processes to restore operations after a disaster (RC.RP-1).", location: "SecOps" },
    { id: "REQ-NIST-07", title: "Continuous Monitoring", description: "Evidence of active network/system monitoring (DE.CM-1).", location: "SecOps" }
];

async function seedNistCsfForClient(clientId: number) {
    const db = await getDb();
    const framework = "NIST CSF";

    console.log(`Seeding ${framework} evidence requests for client ID: ${clientId}...`);

    // Check if evidence requests for this framework already exist
    const existing = await db.select({ evidenceId: schema.evidence.evidenceId }).from(schema.evidence)
        .where(and(
            eq(schema.evidence.clientId, clientId),
            eq(schema.evidence.framework, framework)
        ));

    const existingIds = new Set(existing.map((e: any) => e.evidenceId));
    console.log(`Found ${existingIds.size} existing items for framework ${framework}`);

    // Filter out requests that already exist
    const insertData = NIST_CSF_REQUESTS
        .filter(r => !existingIds.has(r.id))
        .map(r => ({
            clientId: clientId,
            clientControlId: 0,
            evidenceId: r.id,
            description: r.title, // Map title to description as per schema
            type: "file",
            status: "pending",
            owner: "system@complianceos.com",
            location: r.location,
            framework: framework,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

    console.log(`Attempting to insert ${insertData.length} new items`);

    if (insertData.length > 0) {
        await db.insert(schema.evidence).values(insertData as any);
        console.log(`✅ Successfully seeded ${insertData.length} ${framework} evidence requests for client ${clientId}`);
    } else {
        console.log(`ℹ️  ${framework} evidence requests already exist for client ${clientId}`);
    }
}

async function run() {
    try {
        const clientId = parseInt(process.argv[2] || "3");
        await seedNistCsfForClient(clientId);
    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

run();
