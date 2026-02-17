
import 'dotenv/config'; // Load .env
import { getDb } from './db';
import { users, clients, userClients } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();
    if (!db) {
        console.error('Failed to connect to DB');
        return;
    }

    console.log('--- USERS ---');
    const allUsers = await db.select().from(users);
    console.table(allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));

    console.log('\n--- CLIENTS ---');
    const allClients = await db.select().from(clients);
    console.table(allClients.map(c => ({ id: c.id, name: c.name })));

    console.log('\n--- MEMBERSHIPS (userClients) ---');
    const allMemberships = await db.select().from(userClients);
    console.table(allMemberships);

    if (allClients.length > 0) {
        const clientId = allClients[0].id;
        console.log(`\n--- Simulating listWorkspaceMembers for Client ID: ${clientId} ---`);
        const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: userClients.role
        })
            .from(users)
            .innerJoin(userClients, eq(users.id, userClients.userId))
            .where(eq(userClients.clientId, clientId));

        console.log('Result:', members);
    }
}

main().catch(console.error).finally(() => process.exit(0));
