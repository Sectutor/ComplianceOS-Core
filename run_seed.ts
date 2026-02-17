
import "dotenv/config";
import { getDb } from "./packages/core/src/db";
import { evidence, clientControls } from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";

const seeds: Record<string, any[]> = {
    'ISO 27001': [
        { id: "REQ-ISO-01", title: "Organizational Chart", description: "Current organizational chart showing security reporting lines.", location: "HR/Admin" },
        { id: "REQ-ISO-02", title: "Information Security Policy", description: "Top-level information security policy approved by management.", location: "Security Portal" },
        { id: "REQ-ISO-03", title: "Risk Assessment Report", description: "Most recent information security risk assessment results.", location: "Risk Register" },
        { id: "REQ-ISO-04", title: "Inventory of Assets", description: "Comprehensive list of information assets and their owners.", location: "IT Asset Management" },
        { id: "REQ-ISO-05", title: "Acceptable Use Policy", description: "Policy defining rules for acceptable use of assets and information.", location: "HR/Security" },
        { id: "REQ-ISO-06", title: "Access Control Policy", description: "Documented rules for access control to information and systems.", location: "IT/Security" },
        { id: "REQ-ISO-07", title: "Password Management Policy", description: "Rules for password strength and management.", location: "IT/Security" },
        { id: "REQ-ISO-08", title: "Physical Security Policy", description: "Policies regarding physical access to offices and data centers.", location: "Facilities" },
        { id: "REQ-ISO-09", title: "BYOD Policy", description: "Rules for using personal devices for work purposes.", location: "IT/HR" },
        { id: "REQ-ISO-10", title: "Mobile Device Policy", description: "Security requirements for company-issued mobile devices.", location: "IT/Security" },
        { id: "REQ-ISO-11", title: "Background Check Records", description: "Logs confirming employee background checks were completed.", location: "HR" },
        { id: "REQ-ISO-12", title: "Security Awareness Training", description: "Records of security awareness training completion for all staff.", location: "HR/LMS" },
        { id: "REQ-ISO-13", title: "Disciplinary Process", description: "Documented process for reporting security policy violations.", location: "HR" },
        { id: "REQ-ISO-14", title: "Termination Checklist", description: "Standard checklist for removing access when employees leave.", location: "IT/HR" },
        { id: "REQ-ISO-15", title: "External Party Security", description: "Evidence of security requirements in vendor/third-party contracts.", location: "Procurement" },
        { id: "REQ-ISO-16", title: "Incident Management Procedure", description: "Steps for identifying and responding to security incidents.", location: "Security/SOC" },
        { id: "REQ-ISO-17", title: "Business Continuity Plan", description: "Documented plan for maintaining operations during a disruption.", location: "Risk/Operations" },
        { id: "REQ-ISO-18", title: "BCP Test Results", description: "Evidence that the business continuity plan has been tested.", location: "Risk/Operations" },
        { id: "REQ-ISO-19", title: "Compliance Review Records", description: "Logs of periodic compliance reviews for legal requirements.", location: "Compliance" },
        { id: "REQ-ISO-20", title: "Internal Audit Plan", description: "Schedule and scope for upcoming internal security audits.", location: "Audit/Compliance" },
        { id: "REQ-ISO-21", title: "Internal Audit Report", description: "Findings from the most recent internal security audit.", location: "Audit/Compliance" },
        { id: "REQ-ISO-22", title: "Management Review Minutes", description: "Evidence of management oversight of the ISMS.", location: "Leadership/CISO" },
        { id: "REQ-ISO-23", title: "Corrective Action Log", description: "Tracking of fixes for identified non-conformities.", location: "Compliance" },
    ]
};

async function run() {
    const clientId = 3;
    const framework = "ISO 27001";
    console.log(`[Seed Script] Running for Client ${clientId}, Framework ${framework}`);

    try {
        const dbConn = await getDb();
        const selectedRequests = seeds[framework] || seeds['ISO 27001'];

        // Fetch ONLY existing IDs for this client/framework to avoid duplicates
        const existing = await dbConn.select({ evidenceId: evidence.evidenceId }).from(evidence)
            .where(and(
                eq(evidence.clientId, clientId),
                eq(evidence.framework, framework)
            ));

        const existingIds = new Set(existing.map(e => e.evidenceId));
        console.log(`[Seed Script] Found ${existingIds.size} existing items`);

        // Filter out requests that already exist
        const insertData = selectedRequests
            .filter(r => !existingIds.has(r.id));

        console.log(`[Seed Script] Preparing to insert ${insertData.length} new items`);

        if (insertData.length > 0) {
            const insertPayload = insertData.map(r => ({
                clientId: clientId,
                clientControlId: 0, // Placeholder
                evidenceId: r.id,
                description: r.title,
                type: "file",
                status: "pending",
                owner: "auditor@complianceos.com",
                location: r.location,
                framework: framework,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await dbConn.insert(evidence).values(insertPayload as any);
            console.log(`[Seed Script] SUCCESSFULLY inserted ${insertPayload.length} items`);
        } else {
            console.log(`[Seed Script] NO new items to insert`);
        }

        process.exit(0);
    } catch (e) {
        console.error(`[Seed Script] FAILED:`, e);
        process.exit(1);
    }
}

run();
