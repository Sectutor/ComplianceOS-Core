
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { sql } from 'drizzle-orm';

dotenv.config();
if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function inspect() {
    try {
        console.log("--- DB INSPECTION ---");

        const userCount = await db.execute(sql`SELECT count(*) FROM users`);
        console.log("Users count:", userCount[0].count);

        const clientCount = await db.execute(sql`SELECT count(*) FROM clients`);
        console.log("Clients count:", clientCount[0].count);

        const userClientCount = await db.execute(sql`SELECT count(*) FROM user_clients`);
        console.log("UserClients count:", userClientCount[0].count);

        const recentUsers = await db.execute(sql`SELECT id, email, role FROM users ORDER BY id DESC LIMIT 5`);
        console.log("Recent users:", recentUsers);

        const roles = await db.execute(sql`SELECT DISTINCT role FROM users`);
        console.log("Active roles in users table:", roles);

    } catch (error) {
        console.error("Error inspecting DB:", error);
    } finally {
        await client.end();
    }
}

inspect();
