import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and, asc } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SCVS_DATA = {
    shortCode: "SCVS",
    name: "OWASP Software Component Verification Standard (SCVS)",
    version: "1.0",
    type: "Security / Supply Chain",
    description: "A framework for identifying activities, controls, and best practices to reduce risk in a software supply chain.",
    domains: [
        {
            name: "V1: Inventory Requirements",
            description: "An accurate inventory of all components used in the creation of software is a foundational requirement for further analysis.",
            controls: [
                { id: "SCVS-1.1", title: "Build Component Inventory", description: "Verify that all direct and transitive components and their versions are known at completion of a build." },
                { id: "SCVS-1.2", title: "Package Manager Usage", description: "Verify that package managers are used to manage all third-party binary components." },
                { id: "SCVS-1.3", title: "Machine-Readable Inventory", description: "Verify that an accurate inventory of all third-party components is available in a machine-readable format." },
                { id: "SCVS-1.4", title: "SBOM Generation", description: "Verify that software bill of materials are generated for publicly or commercially available applications." },
                { id: "SCVS-1.5", title: "SBOM Requirement", description: "Verify that software bill of materials are required for new procurements." },
                { id: "SCVS-1.6", title: "SBOM Maintenance", description: "Verify that software bill of materials are continuously maintained and current for all systems." },
                { id: "SCVS-1.7", title: "Component Identification", description: "Verify that components are uniquely identified in a consistent, machine-readable format." },
                { id: "SCVS-1.8", title: "Component Type", description: "Verify that the component type is known throughout inventory." },
                { id: "SCVS-1.9", title: "Component Function", description: "Verify that the component function is known throughout inventory." },
                { id: "SCVS-1.10", title: "Point of Origin", description: "Verify that point of origin is known for all components." }
            ]
        },
        {
            name: "V2: Software Bill of Materials (SBOM) Requirements",
            description: "Automatically creating accurate Software Bill of Materials (SBOM) in the build pipeline is one indicator of mature development processes.",
            controls: [
                { id: "SCVS-2.1", title: "SBOM Format", description: "Verify that a structured, machine readable software bill of materials (SBOM) format is present." },
                { id: "SCVS-2.2", title: "Automated Creation", description: "Verify that SBOM creation is automated and reproducible." },
                { id: "SCVS-2.3", title: "Unique Identifier", description: "Verify that each SBOM has a unique identifier." },
                { id: "SCVS-2.4", title: "SBOM Signing", description: "Verify that SBOM has been signed by publisher, supplier, or certifying authority." },
                { id: "SCVS-2.5", title: "Signature Verification", description: "Verify that SBOM signature verification exists." },
                { id: "SCVS-2.6", title: "Signature Verification Performance", description: "Verify that SBOM signature verification is performed." },
                { id: "SCVS-2.7", title: "Timestamping", description: "Verify that SBOM is timestamped." },
                { id: "SCVS-2.8", title: "Risk Analysis", description: "Verify that SBOM is analyzed for risk." },
                { id: "SCVS-2.9", title: "Complete Inventory", description: "Verify that SBOM contains a complete and accurate inventory of all components the SBOM describes." },
                { id: "SCVS-2.10", title: "Test Components", description: "Verify that SBOM contains an accurate inventory of all test components for the asset or application it describes." },
                { id: "SCVS-2.11", title: "Asset Metadata", description: "Verify that SBOM contains metadata about the asset or software the SBOM describes." },
                { id: "SCVS-2.12", title: "Native Identifiers", description: "Verify that component identifiers are derived from their native ecosystems (if applicable)." },
                { id: "SCVS-2.13", title: "Origin Format", description: "Verify that component point of origin is identified in a consistent, machine readable format (e.g. PURL)." },
                { id: "SCVS-2.14", title: "License Information", description: "Verify that components defined in SBOM have accurate license information." },
                { id: "SCVS-2.15", title: "SPDX Licenses", description: "Verify that components defined in SBOM have valid SPDX license ID's or expressions (if applicable)." },
                { id: "SCVS-2.16", title: "Copyright Statements", description: "Verify that components defined in SBOM have valid copyright statements." },
                { id: "SCVS-2.17", title: "Modification Provenance", description: "Verify that components defined in SBOM which have been modified from the original have detailed provenance and pedigree information." },
                { id: "SCVS-2.18", title: "File Hashes", description: "Verify that components defined in SBOM have one or more file hashes (SHA-256, SHA-512, etc)." }
            ]
        },
        {
            name: "V3: Build Environment Requirements",
            description: "Hardening the systems involved in the build pipeline and implementing best practices reduces the likelihood of compromise.",
            controls: [
                { id: "SCVS-3.1", title: "Repeatable Build", description: "Verify that application uses a repeatable build." },
                { id: "SCVS-3.2", title: "Build Documentation", description: "Verify that documentation exists on how the application is built and instructions for repeating the build." },
                { id: "SCVS-3.3", title: "CI Pipeline", description: "Verify that application uses a continuous integration build pipeline." },
                { id: "SCVS-3.4", title: "Build Integrity", description: "Verify that application build pipeline prohibits alteration of build outside of the job performing the build." },
                { id: "SCVS-3.5", title: "Package Settings Integrity", description: "Verify that application build pipeline prohibits alteration of package management settings." },
                { id: "SCVS-3.6", title: "Code Execution Limits", description: "Verify that application build pipeline prohibits the execution of arbitrary code outside of the context of a jobs build script." },
                { id: "SCVS-3.7", title: "Version Control Source", description: "Verify that application build pipeline may only perform builds of source code maintained in version control systems." },
                { id: "SCVS-3.8", title: "Network Settings Integrity", description: "Verify that application build pipeline prohibits alteration of DNS and network settings during build." },
                { id: "SCVS-3.9", title: "Trust Store Integrity", description: "Verify that application build pipeline prohibits alteration of certificate trust stores." },
                { id: "SCVS-3.10", title: "Authentication Enforcement", description: "Verify that application build pipeline enforces authentication and defaults to deny." },
                { id: "SCVS-3.11", title: "Authorization Enforcement", description: "Verify that application build pipeline enforces authorization and defaults to deny." },
                { id: "SCVS-3.12", title: "Separation of Concerns", description: "Verify that application build pipeline requires separation of concerns for the modification of system settings." },
                { id: "SCVS-3.13", title: "System Audit Log", description: "Verify that application build pipeline maintains a verifiable audit log of all system changes." },
                { id: "SCVS-3.14", title: "Job Audit Log", description: "Verify that application build pipeline maintains a verifiable audit log of all build job changes." },
                { id: "SCVS-3.15", title: "Maintenance Cadence", description: "Verify that application build pipeline has required maintenance cadence where the entire stack is updated, patched, and re-certified for use." },
                { id: "SCVS-3.16", title: "Tool Analysis", description: "Verify that compilers, version control clients, development utilities, and software development kits are analyzed and monitored for tampering, trojans, or malicious code." },
                { id: "SCVS-3.17", title: "Manipulation Awareness", description: "Verify that all build-time manipulations to source or binaries are known and well defined." },
                { id: "SCVS-3.18", title: "Component Checksums", description: "Verify that checksums of all first-party and third-party components are documented for every build." },
                { id: "SCVS-3.19", title: "Checksum Delivery", description: "Verify that checksums of all components are accessible and delivered out-of-band whenever those components are packaged or distributed." },
                { id: "SCVS-3.20", title: "Unused Component ID", description: "Verify that unused direct and transitive components have been identified." },
                { id: "SCVS-3.21", title: "Unused Component Removal", description: "Verify that unused direct and transitive components have been removed from the application." }
            ]
        },
        {
            name: "V4: Package Management Requirements",
            description: "Implementing best practices for package managers and repositories can dramatically reduce risk of compromise in the software supply chain.",
            controls: [
                { id: "SCVS-4.1", title: "Repository Retrieval", description: "Verify that binary components are retrieved from a package repository." },
                { id: "SCVS-4.2", title: "Repository Congruence", description: "Verify that package repository contents are congruent to an authoritative point of origin for open source components." },
                { id: "SCVS-4.3", title: "Strong Authentication", description: "Verify that package repository requires strong authentication." },
                { id: "SCVS-4.4", title: "MFA Publishing Support", description: "Verify that package repository supports multi-factor authentication component publishing." },
                { id: "SCVS-4.5", title: "MFA Publishing Usage", description: "Verify that package repository components have been published with multi-factor authentication." },
                { id: "SCVS-4.6", title: "Incident Reporting Support", description: "Verify that package repository supports security incident reporting." },
                { id: "SCVS-4.7", title: "Automated Incident Reporting", description: "Verify that package repository automates security incident reporting." },
                { id: "SCVS-4.8", title: "Publisher Notification", description: "Verify that package repository notifies publishers of security issues." },
                { id: "SCVS-4.9", title: "User Notification", description: "Verify that package repository notifies users of security issues." },
                { id: "SCVS-4.10", title: "Version Correlation", description: "Verify that package repository provides a verifiable way of correlating component versions to specific source codes in version control." },
                { id: "SCVS-4.11", title: "Update Auditability", description: "Verify that package repository provides auditability when components are updated." },
                { id: "SCVS-4.12", title: "Code Signing", description: "Verify that package repository requires code signing to publish packages to production repositories." },
                { id: "SCVS-4.13", title: "Remote Integrity Verification", description: "Verify that package manager verifies the integrity of packages when they are retrieved from remote repository." },
                { id: "SCVS-4.14", title: "Local Integrity Verification", description: "Verify that package manager verifies the integrity of packages when they are retrieved from file system." },
                { id: "SCVS-4.15", title: "TLS Enforcement", description: "Verify that package repository enforces use of TLS for all interactions." },
                { id: "SCVS-4.16", title: "TLS Validation", description: "Verify that package manager validates TLS certificate chain to repository and fails securely when validation fails." },
                { id: "SCVS-4.17", title: "Static Analysis", description: "Verify that package repository requires and/or performs static code analysis prior to publishing a component and makes results available for others to consume." },
                { id: "SCVS-4.18", title: "No Execution", description: "Verify that package manager does not execute component code." },
                { id: "SCVS-4.19", title: "Installation Documentation", description: "Verify that package manager documents package installation in machine-readable form." }
            ]
        },
        {
            name: "V5: Component Analysis Requirements",
            description: "Component Analysis is the process of identifying potential areas of risk from the use of third-party and open-source software components.",
            controls: [
                { id: "SCVS-5.1", title: "Analysis Tools", description: "Verify that component can be analyzed with linters and/or static analysis tools." },
                { id: "SCVS-5.2", title: "Pre-use Analysis", description: "Verify that component is analyzed using linters and/or static analysis tools prior to use." },
                { id: "SCVS-5.3", title: "Upgrade Analysis", description: "Verify that linting and/or static analysis is performed with every upgrade of a component." },
                { id: "SCVS-5.4", title: "Vulnerability Identification", description: "Verify that an automated process of identifying all publicly disclosed vulnerabilities in third-party and open source components is used." },
                { id: "SCVS-5.5", title: "Exploitability Identification", description: "Verify that an automated process of identifying confirmed dataflow exploitability is used." },
                { id: "SCVS-5.6", title: "Version Identification", description: "Verify that an automated process of identifying non-specified component versions is used." },
                { id: "SCVS-5.7", title: "Outdated Component Identification", description: "Verify that an automated process of identifying out-of-date components is used." },
                { id: "SCVS-5.8", title: "EOL Identification", description: "Verify that an automated process of identifying end-of-life / end-of-support components is used." },
                { id: "SCVS-5.9", title: "Type Identification", description: "Verify that an automated process of identifying component type is used." },
                { id: "SCVS-5.10", title: "Function Identification", description: "Verify that an automated process of identifying component function is used." },
                { id: "SCVS-5.11", title: "Quantity Identification", description: "Verify that an automated process of identifying component quantity is used." },
                { id: "SCVS-5.12", title: "License Identification", description: "Verify that an automated process of identifying component license is used." }
            ]
        },
        {
            name: "V6: Pedigree and Provenance Requirements",
            description: "Identify point of origin and chain of custody in order to manage system risk if either point of origin or chain of custody is compromised.",
            controls: [
                { id: "SCVS-6.1", title: "Verifiable Origin", description: "Verify that point of origin is verifiable for source code and binary components." },
                { id: "SCVS-6.2", title: "Auditable Chain of Custody", description: "Verify that chain of custody is auditable for source code and binary components." },
                { id: "SCVS-6.3", title: "Provenance Documentation", description: "Verify that provenance of modified components is known and documented." },
                { id: "SCVS-6.4", title: "Pedigree Documentation", description: "Verify that pedigree of component modification is documented and verifiable." },
                { id: "SCVS-6.5", title: "Unique Modification ID", description: "Verify that modified components are uniquely identified and distinct from origin component." },
                { id: "SCVS-6.6", title: "Modification Analysis", description: "Verify that modified components are analyzed with the same level of precision as unmodified components." },
                { id: "SCVS-6.7", title: "Unique Risk Analysis", description: "Verify that risk unique to modified components can be analyzed and associated specifically to modified variant." }
            ]
        }
    ]
};

