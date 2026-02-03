
import 'dotenv/config';
import { getDb } from '../src/db';
import { clients } from '../src/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- Updating Clients to Enterprise ---');

    try {
        const db = await getDb();

        // Update client 1
        console.log('Updating Client 1...');
        const result1 = await db.update(clients)
            .set({ planTier: 'enterprise' })
            .where(eq(clients.id, 1))
            .returning();

        console.log('Updated Client 1:', result1);

        // Update client 2 (often used in dev)
        console.log('Updating Client 2...');
        const result2 = await db.update(clients)
            .set({ planTier: 'enterprise' })
            .where(eq(clients.id, 2))
            .returning();

        console.log('Updated Client 2:', result2);

        // Update client 3 
        console.log('Updating Client 3...');
        const result3 = await db.update(clients)
            .set({ planTier: 'enterprise' })
            .where(eq(clients.id, 3))
            .returning();

        console.log('Updated Client 3:', result3);

        console.log('--- Success ---');
        process.exit(0);
    } catch (error) {
        console.error('Error updating clients:', error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
