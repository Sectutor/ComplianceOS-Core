
import 'dotenv/config';
import { getDb } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();
    console.log("🧹 Clearing framework requirements...");
    await db.delete(schema.frameworkRequirements);
    console.log("✅ Requirements cleared.");

    // Now re-run the seeding logic (importing or copying here)
    // I'll just copy the core logic since it's easier than handling exports for a script

    // Unified Phases for all frameworks
    const pdcaPhases = [
        { name: "Plan", order: 1, description: "Establish objectives, context, and risk assessment." },
        { name: "Do", order: 2, description: "Implement risk treatment and controls." },
        { name: "Check", order: 3, description: "Monitor, measure, and evaluate performance." },
        { name: "Act", order: 4, description: "Corrective actions and continual improvement." }
    ];

    // ISO 27001 Requirements
    const isoFw = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "ISO27001")
    });

    if (isoFw) {
        // Ensure standard PDCA phases exist for ISO
        for (const pdca of pdcaPhases) {
            let phase = await db.query.implementationPhases.findFirst({
                where: (p: any, { and, eq }: any) => and(eq(p.frameworkId, isoFw.id), eq(p.name, pdca.name))
            });
            if (!phase) {
                const [newPhase] = await db.insert(schema.implementationPhases).values({ frameworkId: isoFw.id, ...pdca }).returning();
                phase = newPhase;
            }
            const reqs = getISORequirements(phase.name);
            for (const r of reqs) {
                await db.insert(schema.frameworkRequirements).values({ frameworkId: isoFw.id, phaseId: phase.id, ...r });
            }
        }
        console.log("✅ ISO 27001 Re-seeded (PDCA).");
    }

    // SOC 2 Requirements
    const soc2Fw = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "SOC2")
    });

    if (soc2Fw) {
        await db.delete(schema.implementationPhases).where(eq(schema.implementationPhases.frameworkId, soc2Fw.id));

        for (const pdca of pdcaPhases) {
            const [phase] = await db.insert(schema.implementationPhases).values({ frameworkId: soc2Fw.id, ...pdca }).returning();
            const reqs = getSOC2Requirements(phase.name);
            for (const r of reqs) {
                await db.insert(schema.frameworkRequirements).values({ frameworkId: soc2Fw.id, phaseId: phase.id, ...r });
            }
        }
        console.log("✅ SOC 2 Re-seeded (PDCA).");
    }

    // GDPR Requirements
    const gdprFw = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "GDPR")
    });

    if (gdprFw) {
        await db.delete(schema.implementationPhases).where(eq(schema.implementationPhases.frameworkId, gdprFw.id));

        for (const pdca of pdcaPhases) {
            const [phase] = await db.insert(schema.implementationPhases).values({ frameworkId: gdprFw.id, ...pdca }).returning();
            const reqs = getGDPRRequirements(phase.name);
            for (const r of reqs) {
                await db.insert(schema.frameworkRequirements).values({ frameworkId: gdprFw.id, phaseId: phase.id, ...r });
            }
        }
        console.log("✅ GDPR Re-seeded (PDCA).");
    }

    // NIST CSF 2.0 Requirements
    const nistFw = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "NISTCSF")
    });

    if (nistFw) {
        await db.delete(schema.implementationPhases).where(eq(schema.implementationPhases.frameworkId, nistFw.id));

        for (const pdca of pdcaPhases) {
            const [phase] = await db.insert(schema.implementationPhases).values({ frameworkId: nistFw.id, ...pdca }).returning();
            const reqs = getNISTRequirements(phase.name);
            for (const r of reqs) {
                await db.insert(schema.frameworkRequirements).values({ frameworkId: nistFw.id, phaseId: phase.id, ...r });
            }
        }
        console.log("✅ NIST CSF 2.0 Re-seeded (PDCA).");
    }

    process.exit(0);
}

