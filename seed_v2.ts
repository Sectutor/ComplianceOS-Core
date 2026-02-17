
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // Fallback to .env for other variables if not in .env.local
import { getDb } from "./packages/core/src/db";

import {
    clients, users, crmEngagements, crmActivities, crmContacts, userClients,
    controls, clientControls, evidence
} from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";

async function main() {
    console.log("Starting Compliance Simulation Seed V2...");
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed!");
        process.exit(1);
    }

    // 1. Create a "Demo Client" if not exists
    const [existingClient] = await db.select().from(clients).where(eq(clients.name, "Acme Corp Simulation")).limit(1);
    let client = existingClient;
    let clientId = client?.id;

    if (!client) {
        console.log("Creating Simulation Client: Acme Corp Simulation...");
        const [newClient] = await db.insert(clients).values({
            name: "Acme Corp Simulation",
            industry: "FinTech",
            description: "High-growth fintech startup preparing for SOC 2 Type 2.",
            activeModules: ["crm", "controls", "policies"]
        }).returning();
        client = newClient;
        clientId = newClient.id;
    }

    console.log("Working with Client ID:", clientId);

    // 2. Ensure a "Compliance Officer" user exists
    const [existingOfficer] = await db.select().from(users).where(eq(users.email, "sarah.compliance@acme-simulation.com")).limit(1);
    let officer = existingOfficer;

    if (!officer) {
        console.log("Creating Compliance Officer: Sarah Jenkins...");
        const [newOfficer] = await db.insert(users).values({
            email: "sarah.compliance@acme-simulation.com",
            name: "Sarah Jenkins",
            openId: "sim-user-001",
            role: "admin"
        }).returning();
        officer = newOfficer;

        // Assign to client
        await db.insert(userClients).values({
            userId: officer.id,
            clientId: clientId,
            role: "admin"
        });
    }

    // 3. Create Stakeholders
    const contactData = [
        { firstName: "Marcus", lastName: "Torres", email: "marcus.cto@acme-simulation.com", jobTitle: "CTO", category: "Internal Champion", notes: "Owns the infrastructure budget." },
        { firstName: "Emily", lastName: "Vance", email: "emily.auditor@trust-firm.com", jobTitle: "Lead Auditor", category: "External Auditor", notes: "Very strict on Access Control evidence." },
        { firstName: "David", lastName: "Chen", email: "david.sec@acme-simulation.com", jobTitle: "SecOps Lead", category: "Control Owner", notes: "Responsible for firewall configs." }
    ];

    for (const c of contactData) {
        const [existing] = await db.select().from(crmContacts).where(and(eq(crmContacts.clientId, clientId), eq(crmContacts.email, c.email))).limit(1);

        if (!existing) {
            await db.insert(crmContacts).values({
                clientId,
                ...c,
                isPrimary: c.jobTitle === "CTO"
            });
        }
    }
    console.log("Stakeholders verified.");

    // 4. Create the "SOC 2 Type 2 (2025)" Engagement
    const projectTitle = "SOC 2 Type 2 2025 Renewal";

    const [existingEngagement] = await db.select().from(crmEngagements).where(and(eq(crmEngagements.clientId, clientId), eq(crmEngagements.title, projectTitle))).limit(1);
    let engagement = existingEngagement;

    if (!engagement) {
        console.log("Creating Project: SOC 2 Type 2 2025...");
        const [newEngagement] = await db.insert(crmEngagements).values({
            clientId,
            title: projectTitle,
            framework: "SOC 2",
            stage: "audit_prep",
            priority: "high",
            progress: 85,
            owner: officer.name,
            targetDate: new Date("2025-12-15"),
            controlsCount: 15,
            mitigatedRisksCount: 12,
            createdAt: new Date("2025-01-10")
        }).returning();
        engagement = newEngagement;
    }

    // 5. Generate "Activity History"
    const activities = [
        {
            date: "2025-01-15T10:00:00Z",
            type: "meeting",
            subject: "Kickoff Meeting with CTO",
            content: "Defined scope for 2025 audit. Agreed to include new AI module in scope.",
            outcome: "Scope Approved"
        },
        {
            date: "2025-02-01T14:30:00Z",
            type: "email",
            subject: "Gap Analysis Report Sent",
            content: "Sent initial gap analysis to Marcus. Identified 3 missing controls in HR onboarding.",
            outcome: "Action Items Created"
        },
        {
            date: "2025-03-10T09:15:00Z",
            type: "task",
            subject: "Control Implementation: MFA",
            content: "David successfully enforced MFA on all production servers.",
            outcome: "Risk Mitigated"
        },
        {
            date: "2025-06-20T11:00:00Z",
            type: "call",
            subject: "Mid-Year Check-in",
            content: "Reviewed progress. 70% of evidence collected. Emily (Auditor) requested early access to logs.",
            outcome: "Access Granted"
        },
        {
            date: new Date().toISOString(),
            type: "note",
            subject: "Mock Audit Finding",
            content: "Internal review found missing signatures on Q3 Access Reviews. Need to fix before next week.",
            outcome: "Urgent Fix Required"
        }
    ];

    console.log("Seeding Activity History...");
    for (const act of activities) {
        // Simple check to avoid duplicates on re-runs
        const [existingAct] = await db.select().from(crmActivities).where(and(
            eq(crmActivities.clientId, clientId),
            eq(crmActivities.subject, act.subject),
            eq(crmActivities.occurredAt, new Date(act.date))
        )).limit(1);

        if (!existingAct) {
            await db.insert(crmActivities).values({
                clientId,
                userId: officer.id,
                type: act.type as any,
                subject: act.subject,
                content: act.content,
                outcome: act.outcome,
                occurredAt: new Date(act.date)
            });
        }
    }

    console.log("Simulation Data Seeded Successfully!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
