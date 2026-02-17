import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    console.log("Checking client IDs of risk_scenarios...");

    try {
        const rows = await db.execute(sql`SELECT id, title, client_id, dev_project_id FROM risk_scenarios;`);
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error("Failed to check data:", e);
    }
    process.exit(0);
}

run();
