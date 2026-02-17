
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";

async function main() {
    const db = await getDb();
    try {
        const result = await db.execute(sql`SELECT count(*) FROM dsar_requests`);
        console.log("Found rows in dsar_requests:", result);
    } catch (e: any) {
        console.error("Error accessing dsar_requests table:", e.message);
    }
    process.exit(0);
}

main();
