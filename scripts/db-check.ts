import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { sql } from 'drizzle-orm';

// Load .env first
dotenv.config();

// Load .env.local if exists
if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.DATABASE_URL;
console.log("Connecting to:", connectionString?.replace(/:[^:@]+@/, ':***@')); // Log masked 

if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

// Supabase requires SSL usually
const client = postgres(connectionString, {
    ssl: { rejectUnauthorized: false } // For Supabase transaction pooler sometimes needed or simple 'require'
});
const db = drizzle(client);

async function checkTable() {
    try {
        const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'nist_tiers'
      );
    `);

        console.log("Table 'nist_tiers' exists:", result[0].exists);
    } catch (error) {
        console.error("Error checking table:", error);
    } finally {
        await client.end();
    }
}

checkTable();
