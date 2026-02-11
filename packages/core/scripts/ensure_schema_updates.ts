import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';

async function verifySchemaUpdates() {
    const db = await getDb();
    if (!db) return;

    // 1. Check/Add 'auditor' role
    try {
        console.log("Checking 'role' enum...");
        // This syntax works for Postgres to add value to enum
        await db.execute(sql`ALTER TYPE role ADD VALUE IF NOT EXISTS 'auditor'`);
        console.log(" - 'auditor' role enabled.");
    } catch (e: any) {
        console.log(` - Role update info: ${e.message}`);
    }

    // 2. Check/Add 'scan_key' to clients
    try {
        console.log("Checking 'clients' table for 'scan_key'...");
        await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS scan_key VARCHAR(255)`);
        console.log(" - 'scan_key' column enabled.");
    } catch (e: any) {
        console.log(` - Client update info: ${e.message}`);
    }
}

verifySchemaUpdates().catch(console.error);
