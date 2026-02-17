import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";

async function check() {
    const db = await getDb();
    const result = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'risk_scenarios'
    `);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
}

check();
