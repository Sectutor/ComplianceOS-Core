
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';

async function setup() {
    console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);
    console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20));
    const db = await getDb();
    console.log("Setting up tables...");
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS fips_199_information_types_ref (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                provisional_confidentiality VARCHAR(20) NOT NULL,
                provisional_integrity VARCHAR(20) NOT NULL,
                provisional_availability VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Table fips_199_information_types_ref created/verified.");

        await db.execute(sql`
            ALTER TABLE fips_categorizations 
            ALTER COLUMN information_types TYPE JSONB USING information_types::JSONB
        `);
        console.log("Updated fips_categorizations information_types to JSONB.");
    } catch (error) {
        console.error("Setup error:", error);
    }
    process.exit(0);
}

setup();
