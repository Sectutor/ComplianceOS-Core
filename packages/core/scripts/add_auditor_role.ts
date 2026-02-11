import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';

async function addAuditorRole() {
    const db = await getDb();
    if (!db) return;

    try {
        await db.execute(sql`ALTER TYPE role ADD VALUE IF NOT EXISTS 'auditor'`);
        console.log("Successfully added 'auditor' to role enum.");
    } catch (e: any) {
        console.error("Error adding 'auditor' role:", e.message);
    }
}

addAuditorRole().catch(console.error);
