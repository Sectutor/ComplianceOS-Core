import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const db = await getDb();
    console.log("Seeding OWASP Standards...");

    // 1. OWASP MASVS (Mobile)
    await seedFramework(db, {
        shortCode: "MASVS",
        name: "OWASP Mobile Application Security Verification Standard (MASVS)",
        version: "2.0.0",
        type: "Security",
        description: "The industry standard for mobile app security.",
        domains: [
            {
                name: "MASVS-STORAGE", description: "Secure Storage", controls: [
                    { id: "MASVS-STORAGE-1", title: "System Credential Storage", description: "The app does not store sensitive data in unencrypted system credentials storage." },
                    { id: "MASVS-STORAGE-2", title: "Log Leakage", description: "No sensitive data is written to application logs." }
                ]
            },
            {
                name: "MASVS-CRYPTO", description: "Cryptography", controls: [
                    { id: "MASVS-CRYPTO-1", title: "Standard Algorithms", description: "The app uses proven implementations of standard cryptographic primitives." }
                ]
            },
            {
                name: "MASVS-AUTH", description: "Authentication", controls: [
                    { id: "MASVS-AUTH-1", title: "Remote Authentication", description: "If the app provides users with access to a remote service, it must authenticate with that remote service." }
                ]
            },
            {
                name: "MASVS-NETWORK", description: "Network Communication", controls: [
                    { id: "MASVS-NETWORK-1", title: "TLS Usage", description: "Data is encrypted on the network using TLS." }
                ]
            },
            {
                name: "MASVS-PLATFORM", description: "Platform Interaction", controls: [
                    { id: "MASVS-PLATFORM-1", title: "Permissions", description: "The app only requests the minimum set of permissions necessary." }
                ]
            },
            {
                name: "MASVS-CODE", description: "Code Quality", controls: [
                    { id: "MASVS-CODE-1", title: "Signed App", description: "The app is signed and provisioned with a valid certificate." }
                ]
            },
            {
                name: "MASVS-RESILIENCE", description: "Resilience", controls: [
                    { id: "MASVS-RESILIENCE-1", title: "Anti-Tampering", description: "The app detects and responds to tampering." }
                ]
            }
        ]
    });

    // 2. OWASP SAMM (Governance)
    await seedFramework(db, {
        shortCode: "SAMM",
        name: "OWASP Software Assurance Maturity Model (SAMM)",
        version: "2.0",
        type: "Governance",
        description: "A framework to help organizations formulate and implement a strategy for software security that is tailored to the specific risks facing the organization.",
        domains: [
            {
                name: "Governance", description: "Strategy, Metrics, and Policy", controls: [
                    { id: "SM-1", title: "Strategy & Metrics", description: "Establish a unified strategic roadmap for software security within the organization." },
                    { id: "PC-1", title: "Policy & Compliance", description: "Understand and meet external legal and regulatory requirements while driving internal security standards." },
                    { id: "EG-1", title: "Education & Guidance", description: "Offer insight and information to personnel involved in the software lifecycle." }
                ]
            },
            {
                name: "Design", description: "Threat Assessment, Requirements, Architecture", controls: [
                    { id: "TA-1", title: "Threat Assessment", description: "Identify and understand the project-level risks based on the functionality of the software." },
                    { id: "SR-1", title: "Security Requirements", description: "Specify the expected security behavior of the software." },
                    { id: "SA-1", title: "Secure Architecture", description: "Design the software to meet the security requirements and mitigate the identified threats." }
                ]
            },
            {
                name: "Implementation", description: "Build, Deployment, Defect Management", controls: [
                    { id: "SB-1", title: "Secure Build", description: "Consistently build the software in a secure and repeatable manner." },
                    { id: "SD-1", title: "Secure Deployment", description: "Deploy the software to the target environment without compromising security." },
                    { id: "DM-1", title: "Defect Management", description: "Track and resolve security defects in the software." }
                ]
            },
            {
                name: "Verification", description: "Architecture Assessment, Requirements Testing", controls: [
                    { id: "AA-1", title: "Architecture Assessment", description: "Validate the security of the software architecture and design." },
                    { id: "RT-1", title: "Requirements-driven Testing", description: "Verify that the software meets the security requirements." },
                    { id: "ST-1", title: "Security Testing", description: "Test the software for security vulnerabilities." }
                ]
            },
            {
                name: "Operations", description: "Incident Management, Environment Management", controls: [
                    { id: "IM-1", title: "Incident Management", description: "Detect and respond to security incidents." },
                    { id: "EM-1", title: "Environment Management", description: "Maintain the security of the software in the operational environment." },
                    { id: "OM-1", title: "Operational Management", description: "Manage the security of the software in operation." }
                ]
            }
        ]
    });

    console.log("Seeding complete.");
    process.exit(0);
}

async function seedFramework(db: any, data: any) {
    console.log(`Processing ${data.name}...`);
    
    // Check if exists
    const existing = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.shortCode, data.shortCode));
    let frameworkId;

    if (existing.length > 0) {
        console.log(`Updating ${data.shortCode}...`);
        frameworkId = existing[0].id;
        await db.update(complianceFrameworks).set({
            name: data.name,
            version: data.version,
            description: data.description,
            type: data.type
        }).where(eq(complianceFrameworks.id, frameworkId));
    } else {
        console.log(`Creating ${data.shortCode}...`);
        const [fw] = await db.insert(complianceFrameworks).values({
            name: data.name,
            shortCode: data.shortCode,
            version: data.version,
            description: data.description,
            type: data.type
        }).returning();
        frameworkId = fw.id;
    }

    let order = 1;
    for (const domain of data.domains) {
        // Check/Create Phase
        const phases = await db.select().from(implementationPhases).where(and(eq(implementationPhases.frameworkId, frameworkId), eq(implementationPhases.name, domain.name)));
        let phaseId;
        
        if (phases.length > 0) {
            phaseId = phases[0].id;
        } else {
            const [ph] = await db.insert(implementationPhases).values({
                frameworkId,
                name: domain.name,
                description: domain.description,
                order: order++
            }).returning();
            phaseId = ph.id;
        }

        // Upsert Controls
        for (const control of domain.controls) {
            const reqs = await db.select().from(frameworkRequirements).where(and(eq(frameworkRequirements.frameworkId, frameworkId), eq(frameworkRequirements.identifier, control.id)));
            
            if (reqs.length === 0) {
                await db.insert(frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier: control.id,
                    title: control.title,
                    description: control.description,
                    guidance: `Guidance for ${control.id}`
                });
            }
        }
    }
}

main().catch(console.error);
