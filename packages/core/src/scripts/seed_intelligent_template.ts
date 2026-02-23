import { getDb } from "../db";
import { policyTemplates } from "../schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

import fs from "fs";

if (fs.existsSync(".env.local")) {
    dotenv.config({ path: ".env.local" });
} else {
    dotenv.config();
}

async function seedIntelligentTemplate() {
    console.log("Seeding Intelligent Access Control Template...");

    const db = await getDb();
    const templateId = "POL-INTEL-001";

    const sections = [
        {
            title: "Purpose",
            content: "<p>The purpose of this policy is to establish controls for managing access to {{COMPANY_NAME}}'s systems and data.</p>",
            defaultEnabled: true
        },
        {
            title: "Scope",
            content: "<p>This policy applies to all employees and contractors of {{COMPANY_NAME}}.</p>",
            defaultEnabled: true
        },
        {
            title: "Physical Data Center Security",
            content: "<h3>Physical Protection</h3><p>Since you do NOT use cloud servers exclusively, you are responsible for the physical security of your server room. This includes badge access, CCTV, and environmental controls.</p>",
            defaultEnabled: true,
            condition: "usesCloud == false"
        },
        {
            title: "Cloud Infrastructure Protection",
            content: "<h3>Cloud Security Pillar</h3><p>As a organization that utilizes cloud infrastructure, we rely on our provider's physical security (SOC 2 Type II) and focus on identity management and bucket encryption.</p>",
            defaultEnabled: true,
            condition: "usesCloud == true"
        },
        {
            title: "MFA Requirements",
            content: "<p>MFA is required for all access to {{COMPANY_NAME}}'s resources. Our primary MFA vendor is {{mfaVendor}}.</p>",
            defaultEnabled: true
        }
    ];

    const tailoringQuestions = [
        {
            id: "usesCloud",
            question: "Does the organization use cloud infrastructure (AWS/Azure/GCP)?",
            type: "boolean",
            defaultValue: true,
            category: "Infrastructure"
        },
        {
            id: "mfaVendor",
            question: "What is your primary MFA provider?",
            type: "select",
            options: ["Okta", "Microsoft Authenticator", "Duo", "Google Authenticator"],
            defaultValue: "Okta",
            category: "Security Tools"
        }
    ];

    const [existing] = await db.select().from(policyTemplates).where(eq(policyTemplates.templateId, templateId));

    if (existing) {
        await db.update(policyTemplates)
            .set({
                name: "Intelligent Access Control Policy",
                sections,
                tailoringQuestions,
                frameworks: ["ISO 27001", "SOC 2"]
            })
            .where(eq(policyTemplates.templateId, templateId));
        console.log("Updated existing template.");
    } else {
        await db.insert(policyTemplates).values({
            templateId,
            name: "Intelligent Access Control Policy",
            sections,
            tailoringQuestions,
            frameworks: ["ISO 27001", "SOC 2"],
            ownerId: 1, // Assume first admin
            isPublic: true,
            content: "" // Modular
        });
        console.log("Created new template.");
    }

    process.exit(0);
}

seedIntelligentTemplate().catch(err => {
    console.error(err);
    process.exit(1);
});
