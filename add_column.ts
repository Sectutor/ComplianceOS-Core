import dotenv from "dotenv";
dotenv.config({ path: "packages/core/.env" });
import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        const db = await getDb();
        console.log("Adding column...");
        await db.execute(sql`ALTER TABLE integration_definitions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;`);
        console.log("Column added successfully");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
