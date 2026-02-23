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

async function seedSampleTemplate() {
    console.log("Seeding Master Sample Policy Template...");

    const db = await getDb();
    const templateId = "POL-SAMPLE-001";

    const tailoringQuestions = [
        {
            id: "cloud_environment",
            question: "Primary Cloud Infrastructure Provider?",
            type: "select",
            options: ["AWS", "Azure", "Google Cloud", "On-Premises"],
            defaultValue: "AWS"
        },
        {
            id: "biometrics_enabled",
            question: "Is biometric authentication (FaceID/Fingerprint) enabled for mobile devices?",
            type: "boolean",
            defaultValue: false
        },
        {
            id: "staff_count",
            question: "Approximate total headcount (contractors included)?",
            type: "number",
            defaultValue: 25
        },
        {
            id: "data_privacy_officer",
            question: "Designated Data Privacy Officer (DPO) Full Name?",
            type: "text",
            defaultValue: "John Doe"
        }
    ];

    const sections = [
        {
            title: "Policy Ownership",
            content: "<h2>1. Policy Ownership</h2><p>This policy is maintained and reviewed by <strong>{{data_privacy_officer}}</strong>. With a staff count of approximately <strong>{{staff_count}}</strong>, it is the DPO's responsibility to ensure annual training is completed.</p>",
            defaultEnabled: true
        },
        {
            title: "Cloud Infrastructure Security",
            content: "<h2>2. Infrastructure Security</h2><p>As the organization primarily utilizes <strong>{{cloud_environment}}</strong>, all infrastructure-as-code must be reviewed for misconfigurations before deployment to production environments.</p>",
            defaultEnabled: true,
            condition: "cloud_environment != 'On-Premises'"
        },
        {
            title: "Physical Server Room Security",
            content: "<h2>2. Physical Server Security</h2><p>Since the organization maintains physical hardware (On-Premises), a strict visitor log must be maintained and CCTV footage kept for at least 90 days.</p>",
            defaultEnabled: true,
            condition: "cloud_environment == 'On-Premises'"
        },
        {
            title: "Biometric Access Controls",
            content: "<h2>3. Advanced Identity Management</h2><p>Biometric authentication is leveraged to provide an additional layer of security for mobile device management (MDM) enrolled hardware.</p>",
            defaultEnabled: true,
            condition: "biometrics_enabled == true"
        },
        {
            title: "Standard Access Control",
            content: "<h2>3. Identity Management</h2><p>Access control is managed via traditional MFA and strong password policies, ensuring consistent security across all endpoints.</p>",
            defaultEnabled: true,
            condition: "biometrics_enabled == false"
        }
    ];

    const [existing] = await db.select().from(policyTemplates).where(eq(policyTemplates.templateId, templateId));

    const templateData = {
        templateId,
        name: "Master Intelligent Security Policy",
        frameworks: ["ISO 27001", "SOC 2", "NIST CSF"],
        sections,
        tailoringQuestions,
        isPublic: true,
        ownerId: 1, // Defaulting to first user/admin
        content: "" // Using modular sections
    };

    if (existing) {
        await db.update(policyTemplates)
            .set(templateData)
            .where(eq(policyTemplates.templateId, templateId));
        console.log("Updated existing master sample template.");
    } else {
        await db.insert(policyTemplates).values(templateData);
        console.log("Created new master sample template.");
    }

    console.log("Seed complete! You can now find 'Master Intelligent Security Policy' in the Policy Templates page.");
    process.exit(0);
}

seedSampleTemplate().catch(err => {
    console.error(err);
    process.exit(1);
});
