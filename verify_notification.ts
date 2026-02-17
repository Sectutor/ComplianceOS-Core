
import { sendOverdueNotification, sendUpcomingNotification } from './emailNotification';
import * as db from './db';
import { riskAssessments, riskTreatments, clients } from './schema';
import { getDb } from './db';
import { eq } from 'drizzle-orm';

async function verifyNotifications() {
    console.log("Starting Notification Verification...");

    const dbClient = await getDb();
    if (!dbClient) {
        console.error("Failed to connect to DB");
        process.exit(1);
    }

    // 1. Get Client
    const [client] = await dbClient.select().from(clients).limit(1);
    if (!client) {
        console.error("No clients found. Please create a client first.");
        process.exit(1);
    }
    const clientId = client.id;
    console.log(`Using Client: ${client.name} (${clientId})`);

    // 2. Create Overdue Risk Assessment
    const riskId = `TEST-RISK-${Date.now()}`;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10); // 10 days overdue

    console.log(`Creating Overdue Risk Assessment (Due: ${pastDate.toISOString()})...`);
    const [risk] = await dbClient.insert(riskAssessments).values({
        clientId: clientId,
        assessmentId: riskId,
        threatDescription: "Verification Overdue Risk",
        status: "draft",
        nextReviewDate: pastDate,
        // Required fields based on schema if any, checking minimal insert
    }).returning();
    console.log(`Created Risk ID: ${risk.id}`);

    // 3. Create Overdue Treatment
    const treatmentDate = new Date();
    treatmentDate.setDate(treatmentDate.getDate() - 5); // 5 days overdue

    console.log(`Creating Overdue Treatment (Due: ${treatmentDate.toISOString()})...`);
    await dbClient.insert(riskTreatments).values({
        clientId: clientId,
        riskAssessmentId: risk.id,
        strategy: "Verification Overdue Treatment",
        status: "planned",
        dueDate: treatmentDate,
        treatmentType: "mitigate"
    });

    // 4. Test Overdue Notification
    console.log("\nTesting sendOverdueNotification()...");
    const result = await sendOverdueNotification();
    console.log("Overdue Result:", result);

    if (result.success && result.itemCount >= 2) {
        console.log("✅ SUCCESS: Overdue items detected.");
    } else {
        console.error("❌ FAILURE: Overdue items NOT detected properly.");
    }

    // 5. Cleanup
    console.log("\nCleaning up test data...");
    await dbClient.delete(riskTreatments).where(eq(riskTreatments.riskAssessmentId, risk.id));
    await dbClient.delete(riskAssessments).where(eq(riskAssessments.id, risk.id));
    console.log("Cleanup complete.");

    process.exit(0);
}

verifyNotifications().catch(e => {
    console.error("Verification Script Error:", e);
    process.exit(1);
});
