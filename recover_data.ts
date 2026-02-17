
import 'dotenv/config';
import { getDb } from './db';
import { users, clients, userClients } from './schema';
import { eq, sql } from 'drizzle-orm';

async function recoverData() {
    const db = await getDb();
    if (!db) {
        console.error("No DB connection");
        return;
    }

    console.log("--- Data Recovery ---");

    // 1. Get the single user (assuming only one for now in debug mode)
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
        console.log("No users found. Please log in/refresh the app first to create the user record.");
        return;
    }

    // Use the first user found (most likely the one just created)
    const user = allUsers[0];
    console.log(`Recovering for User ID: ${user.id} (${user.email})`);

    // 2. Get all clients not assigned to this user
    const allClients = await db.select().from(clients);

    if (allClients.length === 0) {
        console.log("No clients found to recover.");
        return;
    }

    let recoveryCount = 0;

    for (const client of allClients) {
        // Check if mapping exists
        const existing = await db.select().from(userClients)
            .where(sql`${userClients.userId} = ${user.id} AND ${userClients.clientId} = ${client.id}`);

        if (existing.length === 0) {
            console.log(`Linking Client ${client.id} (${client.name}) to User ${user.id}...`);
            await db.insert(userClients).values({
                userId: user.id,
                clientId: client.id,
                role: 'owner'
            });
            recoveryCount++;
        } else {
            console.log(`Client ${client.id} (${client.name}) already linked.`);
        }
    }

    console.log(`\nRecovery Complete. Linked ${recoveryCount} clients.`);
    process.exit(0);
}

recoverData().catch(console.error);
