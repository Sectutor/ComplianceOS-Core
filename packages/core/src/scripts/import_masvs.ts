
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MASVS_DATA = {
    shortCode: "MASVS",
    name: "OWASP MASVS (Mobile Security)",
    description: "The industry standard for mobile application security requirements.",
    version: "2.0",
    type: "Security / Mobile",
    domains: [
        {
            name: "V2: Data Storage and Privacy",
            description: "Requirements for secure handling and storage of data on mobile devices.",
            controls: [
                { id: "MASVS-STORAGE-1", title: "Sensitive Data Storage", description: "Verify that sensitive data is not stored insecurely on the device." },
                { id: "MASVS-STORAGE-2", title: "Log Sanitization", description: "Verify that sensitive data is not leaked through system logs." }
            ]
        },
        {
            name: "V3: Cryptography",
            description: "Requirements for secure use of cryptographic functions in mobile apps.",
            controls: [
                { id: "MASVS-CRYPTO-1", title: "Key Management", description: "Verify that cryptographic keys are managed securely using platform features (Keystore/Keychain)." },
                { id: "MASVS-CRYPTO-2", title: "Strong Algorithms", description: "Verify that only industry-standard, strong cryptographic algorithms are used." }
            ]
        },
        {
            name: "V4: Authentication and Session Management",
            description: "Requirements for secure authentication and session handling.",
            controls: [
                { id: "MASVS-AUTH-1", title: "Secure Authentication", description: "Verify that authentication is performed securely and follows best practices." },
                { id: "MASVS-AUTH-2", title: "Biometric Authentication", description: "Verify that biometric authentication is implemented using platform-recommended APIs." }
            ]
        },
        {
            name: "V5: Network Communication",
            description: "Requirements for securing data in transit.",
            controls: [
                { id: "MASVS-NETWORK-1", title: "TLS Configuration", description: "Verify that all network communication is performed over a secure, up-to-date TLS connection." },
                { id: "MASVS-NETWORK-2", title: "Certificate Pinning", description: "Verify that certificate pinning is implemented for high-security applications." }
            ]
        }
    ]
};

async function main() {
    const db = await getDb();
    console.log(`Seeding ${MASVS_DATA.name}...`);

    // 1. Framework
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, MASVS_DATA.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${MASVS_DATA.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: MASVS_DATA.name,
            version: MASVS_DATA.version,
            description: MASVS_DATA.description,
            type: MASVS_DATA.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${MASVS_DATA.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: MASVS_DATA.name,
            shortCode: MASVS_DATA.shortCode,
            version: MASVS_DATA.version,
            description: MASVS_DATA.description,
            type: MASVS_DATA.type
        }).returning();
        frameworkId = fw.id;
    }

    // 2. Phases & Requirements
    let order = 1;
    for (const domain of MASVS_DATA.domains) {
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
                    guidance: `Implementation guidance for ${control.title} based on OWASP MASVS v2.0.`
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

    console.log("MASVS Seeding complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