async function main() {
    const db = await getDb();
    console.log(`Seeding ${SCVS_DATA.name}...`);

    // 1. Framework
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, SCVS_DATA.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${SCVS_DATA.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: SCVS_DATA.name,
            version: SCVS_DATA.version,
            description: SCVS_DATA.description,
            type: SCVS_DATA.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${SCVS_DATA.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: SCVS_DATA.name,
            shortCode: SCVS_DATA.shortCode,
            version: SCVS_DATA.version,
            description: SCVS_DATA.description,
            type: SCVS_DATA.type
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

    for (const domain of SCVS_DATA.domains) {
        let phaseId;
        
        // Find existing phase by order (primary) or name (fallback)
        // We prioritize order to allow renaming "V1: Old Name" to "V1: New Name"
        const matchingPhaseByOrder = existingPhases.find(p => p.order === order);
        const matchingPhaseByName = existingPhases.find(p => p.name === domain.name);
        
        const targetPhase = matchingPhaseByOrder || matchingPhaseByName;

        if (targetPhase) {
            console.log(`  Updating Phase ${order}: ${domain.name} (was: ${targetPhase.name})`);
            phaseId = targetPhase.id;
            await db.update(implementationPhases).set({
                name: domain.name,
                description: domain.description,
                order: order // Ensure order is correct
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
                    guidance: `Implementation guidance for ${control.title} based on OWASP Software Component Verification Standard v1.0.`
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

    // Optional: Cleanup unused phases if we have fewer domains now (unlikely for SCVS update, but good practice)
    if (existingPhases.length > SCVS_DATA.domains.length) {
        console.log("  Cleaning up extra phases...");
        // This part is skipped to be safe, as usually we don't reduce domains in this specific task.
    }

    console.log("SCVS Seeding complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
