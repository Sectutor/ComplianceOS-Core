import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and, asc } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const OPEN_SSF_DATA = {
    shortCode: "OPENSSF",
    name: "OpenSSF Best Practices Badge (CII)",
    description: "The OpenSSF Best Practices Badge (formerly CII Best Practices) is a set of best practices for Free/Libre and Open Source Software (FLOSS) projects to show that they follow security and quality standards.",
    version: "1.0",
    type: "Security / Supply Chain",
    domains: [
        {
            name: "V1: Basics",
            description: "Fundamental requirements for project transparency, licensing, and documentation.",
            controls: [
                { id: "OSPS-BAS-01", title: "Project Website", description: "Verify that the project has a website that describes what the software does and how to get it." },
                { id: "OSPS-BAS-02", title: "Contribution Information", description: "Verify that the project provides clear information on how to contribute and the contribution process." },
                { id: "OSPS-BAS-03", title: "FLOSS License", description: "Verify that the software is released as FLOSS (Free/Libre and Open Source Software) with an OSI-approved license." },
                { id: "OSPS-BAS-04", title: "Documentation", description: "Verify that the project provides basic documentation on how to install and use the software." },
                { id: "OSPS-BAS-05", title: "Secure Sites (HTTPS)", description: "Verify that the project sites (website, repository, download URLs) support HTTPS using TLS." },
                { id: "OSPS-BAS-06", title: "Discussion Mechanisms", description: "Verify that the project has a mechanism for discussion (mailing list, forum, issue tracker) that is searchable and accessible." }
            ]
        },
        {
            name: "V2: Change Control",
            description: "Requirements for version control, release management, and change tracking.",
            controls: [
                { id: "OSPS-CC-01", title: "Public Version Control", description: "Verify that the project uses a publicly readable version-controlled source repository (e.g., git)." },
                { id: "OSPS-CC-02", title: "Unique Versioning", description: "Verify that project results have a unique version identifier for each release." },
                { id: "OSPS-CC-03", title: "Semantic Versioning", description: "Verify that the project uses a standard version numbering format (e.g., Semantic Versioning or CalVer)." },
                { id: "OSPS-CC-04", title: "Release Tags", description: "Verify that each release is identified within the version control system (e.g., using git tags)." },
                { id: "OSPS-CC-05", title: "Release Notes", description: "Verify that release notes are provided for each release, summarizing major changes." },
                { id: "OSPS-CC-06", title: "Vulnerability Identification", description: "Verify that release notes identify any fixed vulnerabilities." }
            ]
        },
        {
            name: "V3: Reporting",
            description: "Processes for handling bug reports and security vulnerabilities.",
            controls: [
                { id: "OSPS-REP-01", title: "Bug Reporting Process", description: "Verify that the project provides a process for users to submit bug reports." },
                { id: "OSPS-REP-02", title: "Issue Tracker", description: "Verify that the project uses an issue tracker to track individual issues." },
                { id: "OSPS-REP-03", title: "Bug Response", description: "Verify that the project acknowledges a majority of bug reports submitted in the last 2-12 months." },
                { id: "OSPS-REP-04", title: "Vulnerability Reporting", description: "Verify that the project has a documented process for reporting security vulnerabilities." },
                { id: "OSPS-REP-05", title: "Private Vulnerability Reporting", description: "Verify that the vulnerability reporting process supports private reports (e.g., via email or encrypted channel)." },
                { id: "OSPS-REP-06", title: "Vulnerability Response SLA", description: "Verify that the project responds to vulnerability reports within 14 days." }
            ]
        },
        {
            name: "V4: Quality",
            description: "Requirements for build quality, testing, and code health.",
            controls: [
                { id: "OSPS-QUAL-01", title: "Working Build", description: "Verify that the project can be built using standard tools." },
                { id: "OSPS-QUAL-02", title: "Automated Test Suite", description: "Verify that the project has an automated test suite." },
                { id: "OSPS-QUAL-03", title: "New Test Policy", description: "Verify that new features or bug fixes typically include new tests." },
                { id: "OSPS-QUAL-04", title: "Warning Flags", description: "Verify that compiler/linter warning flags are enabled and addressed." },
                { id: "OSPS-QUAL-05", title: "Test Invocation", description: "Verify that there is a standard way to run the tests (e.g., 'npm test', 'make test')." }
            ]
        },
        {
            name: "V5: Security",
            description: "Specific security practices including cryptography and memory safety.",
            controls: [
                { id: "OSPS-SEC-01", title: "Secure Development Knowledge", description: "Verify that at least one primary developer knows how to design secure software." },
                { id: "OSPS-SEC-02", title: "Good Cryptography", description: "Verify that if the project uses cryptography, it uses standard, publicly vetted algorithms and protocols." },
                { id: "OSPS-SEC-03", title: "No Leaked Secrets", description: "Verify that the repository does not contain leaked private credentials or secrets." },
                { id: "OSPS-SEC-04", title: "No Broken Algorithms", description: "Verify that the project avoids using known broken or weak cryptographic algorithms (e.g., MD5, SHA1 for security)." },
                { id: "OSPS-SEC-05", title: "Secure Delivery", description: "Verify that the software is distributed using secure channels (HTTPS)." }
            ]
        },
        {
            name: "V6: Analysis",
            description: "Use of automated tools to analyze code quality and security.",
            controls: [
                { id: "OSPS-ANA-01", title: "Static Code Analysis", description: "Verify that the project uses at least one static code analysis tool (linter, SAST) to detect common errors." },
                { id: "OSPS-ANA-02", title: "Dynamic Analysis", description: "Verify that the project uses dynamic analysis tools (e.g., fuzzing) if appropriate for the language/type." }
            ]
        }
    ]
};

