
import 'dotenv/config';
import { getDb } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();

    // 1. Find a client
    const client = await db.query.clients.findFirst();
    if (!client) {
        console.log("❌ No clients found in database!");
        process.exit(1);
    }

    // 2. Find GDPR framework
    const gdpr = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "GDPR")
    });

    if (!gdpr) {
        console.log("❌ GDPR framework not found!");
        process.exit(1);
    }

    // 3. Create a GDPR implementation plan
    const [plan] = await db.insert(schema.implementationPlans).values({
        clientId: client.id,
        frameworkId: gdpr.id,
        title: "GDPR Privacy Compliance Plan",
        description: "Official implementation of the General Data Protection Regulation (EU) 2016/679.",
        status: "planning",
        priority: "high",
        createdById: 1, // Assuming user 1 exists
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    }).returning();

    console.log(`✅ Created GDPR Implementation Plan: ${plan.title} (ID: ${plan.id}) for Client: ${client.name}`);

    process.exit(0);
}

main();
