import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    console.log("Dumping risk_scenarios sample data...");

    try {
        const rows = await db.execute(sql`SELECT id, title, likelihood, impact, inherent_score, inherent_risk, residual_score, owner FROM risk_scenarios LIMIT 5;`);
        // postgres-js returns the rows directly as an array-like object
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error("Failed to dump data:", e);
    }
    process.exit(0);
}

run();