function getGDPRRequirements(phase: string) {
    switch (phase) {
        case 'Plan':
            return [
                { identifier: "Art. 30", title: "Records of Processing Activities (ROPA)", description: "Compile a detailed inventory of all personal data categories and processing purposes.", mappingTags: ["Governance"] },
                { identifier: "Art. 35", title: "Data Protection Impact Assessment (DPIA)", description: "Identify and assess risks to data subjects before commencing high-risk processing.", mappingTags: ["Risk Assessment"] },
                { identifier: "Art. 37", title: "Designation of DPO", description: "Appoint a Data Protection Officer to oversee legal and regulatory compliance.", mappingTags: ["Governance"] },
                { identifier: "Art. 5 & 24", title: "Accountability Framework", description: "Establish the principles and overall responsibility for data protection compliance.", mappingTags: ["Principles"] },
                { identifier: "Art. 6", title: "Lawfulness of Processing", description: "Document the legal basis for each processing activity.", mappingTags: ["Lawfulness"] }
            ];
        case 'Do':
            return [
                { identifier: "Art. 12-14", title: "Transparency & Privacy Notices", description: "Deploy clear and accessible information to data subjects about processing activities.", mappingTags: ["Transparency"] },
                { identifier: "Art. 15-21", title: "Data Subject Rights Workflows", description: "Operationalize requests for Access, Rectification, Erasure, and Portability.", mappingTags: ["Rights"] },
                { identifier: "Art. 25", title: "Data Protection by Design & Default", description: "Integrate privacy controls into the technical design of products and services.", mappingTags: ["Privacy by Design"] },
                { identifier: "Art. 32", title: "Security of Processing (TOMs)", description: "Implement appropriate technical and organizational measures.", mappingTags: ["Security"] },
                { identifier: "Art. 44-49", title: "International Data Transfers", description: "Implement safeguards for data leaving the EEA.", mappingTags: ["Transfers"] }
            ];
        case 'Check':
            return [
                { identifier: "Art. 32 (Monitoring)", title: "Security Control Verification", description: "Regularly test and evaluate the effectiveness of security measures.", mappingTags: ["Monitoring"] },
                { identifier: "Art. 30 (Review)", title: "ROPA Maintenance & Audit", description: "Periodically audit the records of processing to ensure they reflect reality.", mappingTags: ["Audit"] }
            ];
        case 'Act':
            return [
                { identifier: "Art. 33", title: "Data Breach Notification (72h)", description: "Procedures to notify authorities and subjects of qualifying breaches.", mappingTags: ["Incident Management"] },
                { identifier: "Improvement", title: "Continual Improvement", description: "Regularly update privacy strategies based on internal reviews.", mappingTags: ["Improvement"] }
            ];
        default: return [];
    }
}

function getNISTRequirements(phase: string) {
    switch (phase) {
        case 'Plan':
            return [
                { identifier: "NIST-GV-1", title: "Establish Cybersecurity Governance", description: "Define organizational cybersecurity policy and strategy.", mappingTags: ["Governance"] },
                { identifier: "NIST-ID-1", title: "Asset Management Inventory", description: "Identify and manage physical and software assets.", mappingTags: ["Inventory"] },
                { identifier: "NIST-ID-RA", title: "Risk Assessment Process", description: "Establish a process to identify and evaluate cybersecurity risks.", mappingTags: ["Risk Assessment"] }
            ];
        case 'Do':
            return [
                { identifier: "NIST-PR-AC", title: "Access Control Implementation", description: "Manage identities and logical/physical access.", mappingTags: ["Security"] },
                { identifier: "NIST-PR-DS", title: "Data Security Protection", description: "Implement technology to ensure information integrity and confidentiality.", mappingTags: ["Security"] },
                { identifier: "NIST-PR-AT", title: "Awareness & Training", description: "Provide cybersecurity education to all personnel.", mappingTags: ["Training"] }
            ];
        case 'Check':
            return [
                { identifier: "NIST-DE-AE", title: "Anomalies and Events Detection", description: "Monitor for anomalies and understand their impact.", mappingTags: ["Monitoring"] },
                { identifier: "NIST-DE-CM", title: "Continuous Security Monitoring", description: "Monitor information assets and networks for security events.", mappingTags: ["Monitoring"] }
            ];
        case 'Act':
            return [
                { identifier: "NIST-RS-RP", title: "Response Planning", description: "Maintain and test response processes for execution during events.", mappingTags: ["Incident Management"] },
                { identifier: "NIST-RC-RP", title: "Recovery Planning", description: "Execute recovery processes to ensure restoration of systems.", mappingTags: ["Disaster Recovery"] }
            ];
        default: return [];
    }
}

