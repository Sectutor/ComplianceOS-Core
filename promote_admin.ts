
import 'dotenv/config';
import { getDb } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function promote() {
    const db = await getDb();
    if (!db) { console.error("No DB"); return; }

    // Promote ALL users to admin to be safe (since single tenant debug mode)
    // Or just the one found.
    console.log("Promoting user to admin...");
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, 1)); // Assuming ID 1 based on previous logs

    console.log("User promoted.");
    process.exit(0);
}

promote().catch(console.error);
