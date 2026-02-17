import 'dotenv/config';
import { getDb } from './db';
import { controls, policyTemplates } from './schema';
import { sql } from 'drizzle-orm';

async function seed() {
    const db = await getDb();
    if (!db) {
        console.error("No DB connection");
        process.exit(1);
    }

    console.log("--- Seeding Controls ---");
    const [controlCount] = await db.select({ count: sql<number>`count(*)` }).from(controls);
    const controlCountNum = parseInt(String(controlCount?.count || 0), 10);
    console.log(`Current controls: ${controlCountNum}`);

    if (controlCountNum === 0) {
        const defaultControls = [
            { controlId: "A.5-Policies", name: "Information Security Policies", description: "Establish and maintain information security policies.", framework: "ISO 27001", category: "Policy" },
            { controlId: "A.6-Organization", name: "Organization of Information Security", description: "Establish internal roles and responsibilities.", framework: "ISO 27001", category: "Organization" },
            { controlId: "A.7-HR", name: "Human Resource Security", description: "Ensure personnel understand their security responsibilities.", framework: "ISO 27001", category: "Human Resources" },
            { controlId: "A.8-Asset", name: "Asset Management", description: "Identify and protect organizational assets.", framework: "ISO 27001", category: "Asset Management" },
            { controlId: "CC1", name: "Common Criteria 1 - Control Environment", description: "The organization demonstrates commitment to integrity and ethical values.", framework: "SOC 2", category: "Trust Services Criteria" },
            { controlId: "CC2", name: "Common Criteria 2 - Communication", description: "The organization communicates information internally and externally.", framework: "SOC 2", category: "Trust Services Criteria" },
            { controlId: "CC3", name: "Common Criteria 3 - Risk Assessment", description: "The organization assesses risk management objectives.", framework: "SOC 2", category: "Trust Services Criteria" },
        ];
        await db.insert(controls).values(defaultControls);
        console.log(`[Seed] Inserted ${defaultControls.length} default controls`);
    } else {
        console.log("[Seed] Controls already exist, skipping.");
    }

    console.log("--- Seeding Policy Templates ---");
    const [templateCount] = await db.select({ count: sql<number>`count(*)` }).from(policyTemplates);
    const templateCountNum = parseInt(String(templateCount?.count || 0), 10);
    console.log(`Current templates: ${templateCountNum}`);

    if (templateCountNum === 0) {
        const defaultTemplates = [
            { templateId: "1", name: "Information Security Policy", frameworks: ["ISO 27001", "SOC 2"], sections: [], content: "..." },
            { templateId: "2", name: "Access Control Policy", frameworks: ["ISO 27001"], sections: [], content: "..." },
            { templateId: "3", name: "Data Protection Policy", frameworks: ["SOC 2"], sections: [], content: "..." },
            { templateId: "4", name: "Incident Response Policy", frameworks: ["SOC 2"], sections: [], content: "..." },
            { templateId: "5", name: "Vendor Risk Management Policy", frameworks: ["SOC 2"], sections: [], content: "..." },
        ];
        await db.insert(policyTemplates).values(defaultTemplates);
        console.log(`[Seed] Inserted ${defaultTemplates.length} default policy templates`);
    } else {
        console.log("[Seed] Policy templates already exist, skipping.");
    }

    console.log("--- Seeding Complete ---");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed error:", err);
    process.exit(1);
});
