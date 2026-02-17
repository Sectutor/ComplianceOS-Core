import { getDb } from "./packages/core/src/db";
import { sql, eq, and } from "drizzle-orm";
import { riskScenarios } from "./packages/core/src/schema";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    const riskId = 1; // From the dump earlier
    const clientId = 1; // Assuming client 1

    console.log(`Updating risk ${riskId}...`);

    try {
        const [updated] = await db.update(riskScenarios)
            .set({
                likelihood: 4,
                impact: 4,
                inherentScore: 16,
                inherentRisk: "Critical",
                updatedAt: new Date()
            } as any)
            .where(and(
                eq(riskScenarios.id, riskId),
                eq(riskScenarios.clientId, clientId)
            ))
            .returning();

        console.log("Update result:", JSON.stringify(updated, null, 2));

        // Let's also check if we can query it back
        const [verified] = await db.select().from(riskScenarios).where(eq(riskScenarios.id, riskId));
        console.log("Verified result:", JSON.stringify(verified, null, 2));

    } catch (e) {
        console.error("Failed to update data:", e);
    }
    process.exit(0);
}

run();
