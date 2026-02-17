import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    console.log("Adding missing columns to risk_scenarios...");

    try {
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS inherent_score integer;`);
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS inherent_risk varchar(50);`);
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS residual_likelihood integer;`);
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS residual_impact integer;`);
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS residual_score integer;`);
        await db.execute(sql`ALTER TABLE risk_scenarios ADD COLUMN IF NOT EXISTS residual_risk varchar(50);`);
        console.log("Success! Columns added.");
    } catch (e) {
        console.error("Failed to add columns:", e);
    }
    process.exit(0);
}

run();
