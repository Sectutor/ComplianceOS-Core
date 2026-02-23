
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Manually load env
dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true });
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    console.log('[DB] Connecting to database...');
    const client = postgres(databaseUrl, {
        ssl: { rejectUnauthorized: false },
        prepare: false
    });
    const db = drizzle(client);

    const tables = [
        'risk_assessments',
        'nist_80030_threat_sources',
        'nist_80030_threat_events',
        'nist_80030_impact_assessments',
        'federal_ssps',
        'federal_poams',
        'federal_sars',
        'fips_categorizations',
        'federal_nist_800_53_assessments'
    ];

    console.log('Ensuring fisma_system_id column exists...');

    for (const table of tables) {
        try {
            console.log(`Checking ${table}...`);
            await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS fisma_system_id integer;`));
            console.log(`Success for ${table}`);
        } catch (err: any) {
            console.error(`Error for ${table}:`, err.message);
        }
    }

    console.log('Done.');
    await client.end();
}

main();
