import { getDb } from "../packages/core/src/db";
import * as maturitySchema from "../packages/core/src/db/maturity-schema";
import { eq, and } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // Fallback to .env

async function main() {
    console.log("🚀 Seeding C2M2 V2.1 Maturity Model...");
    const db = await getDb();

    // 1. C2M2 V2.1 Framework Definition
    const c2m2 = {
        id: "c2m2-2.1",
        name: "C2M2 V2.1",
        description: "Cybersecurity Capability Maturity Model Version 2.1 for Energy Sector and Critical Infrastructure.",
        version: "2.1",
        logo: "/frameworks/c2m2.svg",
        levels: [
            { level: 1, name: "MIL1: Initiated", description: "Practices are performed but may be ad hoc. Performance depends on individual initiative." },
            { level: 2, name: "MIL2: Performed", description: "Practices are documented, planned, and resourced with defined roles." },
            { level: 3, name: "MIL3: Managed", description: "Practices are standardized, measured, and improved with metrics and governance." }
        ],
        status: "active" as const
    };

    const categories = [
        { frameworkId: "c2m2-2.1", code: "ASSET", name: "Asset Management", description: "Identify, track, and manage IT and OT assets.", order: 1 },
        { frameworkId: "c2m2-2.1", code: "THREAT", name: "Threat & Vulnerability", description: "Detect, analyze, and manage cybersecurity threats and vulnerabilities.", order: 2 },
        { frameworkId: "c2m2-2.1", code: "RISK", name: "Risk Management", description: "Establish and maintain an enterprise cyber risk management program.", order: 3 },
        { frameworkId: "c2m2-2.1", code: "ACCESS", name: "Identity & Access", description: "Control physical and logical access to assets.", order: 4 },
        { frameworkId: "c2m2-2.1", code: "SITUATION", name: "Situational Awareness", description: "Establish and maintain an understanding of the operational and security state.", order: 5 },
        { frameworkId: "c2m2-2.1", code: "RESPONSE", name: "Incident Response", description: "Detect, analyze, and recover from cybersecurity incidents.", order: 6 },
        { frameworkId: "c2m2-2.1", code: "THIRD-PARTIES", name: "Third-Party Risk", description: "Manage cyber risks arising from suppliers and third parties.", order: 7 },
        { frameworkId: "c2m2-2.1", code: "WORKFORCE", name: "Workforce Management", description: "Ensure the workforce has the necessary cybersecurity skills and knowledge.", order: 8 },
        { frameworkId: "c2m2-2.1", code: "ARCHITECTURE", name: "Cybersecurity Architecture", description: "Design and maintain a secure cybersecurity architecture.", order: 9 },
        { frameworkId: "c2m2-2.1", code: "PROGRAM", name: "Program Management", description: "Establish and maintain a governance structure for cybersecurity.", order: 10 }
    ];

    // Upsert Framework
    await db.insert(maturitySchema.maturityFrameworks).values(c2m2 as any).onConflictDoUpdate({
        target: maturitySchema.maturityFrameworks.id,
        set: c2m2 as any
    });
    console.log(`✅ Seeded framework: ${c2m2.name}`);

    // Upsert Categories
    for (const c of categories) {
        const existing = await db.select().from(maturitySchema.maturityCategories)
            .where(and(eq(maturitySchema.maturityCategories.frameworkId, c.frameworkId), eq(maturitySchema.maturityCategories.code, c.code)))
            .limit(1);

        if (existing.length === 0) {
            await db.insert(maturitySchema.maturityCategories).values(c);
        } else {
            await db.update(maturitySchema.maturityCategories).set(c).where(eq(maturitySchema.maturityCategories.id, existing[0].id));
        }
    }
    console.log(`✅ Seeded ${categories.length} categories`);

    const insertedCats = await db.select().from(maturitySchema.maturityCategories).where(eq(maturitySchema.maturityCategories.frameworkId, "c2m2-2.1"));
    const getCatId = (code: string) => insertedCats.find(c => c.code === code)?.id;

    // Full Requirements (Practices)
    const requirements = [
        // ASSET - Asset, Change, and Configuration Management
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-1a", title: "Hardware Inventory", description: "An inventory of high-value hardware assets is maintained.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-1b", title: "Software Inventory", description: "An inventory of high-value software assets is maintained.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-1c", title: "Information Inventory", description: "An inventory of high-value information assets is maintained.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-2a", title: "Asset Prioritization", description: "Cybersecurity assets are prioritized based on their importance to the mission.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-2b", title: "Configuration Management", description: "Configurations for high-value assets are managed and baseline configurations are established.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-3a", title: "Automated Tracking", description: "Inventories are updated automatically and integrated with change management.", level: 3 },

        // THREAT - Threat and Vulnerability Management
        { frameworkId: "c2m2-2.1", categoryCode: "THREAT", code: "THREAT-1a", title: "Threat Monitoring", description: "External cybersecurity threat information is reviewed.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "THREAT", code: "THREAT-1b", title: "Vulnerability Identification", description: "Cybersecurity vulnerabilities in organizational assets are identified.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "THREAT", code: "THREAT-2a", title: "Threat Analysis", description: "Threat information is analyzed to determine its potential impact on the organization.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "THREAT", code: "THREAT-2b", title: "Vulnerability Scanning", description: "Network vulnerability scanning is conducted regularly.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "THREAT", code: "THREAT-3a", title: "Threat Hunting", description: "Proactive threat hunting activities are conducted across the enterprise.", level: 3 },

        // RISK - Risk Management
        { frameworkId: "c2m2-2.1", categoryCode: "RISK", code: "RISK-1a", title: "Risk Strategy", description: "A cybersecurity risk management strategy is established.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "RISK", code: "RISK-1b", title: "Risk Identification", description: "Cybersecurity risks are identified and documented.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "RISK", code: "RISK-2a", title: "Risk Assessment", description: "Cybersecurity risks are assessed and documented in a risk register.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "RISK", code: "RISK-3a", title: "Risk Metrics", description: "Cybersecurity risk metrics are defined and monitored by leadership.", level: 3 },

        // ACCESS - Identity and Access Management
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-1a", title: "Access Controls", description: "Logical access is restricted to authorized users.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-1b", title: "Identity Management", description: "User identities are managed throughout their lifecycle.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-2a", title: "Privileged Access", description: "Privileged access is restricted and reviewed periodically.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-2b", title: "Access Reviews", description: "Logical access is reviewed periodically to ensure it remains aligned with business needs.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-3a", title: "Dynamic Access", description: "Access is granted dynamically based on real-time risk assessment.", level: 3 },

        // SITUATION - Situational Awareness
        { frameworkId: "c2m2-2.1", categoryCode: "SITUATION", code: "SITUATION-1a", title: "Log Collection", description: "Cybersecurity logs are collected from high-value assets.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "SITUATION", code: "SITUATION-2a", title: "Operational Monitoring", description: "Organizational assets are monitored for security events in real-time.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "SITUATION", code: "SITUATION-3a", title: "Advanced Correlation", description: "Security events are correlated across the enterprise to detect complex threats.", level: 3 },

        // RESPONSE - Incident Response
        { frameworkId: "c2m2-2.1", categoryCode: "RESPONSE", code: "RESPONSE-1a", title: "Incident Planning", description: "An incident response plan is established.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "RESPONSE", code: "RESPONSE-2a", title: "Incident Detection", description: "Cybersecurity incidents are detected and reported.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "RESPONSE", code: "RESPONSE-2b", title: "Containment & Recovery", description: "Incidents are contained, and systems are recovered according to the response plan.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "RESPONSE", code: "RESPONSE-3a", title: "Lessons Learned", description: "Root cause analysis is performed and lessons learned are integrated into the program.", level: 3 },

        // THIRD-PARTIES - Third-Party Risk Management
        { frameworkId: "c2m2-2.1", categoryCode: "THIRD-PARTIES", code: "THIRD-1a", title: "Third-Party Inventory", description: "Third parties that may impact the organization's cybersecurity are identified.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "THIRD-PARTIES", code: "THIRD-2a", title: "Risk Integration", description: "Third-party risk is integrated into the organization's risk management program.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "THIRD-PARTIES", code: "THIRD-3a", title: "Supply Chain Assurance", description: "The organization ensures that third parties maintain agreed-upon cybersecurity standards.", level: 3 },

        // WORKFORCE - Workforce Management
        { frameworkId: "c2m2-2.1", categoryCode: "WORKFORCE", code: "WORKFORCE-1a", title: "Security Roles", description: "Cybersecurity roles and responsibilities are defined and assigned.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "WORKFORCE", code: "WORKFORCE-1b", title: "Security Awareness", description: "All employees receive cybersecurity awareness training.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "WORKFORCE", code: "WORKFORCE-2a", title: "Skill Verification", description: "Personnel in cybersecurity roles are verified to have the necessary skills.", level: 2 },

        // ARCHITECTURE - Cybersecurity Architecture
        { frameworkId: "c2m2-2.1", categoryCode: "ARCHITECTURE", code: "ARCH-1a", title: "Secure Design", description: "A cybersecurity architecture is designed to protect organizational assets.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ARCHITECTURE", code: "ARCH-2a", title: "Network Segmentation", description: "Critical systems are segmented from non-critical systems.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "ARCHITECTURE", code: "ARCH-3a", title: "Architecture Review", description: "The cybersecurity architecture is reviewed and updated based on threat intelligence.", level: 3 },

        // PROGRAM - Cybersecurity Program Management
        { frameworkId: "c2m2-2.1", categoryCode: "PROGRAM", code: "PROGRAM-1a", title: "Program Establish", description: "A cybersecurity program is established and supported by leadership.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "PROGRAM", code: "PROGRAM-2a", title: "Resource Allocation", description: "Resources (people, technology, budget) are allocated to the cybersecurity program.", level: 2 },
        { frameworkId: "c2m2-2.1", categoryCode: "PROGRAM", code: "PROGRAM-3a", title: "Continuous Improvement", description: "The cybersecurity program is continuously evaluated and improved.", level: 3 }
    ];

    for (const r of requirements) {
        const { categoryCode, ...rest } = r;
        const catId = getCatId(categoryCode);
        if (!catId) {
            console.warn(`⚠️ Category not found for practice: ${categoryCode}`);
            continue;
        }

        const data = { ...rest, categoryId: catId };
        const existing = await db.select().from(maturitySchema.maturityRequirements)
            .where(and(eq(maturitySchema.maturityRequirements.frameworkId, r.frameworkId), eq(maturitySchema.maturityRequirements.code, r.code)))
            .limit(1);

        if (existing.length === 0) {
            await db.insert(maturitySchema.maturityRequirements).values(data);
        } else {
            await db.update(maturitySchema.maturityRequirements).set(data).where(eq(maturitySchema.maturityRequirements.id, existing[0].id));
        }
    }
    console.log(`✅ Seeded ${requirements.length} requirements`);

    console.log("🏁 C2M2 Seeding Finished!");
    process.exit(0);
}

main().catch(e => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
});
