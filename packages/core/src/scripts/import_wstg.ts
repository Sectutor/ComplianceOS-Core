
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const WSTG_DATA = {
    shortCode: "WSTG",
    name: "OWASP Web Security Testing Guide (WSTG)",
    description: "The premier cybersecurity testing resource for web application developers and security professionals.",
    version: "4.2",
    type: "Security / Testing",
    domains: [
        {
            name: "V1: Information Gathering",
            description: "Information gathering is the first stage of a security test.",
            controls: [
                { id: "WSTG-INFO-01", title: "Search Engine Discovery Reconnaissance", description: "Search engines are a powerful tool for information gathering. Use them to find sensitive information." },
                { id: "WSTG-INFO-02", title: "Fingerprint Web Server", description: "Identifying the web server type and version helps in finding known vulnerabilities." },
                { id: "WSTG-INFO-03", title: "Review Webserver Metafiles", description: "Check robots.txt, sitemap.xml, and other metafiles for sensitive paths." }
            ]
        },
        {
            name: "V2: Configuration Management",
            description: "Testing for configuration and deployment management vulnerabilities.",
            controls: [
                { id: "WSTG-CONF-01", title: "Network/Infrastructure Configuration", description: "Verify that network services and infrastructure are securely configured." },
                { id: "WSTG-CONF-02", title: "Application Platform Configuration", description: "Ensure the application platform (e.g., CMS, Framework) is securely configured." }
            ]
        },
        {
            name: "V3: Authentication Testing",
            description: "Testing authentication mechanisms.",
            controls: [
                { id: "WSTG-AUTH-01", title: "Weak Password Policy", description: "Verify that the application enforces strong password requirements." },
                { id: "WSTG-AUTH-02", title: "Brute Force Resistance", description: "Verify that the application prevents automated brute-force attacks on credentials." },
                { id: "WSTG-AUTH-03", title: "Credentials Transport", description: "Verify that credentials are sent over encrypted channels." }
            ]
        },
        {
            name: "V4: Input Validation Testing",
            description: "Testing for input validation vulnerabilities.",
            controls: [
                { id: "WSTG-INPV-01", title: "Reflected Cross Site Scripting", description: "Verify that user input is properly sanitized before being reflected in the UI." },
                { id: "WSTG-INPV-02", title: "SQL Injection", description: "Verify that user input does not allow manipulation of database queries." },
                { id: "WSTG-INPV-05", title: "Stored Cross Site Scripting", description: "Verify that data stored in the application is sanitized before being displayed." }
            ]
        },
        {
            name: "V5: Authorization Testing",
            description: "Testing for authorization bypass and privilege escalation.",
            controls: [
                { id: "WSTG-ATHZ-01", title: "Directory Traversal", description: "Verify that input is vetted to prevent access to unauthorized files." },
                { id: "WSTG-ATHZ-02", title: "Privilege Escalation", description: "Verify that users cannot perform actions outside their assigned roles." }
            ]
        }
    ]
};

async function main() {
    const db = await getDb();
    console.log(`Seeding ${WSTG_DATA.name}...`);

    // 1. Framework
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, WSTG_DATA.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${WSTG_DATA.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: WSTG_DATA.name,
            version: WSTG_DATA.version,
            description: WSTG_DATA.description,
            type: WSTG_DATA.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${WSTG_DATA.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: WSTG_DATA.name,
            shortCode: WSTG_DATA.shortCode,
            version: WSTG_DATA.version,
            description: WSTG_DATA.description,
            type: WSTG_DATA.type
        }).returning();
        frameworkId = fw.id;
    }

    // 2. Phases & Requirements
    let order = 1;
    for (const domain of WSTG_DATA.domains) {
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
                    guidance: `Testing procedure for ${control.title} based on OWASP WSTG v4.2.`
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

    console.log("WSTG Seeding complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
