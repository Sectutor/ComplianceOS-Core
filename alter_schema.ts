
import 'dotenv/config';
import { getDb } from './db';
import { sql } from 'drizzle-orm';

async function main() {
    const db = await getDb();
    console.log("Altering table column length...");
    try {
        await db.execute(sql`ALTER TABLE implementation_tasks ALTER COLUMN pdca TYPE varchar(100)`);
        console.log("✅ Column length increased to 100.");
    } catch (e) {
        console.error("❌ Failed to alter table:", e);
    }
    process.exit(0);
}

main();
