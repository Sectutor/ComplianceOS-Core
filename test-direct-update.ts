import { getDb } from "./packages/core/src/db";
import { riskScenarios } from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    const riskId = 178;
    const clientId = 3;

    console.log(`\n=== Testing Direct Update for Risk ${riskId} ===\n`);

    // Step 1: Read current state
    const [before] = await db.select().from(riskScenarios).where(eq(riskScenarios.id, riskId));
    console.log("BEFORE:", JSON.stringify({
        id: before.id,
        title: before.title,
        likelihood: before.likelihood,
        impact: before.impact,
        inherentScore: before.inherentScore,
        inherentRisk: before.inherentRisk,
    }, null, 2));

    // Step 2: Perform update (mimicking the mutation logic)
    const likelihood = 4;
    const impact = 5;
    const inherentScore = likelihood * impact;
    let inherentRisk = "Low";
    if (inherentScore >= 15) inherentRisk = "Critical";
    else if (inherentScore >= 9) inherentRisk = "High";
    else if (inherentScore >= 4) inherentRisk = "Medium";

    console.log(`\nUpdating with: likelihood=${likelihood}, impact=${impact}, inherentScore=${inherentScore}, inherentRisk=${inherentRisk}`);

    const [updated] = await db.update(riskScenarios)
        .set({
            likelihood: likelihood,
            impact: impact,
            inherentScore: inherentScore,
            inherentRisk: inherentRisk,
            updatedAt: new Date()
        } as any)
        .where(and(
            eq(riskScenarios.id, riskId),
            eq(riskScenarios.clientId, clientId)
        ))
        .returning();

    console.log("\nUPDATED RECORD:", JSON.stringify({
        id: updated?.id,
        title: updated?.title,
        likelihood: updated?.likelihood,
        impact: updated?.impact,
        inherentScore: updated?.inherentScore,
        inherentRisk: updated?.inherentRisk,
    }, null, 2));

    // Step 3: Verify by re-reading
    const [after] = await db.select().from(riskScenarios).where(eq(riskScenarios.id, riskId));
    console.log("\nVERIFICATION READ:", JSON.stringify({
        id: after.id,
        likelihood: after.likelihood,
        impact: after.impact,
        inherentScore: after.inherentScore,
        inherentRisk: after.inherentRisk,
    }, null, 2));

    process.exit(0);
}

run();
