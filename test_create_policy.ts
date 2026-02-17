
import 'dotenv/config';
import { getDb } from './db';
import { clientPolicies } from './schema';

async function testCreatePolicy() {
    try {
        const db = await getDb();
        console.log('Testing policy creation...');

        // Find a client
        const firstClient = await db.query.clients.findFirst();
        if (!firstClient) {
            console.log('No clients found in DB. Create one first.');
            process.exit(0);
        }

        console.log(`Using client: ${firstClient.name} (ID: ${firstClient.id})`);

        const newPolicy = await db.insert(clientPolicies).values({
            clientId: firstClient.id,
            name: 'Test Policy ' + Date.now(),
            status: 'draft',
            content: 'Test content',
            module: 'general',
            version: 1
        }).returning();

        console.log('Created policy:', JSON.stringify(newPolicy[0], null, 2));
    } catch (error: any) {
        console.error('Error creating policy:', error);
    }
    process.exit(0);
}

testCreatePolicy();
