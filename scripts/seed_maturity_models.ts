import { getDb } from "../packages/core/src/db";
import * as maturitySchema from "../packages/core/src/db/maturity-schema";
import { eq, and } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 Seeding Maturity Models...");
    const db = await getDb();

    // 1. NIST CSF 2.0
    const nistCsf2 = {
        id: "nist-csf-2",
        name: "NIST CSF 2.0",
        description: "National Institute of Standards and Technology Cybersecurity Framework Version 2.0",
        version: "2.0",
        logo: "/frameworks/nist.svg",
        levels: [
            { level: 1, name: "Partial", description: "Risk management is informal and ad-hoc." },
            { level: 2, name: "Risk Informed", description: "Risk management practices are approved but not organization-wide." },
            { level: 3, name: "Repeatable", description: "Risk management practices are formally approved and expressed as policy." },
            { level: 4, name: "Adaptive", description: "The organization adapts its cybersecurity practices based on lessons learned and predictive indicators." }
        ],
        status: "active" as const
    };

    const nistCategories = [
        { frameworkId: "nist-csf-2", code: "GV", name: "Govern", description: "Establish and monitor the organization's cybersecurity risk management strategy, expectations, and policy.", order: 1 },
        { frameworkId: "nist-csf-2", code: "ID", name: "Identify", description: "Help determine the current cybersecurity risk to the organization.", order: 2 },
        { frameworkId: "nist-csf-2", code: "PR", name: "Protect", description: "Use safeguards to prevent or reduce cybersecurity risk.", order: 3 },
        { frameworkId: "nist-csf-2", code: "DE", name: "Detect", description: "Find and analyze possible cybersecurity attacks and compromises.", order: 4 },
        { frameworkId: "nist-csf-2", code: "RS", name: "Respond", description: "Take action regarding a detected cybersecurity incident.", order: 5 },
        { frameworkId: "nist-csf-2", code: "RC", name: "Recover", description: "Restore assets and operations that were impacted by a cybersecurity incident.", order: 6 }
    ];

    // 2. CISA Zero Trust Maturity Model 2.0
    const ztmm2 = {
        id: "cisa-ztmm-2",
        name: "CISA Zero Trust Maturity Model 2.0",
        description: "Cybersecurity and Infrastructure Security Agency Zero Trust Maturity Model Version 2.0",
        version: "2.0",
        logo: "/frameworks/cisa.svg",
        levels: [
            { level: 1, name: "Traditional", description: "Manual configurations and static policies." },
            { level: 2, name: "Initial", description: "Starting to automate attribute assignment and configuration lifecycles." },
            { level: 3, name: "Advanced", description: "Centralized visibility and identity control across the enterprise." },
            { level: 4, name: "Optimal", description: "Fully automated, just-in-time lifecycles and dynamic policies." }
        ],
        status: "active" as const
    };

    const ztCategories = [
        { frameworkId: "cisa-ztmm-2", code: "ID", name: "Identity", description: "Verifying and authenticating users and their associated attributes.", order: 1 },
        { frameworkId: "cisa-ztmm-2", code: "DV", name: "Devices", description: "Ensuring devices are secure and properly managed.", order: 2 },
        { frameworkId: "cisa-ztmm-2", code: "NW", name: "Networks", description: "Managing internal and external network traffic.", order: 3 },
        { frameworkId: "cisa-ztmm-2", code: "APP", name: "Applications & Workloads", description: "Securing applications and services.", order: 4 },
        { frameworkId: "cisa-ztmm-2", code: "DT", name: "Data", description: "Protecting data at rest and in transit.", order: 5 }
    ];

    // 3. CMMC 2.0
    const cmmc2 = {
        id: "cmmc-2",
        name: "CMMC 2.0",
        description: "Cybersecurity Maturity Model Certification Version 2.0",
        version: "2.0",
        logo: "/cmmc-logo.png",
        levels: [
            { level: 1, name: "Foundational", description: "Basic safeguarding of FCI (Federal Contract Information)." },
            { level: 2, name: "Advanced", description: "Protecting CUI (Controlled Unclassified Information)." },
            { level: 3, name: "Expert", description: "Protecting CUI against APTs (Advanced Persistent Threats)." }
        ],
        status: "active" as const
    };

    const cmmcCategories = [
        { frameworkId: "cmmc-2", code: "AC", name: "Access Control", description: "Establishing who can access what information and systems.", order: 1 },
        { frameworkId: "cmmc-2", code: "IA", name: "Identification and Authentication", description: "Ensuring users and devices are who they say they are.", order: 2 },
        { frameworkId: "cmmc-2", code: "SC", name: "System and Communications Protection", description: "Protecting information as it is transmitted and stored.", order: 3 },
        { frameworkId: "cmmc-2", code: "SI", name: "System and Information Integrity", description: "Ensuring systems and information are not changed without authorization.", order: 4 }
    ];

    // 4. C2M2 V2.1
    const c2m2 = {
        id: "c2m2-2.1",
        name: "C2M2 V2.1",
        description: "Cybersecurity Capability Maturity Model Version 2.1",
        version: "2.1",
        logo: "/frameworks/c2m2.svg",
        levels: [
            { level: 1, name: "MIL 1", description: "Initial implementation of practices." },
            { level: 2, name: "MIL 2", description: "Practices are documented and guided by policy." },
            { level: 3, name: "MIL 3", description: "Practices are managed and institutionalized." }
        ],
        status: "active" as const
    };

    const c2m2Categories = [
        { frameworkId: "c2m2-2.1", code: "ASSET", name: "Asset, Change, and Configuration Management", description: "Manage IT and OT assets and change control.", order: 1 },
        { frameworkId: "c2m2-2.1", code: "THREAT", name: "Threat and Vulnerability Management", description: "Identify and mitigate threats and vulnerabilities.", order: 2 },
        { frameworkId: "c2m2-2.1", code: "RISK", name: "Risk Management", description: "Identify, analyze, and mitigate cybersecurity risk.", order: 3 },
        { frameworkId: "c2m2-2.1", code: "ACCESS", name: "Identity and Access Management", description: "Manage identities and control access to assets.", order: 4 },
        { frameworkId: "c2m2-2.1", code: "SITUATION", name: "Situational Awareness", description: "Maintain awareness of cybersecurity status.", order: 5 },
        { frameworkId: "c2m2-2.1", code: "RESPONSE", name: "Event and Incident Response", description: "Detect, analyze, and respond to events/incidents.", order: 6 },
        { frameworkId: "c2m2-2.1", code: "THIRD-PARTIES", name: "Supply Chain Risk Management", description: "Manage risk from third-party partners and suppliers.", order: 7 },
        { frameworkId: "c2m2-2.1", code: "WORKFORCE", name: "Workforce Management", description: "Manage cybersecurity workforce and training.", order: 8 },
        { frameworkId: "c2m2-2.1", code: "ARCHITECTURE", name: "Cybersecurity Architecture", description: "Design and implement secure architecture.", order: 9 },
        { frameworkId: "c2m2-2.1", code: "PROGRAM", name: "Cybersecurity Program Management", description: "Manage the enterprise cybersecurity program.", order: 10 }
    ];

    // Seed Frameworks
    const frameworks = [nistCsf2, ztmm2, cmmc2, c2m2];
    for (const f of frameworks) {
        await db.insert(maturitySchema.maturityFrameworks).values(f as any).onConflictDoUpdate({
            target: maturitySchema.maturityFrameworks.id,
            set: f as any
        });
        console.log(`✅ Seeded framework: ${f.name}`);
    }

    // Seed Categories
    const categories = [...nistCategories, ...ztCategories, ...cmmcCategories, ...c2m2Categories];
    for (const c of categories) {
        // Find existing or insert
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

    // Helper functions for seeding requirements
    const insertedCats = await db.select().from(maturitySchema.maturityCategories);
    const getCatId = (fId: string, code: string) => insertedCats.find((c: any) => c.frameworkId === fId && c.code === code)?.id;

    // 4. Sample Requirements for NIST CSF 2.0
    const nistReqs = [
        { frameworkId: "nist-csf-2", categoryCode: "GV", code: "GV.OC-01", title: "Organizational Context", description: "The organizational mission is understood and informs cybersecurity risk management.", level: 1 },
        { frameworkId: "nist-csf-2", categoryCode: "GV", code: "GV.RR-01", title: "Roles & Responsibilities", description: "Organizational leadership is responsible and accountable for cybersecurity risk.", level: 2 },
        { frameworkId: "nist-csf-2", categoryCode: "PR", code: "PR.AA-01", title: "Identity Management", description: "Identities and credentials for authorized users, services, and hardware are managed.", level: 1 },
        { frameworkId: "nist-csf-2", categoryCode: "DE", code: "DE.CM-01", title: "Continuous Monitoring", description: "Networks and network services are monitored to find potentially adverse events.", level: 2 }
    ];

    // 5. Sample Requirements for ZTMM 2.0
    const ztReqs = [
        { frameworkId: "cisa-ztmm-2", categoryCode: "ID", code: "ZT.ID.1", title: "Authentication", description: "Agency authenticates identities using passwords or multi-factor authentication (MFA).", level: 1 },
        { frameworkId: "cisa-ztmm-2", categoryCode: "ID", code: "ZT.ID.2", title: "Identity Store", description: "Agency utilizes a centralized identity store for all users.", level: 2 },
        { frameworkId: "cisa-ztmm-2", categoryCode: "DV", code: "ZT.DV.1", title: "Inventory Management", description: "Agency maintains a complete inventory of all organizational devices.", level: 2 }
    ];

    // 6. Sample Requirements for CMMC 2.0 (based on Level 1 & 2)
    const cmmcReqs = [
        { frameworkId: "cmmc-2", categoryCode: "AC", code: "AC.L1-3.1.1", title: "Limit system access to authorized users", description: "Limit information system access to authorized users, processes, or devices.", level: 1 },
        { frameworkId: "cmmc-2", categoryCode: "IA", code: "IA.L1-3.5.1", title: "Identify information system users", description: "Identify information system users, processes acting on behalf of users, or devices.", level: 1 },
        { frameworkId: "cmmc-2", categoryCode: "SC", code: "SC.L1-3.13.1", title: "Monitor and protect communications", description: "Monitor, control, and protect organizational communications at external boundaries.", level: 1 }
    ];

    // 7. Sample Requirements for C2M2 V2.1
    const c2m2Reqs = [
        { frameworkId: "c2m2-2.1", categoryCode: "ASSET", code: "ASSET-1.1", title: "Asset Inventory", description: "IT and OT assets are identified and prioritized.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "RISK", code: "RISK-1.1", title: "Risk Identification", description: "Cybersecurity risks are identified and documented.", level: 1 },
        { frameworkId: "c2m2-2.1", categoryCode: "ACCESS", code: "ACCESS-2.1", title: "Access Policies", description: "Policies for identity and access management are documented.", level: 2 }
    ];

    const allReqs = [...nistReqs, ...ztReqs, ...cmmcReqs, ...c2m2Reqs];
    for (const r of allReqs) {
        const { categoryCode, ...rest } = r;
        const catId = getCatId(r.frameworkId, categoryCode);
        if (!catId) {
            console.warn(`⚠️ Category not found: ${r.frameworkId} - ${categoryCode}`);
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
    console.log(`✅ Seeded ${allReqs.length} sample requirements`);

    console.log("🏁 Seeding Finished!");
    process.exit(0);
}

main().catch(e => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
});
