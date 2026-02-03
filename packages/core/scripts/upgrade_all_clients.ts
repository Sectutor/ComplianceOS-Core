
import 'dotenv/config';
import { getDb } from '../src/db';
import { clients } from '../src/schema';

async function main() {
    console.log('--- Upgrading ALL Clients to Enterprise ---');
    try {
        const db = await getDb();
        const result = await db.update(clients)
            .set({ planTier: 'enterprise' }); // No where clause = update all

        console.log("Update executed successfully on all clients.");
    } catch (e) {
        console.error("Error upgrading clients:", e);
    }

    process.exit(0);
}

main();
