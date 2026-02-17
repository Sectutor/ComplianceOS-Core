
import { config } from "dotenv";
config();
import { getDb } from "./packages/core/src/db";
import { remediationTasks } from "./packages/core/src/schema";

async function main() {
    console.log("Seeding Remediation Tasks (Blind Insert)...");
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed!");
        process.exit(1);
    }

    // Hardcoding IDs to avoid SELECT scanner errors
    const clientId = 6; // ACME INC (Main Test Client)
    const assigneeId = 1;

    console.log(`Targeting Client ID: ${clientId}`);

    const tasks = [
        {
            title: "Enable MFA for Admin Accounts",
            description: "Enforce Multi-Factor Authentication on all root and admin accounts in AWS.",
            priority: "high",
            status: "open",
            dueDate: new Date("2025-01-20"),
            assigneeId
        },
        {
            title: "Review Q4 Access Logs",
            description: "Perform quarterly review of access logs for sensitive data stores.",
            priority: "medium",
            status: "open",
            dueDate: new Date("2025-01-25"),
            assigneeId
        },
        {
            title: "Update Incident Response Plan",
            description: "Update the contact list and escalation paths in the IRP document.",
            priority: "medium",
            status: "in_progress",
            dueDate: new Date("2025-02-01"),
            assigneeId
        },
        {
            title: "Patch Web Server Vulnerabilities",
            description: "Apply security patches to Nginx servers identified in last scan.",
            priority: "critical",
            status: "open",
            dueDate: new Date("2025-01-15"),
            assigneeId
        },
        {
            title: "Conduct Phishing Simulation",
            description: "Run a company-wide phishing test to verify training effectiveness.",
            priority: "low",
            status: "open",
            dueDate: new Date("2025-03-01"),
            assigneeId
        }
    ];

    try {
        await db.insert(remediationTasks).values(tasks.map(t => ({ ...t, clientId })));
        console.log(`Successfully seeded ${tasks.length} tasks.`);
    } catch (e) {
        console.error("Error inserting tasks:", e);
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