async function main() {
    const db = await getDb();
    console.log(`Seeding ${OPEN_SSF_DATA.name}...`);

    // 1. Framework
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, OPEN_SSF_DATA.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${OPEN_SSF_DATA.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: OPEN_SSF_DATA.name,
            version: OPEN_SSF_DATA.version,
            description: OPEN_SSF_DATA.description,
            type: OPEN_SSF_DATA.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${OPEN_SSF_DATA.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: OPEN_SSF_DATA.name,
            shortCode: OPEN_SSF_DATA.shortCode,
            version: OPEN_SSF_DATA.version,
            description: OPEN_SSF_DATA.description,
            type: OPEN_SSF_DATA.type
        }).returning();
        frameworkId = fw.id;
    }

    // 2. Phases & Requirements (Sync by Order)
    let order = 1;

    // Fetch all existing phases for this framework, sorted by order
    const existingPhases = await db.select()
        .from(implementationPhases)
        .where(eq(implementationPhases.frameworkId, frameworkId))
        .orderBy(asc(implementationPhases.order));

    for (const domain of OPEN_SSF_DATA.domains) {
        let phaseId;

        // Find existing phase by order (primary) or name (fallback)
        const matchingPhaseByOrder = existingPhases.find(p => p.order === order);
        const matchingPhaseByName = existingPhases.find(p => p.name === domain.name);

        const targetPhase = matchingPhaseByOrder || matchingPhaseByName;

        if (targetPhase) {
            console.log(`  Updating Phase ${order}: ${domain.name} (was: ${targetPhase.name})`);
            phaseId = targetPhase.id;
            await db.update(implementationPhases).set({
                name: domain.name,
                description: domain.description,
                order: order
            }).where(eq(implementationPhases.id, phaseId));
        } else {
            console.log(`  Creating Phase ${order}: ${domain.name}`);
            const [ph] = await db.insert(implementationPhases).values({
                frameworkId,
                name: domain.name,
                description: domain.description,
                order: order
            }).returning();
            phaseId = ph.id;
        }

        order++;

        for (const control of domain.controls) {
            const reqs = await db.select().from(frameworkRequirements).where(and(eq(frameworkRequirements.frameworkId, frameworkId), eq(frameworkRequirements.identifier, control.id)));

            if (reqs.length === 0) {
                // console.log(`    Adding requirement: ${control.id}`);
                await db.insert(frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier: control.id,
                    title: control.title,
                    description: control.description,
                    guidance: `Implementation guidance for ${control.title} based on OpenSSF Best Practices.`
                });
            } else {
                // console.log(`    Updating requirement: ${control.id}`);
                await db.update(frameworkRequirements).set({
                    phaseId,
                    title: control.title,
                    description: control.description
                }).where(eq(frameworkRequirements.id, reqs[0].id));
            }
        }
    }

    console.log("OpenSSF Seeding complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
