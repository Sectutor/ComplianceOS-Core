import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const db = await getDb();
    console.log("Checking risk 178...");

    try {
        const rows = await db.execute(sql`SELECT * FROM risk_scenarios WHERE id = 178;`);
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (e) {
        console.error("Failed to check data:", e);
    }
    process.exit(0);
}

run();