function getISORequirements(phase: string) {
    switch (phase) {
        case 'Plan':
            return [
                { identifier: "ISO-4.1", title: "Understanding the Organization and its Context", description: "Identify internal and external issues relevant to information security." },
                { identifier: "ISO-4.2", title: "Understanding Interested Parties", description: "Identify requirements from customers, regulators, and employees." },
                { identifier: "ISO-4.3", title: "Determining ISMS Scope", description: "Define boundaries for the Information Security Management System." },
                { identifier: "ISO-5.1", title: "Leadership and Commitment", description: "Establish top management accountability and resource allocation." },
                { identifier: "ISO-5.2", title: "Information Security Policy", description: "Develop and communicate a core security policy." },
                { identifier: "ISO-5.3", title: "Organizational Roles and Responsibilities", description: "Assign security authority and reporting lines." },
                { identifier: "ISO-6.1.2", title: "Information Security Risk Assessment", description: "Identify, analyze and evaluate risks to information." },
                { identifier: "ISO-6.1.3", title: "Information Security Risk Treatment", description: "Select controls and produce a Statement of Applicability (SoA)." },
                { identifier: "ISO-6.2", title: "Information Security Objectives", description: "Set measurable security goals across the organization." }
            ];
        case 'Do':
            return [
                { identifier: "ISO-7.1", title: "Resources for ISMS", description: "Ensure adequate budget, personnel, and infrastructure." },
                { identifier: "ISO-7.2", title: "Competence and Training", description: "Verify staff have the skills for their security roles." },
                { identifier: "ISO-7.3", title: "Security Awareness", description: "Regular training on security policies and social engineering." },
                { identifier: "ISO-8.1", title: "Operational Planning and Control", description: "Implement processes for risk treatment and control execution." },
                { identifier: "ISO-8.2", title: "Risk Assessment (Periodic)", description: "Perform assessments at planned intervals or after changes." },
                { identifier: "ISO-A.5", title: "Organizational Controls Implementation", description: "Deploy 37 core organizational controls from Annex A." },
                { identifier: "ISO-A.6", title: "People Controls Implementation", description: "Deploy 8 core personnel controls from Annex A." },
                { identifier: "ISO-A.7", title: "Physical Controls Implementation", description: "Deploy 14 core physical controls from Annex A." },
                { identifier: "ISO-A.8", title: "Technological Controls Implementation", description: "Deploy 34 core technical controls from Annex A." }
            ];
        case 'Check':
            return [
                { identifier: "ISO-9.1", title: "Monitoring and Measurement", description: "Identify KPIs and metrics to evaluate ISMS effectiveness." },
                { identifier: "ISO-9.2", title: "Internal Audit", description: "Periodic internal review to ensure compliance with the standard." },
                { identifier: "ISO-9.3", title: "Management Review", description: "Leadership review of ISMS performance and audit results." },
                { identifier: "ISO-C4", title: "Vulnerability Scanning", description: "Perform regular technical scans to identify security weaknesses." },
                { identifier: "ISO-C5", title: "Security Log Monitoring", description: "Review audit logs and monitoring data for anomalies." }
            ];
        case 'Act':
            return [
                { identifier: "ISO-10.1", title: "Continual Improvement", description: "Periodically enhance ISMS suitability and adequacy." },
                { identifier: "ISO-10.2", title: "Nonconformity and Corrective Action", description: "React to failures and prevent their recurrence." },
                { identifier: "ISO-A.4", title: "Corrective Action Tracking", description: "Maintain a log of all security improvements and their status." }
            ];
        default: return [];
    }
}

function getSOC2Requirements(phase: string) {
    switch (phase) {
        case 'Plan':
            return [
                { identifier: "SOC2-CC1", title: "Control Environment (CC1)", description: "Ethics, integrity, and management oversight setup.", mappingTags: ["Security"] },
                { identifier: "SOC2-CC2", title: "Communication and Information (CC2)", description: "Ensuring roles and objectives are communicated.", mappingTags: ["Security"] },
                { identifier: "SOC2-CC3", title: "Risk Assessment Process (CC3)", description: "Defining threats and evaluating change impact.", mappingTags: ["Security"] }
            ];
        case 'Do':
            return [
                { identifier: "SOC2-CC6", title: "Logical & Physical Access (CC6)", description: "Restricting access to authorized users and devices.", mappingTags: ["Security"] },
                { identifier: "SOC2-CC7", title: "System Operations (CC7)", description: "Monitoring, incident management, and vulnerability remediation.", mappingTags: ["Security"] },
                { identifier: "SOC2-CC8", title: "Change Management (CC8)", description: "Development, testing, and deployment lifecycle controls.", mappingTags: ["Security"] },
                { identifier: "SOC2-A1", title: "Availability Baseline", description: "Capacity management and disaster recovery setup.", mappingTags: ["Availability"] },
                { identifier: "SOC2-C1", title: "Confidentiality & Data Privacy", description: "Encryption, data mapping, and disposal procedures.", mappingTags: ["Confidentiality"] },
                { identifier: "SOC2-PI1", title: "Processing Integrity Rules", description: "Inputs, processing, and output validation logic.", mappingTags: ["Integrity"] },
                { identifier: "SOC2-P1", title: "Privacy Notice & Consent", description: "External notices and user consent tracking.", mappingTags: ["Privacy"] }
            ];
        case 'Check':
            return [
                { identifier: "SOC2-O1", title: "Evidence Collection Workflows", description: "Standardizing how evidence is captured during the review period.", mappingTags: ["Security"] },
                { identifier: "SOC2-CC4", title: "Monitoring Activities (CC4)", description: "Ongoing evaluations of the internal control system.", mappingTags: ["Security"] }
            ];
        case 'Act':
            return [
                { identifier: "SOC2-F1", title: "Management Assertion", description: "Formally asserting the system description and control effectiveness.", mappingTags: ["Security"] },
                { identifier: "SOC2-F2", title: "Review of Draft Report", description: "Collaborating with auditors on the final Type II report.", mappingTags: ["Security"] }
            ];
        default: return [];
    }
}

main();
