
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MASTG_DATA = {
    shortCode: "MASTG",
    name: "OWASP MASTG (Mobile Security Testing Guide)",
    description: "A comprehensive manual for mobile app security testing and reverse engineering.",
    version: "1.5",
    type: "Security / Mobile Testing",
    domains: [
        {
            name: "V2: Data Storage Testing",
            description: "Testing for insecure data storage on Android and iOS.",
            controls: [
                { id: "MASTG-STORAGE-1", title: "Shared Preferences/User Defaults", description: "Verify that sensitive data is not stored in plain text in local storage." },
                { id: "MASTG-STORAGE-2", title: "SQLite Database Encryption", description: "Verify that sensitive data in local databases is encrypted." }
            ]
        },
        {
            name: "V3: Cryptography Testing",
            description: "Testing cryptographic implementations on mobile.",
            controls: [
                { id: "MASTG-CRYPTO-1", title: "Custom Cryptography Check", description: "Verify that the application does not use non-standard or 'homegrown' cryptography." },
                { id: "MASTG-CRYPTO-2", title: "Key Leakage via Logs", description: "Verify that cryptographic keys or sensitive data are not leaked during debugging." }
            ]
        },
        {
            name: "V5: Network Testing",
            description: "Testing network security and communication protocols.",
            controls: [
                { id: "MASTG-NETWORK-1", title: "Cleartext Traffic Check", description: "Verify that the application does not allow cleartext HTTP traffic." },
                { id: "MASTG-NETWORK-2", title: "Certificate Validation", description: "Verify that the application correctly validates server certificates." }
            ]
        },
        {
            name: "V8: Resilience Testing",
            description: "Testing for anti-tampering and anti-reverse engineering.",
            controls: [
                { id: "MASTG-RESILIENCE-1", title: "Root/Jailbreak Detection", description: "Verify that the application detects and responds to rooted or jailbroken devices." },
                { id: "MASTG-RESILIENCE-2", title: "Anti-Debugging Checks", description: "Verify that the application implements checks to prevent attaching a debugger." }
            ]
        }
    ]
};

async function main() {
    const db = await getDb();
    console.log(`Seeding ${MASTG_DATA.name}...`);

    // 1. Framework
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, MASTG_DATA.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${MASTG_DATA.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: MASTG_DATA.name,
            version: MASTG_DATA.version,
            description: MASTG_DATA.description,
            type: MASTG_DATA.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${MASTG_DATA.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: MASTG_DATA.name,
            shortCode: MASTG_DATA.shortCode,
            version: MASTG_DATA.version,
            description: MASTG_DATA.description,
            type: MASTG_DATA.type
        }).returning();
        frameworkId = fw.id;
    }

    // 2. Phases & Requirements
    let order = 1;
    for (const domain of MASTG_DATA.domains) {
        const phases = await db.select().from(implementationPhases).where(and(eq(implementationPhases.frameworkId, frameworkId), eq(implementationPhases.name, domain.name)));
        let phaseId;

        if (phases.length > 0) {
            phaseId = phases[0].id;
            await db.update(implementationPhases).set({ description: domain.description, order: order++ }).where(eq(implementationPhases.id, phaseId));
        } else {
            const [ph] = await db.insert(implementationPhases).values({
                frameworkId,
                name: domain.name,
                description: domain.description,
                order: order++
            }).returning();
            phaseId = ph.id;
        }

        for (const control of domain.controls) {
            const reqs = await db.select().from(frameworkRequirements).where(and(eq(frameworkRequirements.frameworkId, frameworkId), eq(frameworkRequirements.identifier, control.id)));

            if (reqs.length === 0) {
                console.log(`  Adding requirement: ${control.id}`);
                await db.insert(frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier: control.id,
                    title: control.title,
                    description: control.description,
                    guidance: `Testing procedure for ${control.title} based on OWASP MASTG v1.5.`
                });
            } else {
                console.log(`  Updating requirement: ${control.id}`);
                await db.update(frameworkRequirements).set({
                    phaseId,
                    title: control.title,
                    description: control.description
                }).where(eq(frameworkRequirements.id, reqs[0].id));
            }
        }
    }

    console.log("MASTG Seeding complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
