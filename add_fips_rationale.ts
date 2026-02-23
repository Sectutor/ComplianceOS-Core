
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true });
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) process.exit(1);

    const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

    console.log('Adding rationale and metadata to fips_categorizations...');
    const cols = [
        'confidentiality_rationale',
        'integrity_rationale',
        'availability_rationale'
    ];

    for (const col of cols) {
        try {
            await sql.unsafe(`ALTER TABLE fips_categorizations ADD COLUMN IF NOT EXISTS ${col} TEXT;`);
            console.log(`[V] ${col}`);
        } catch (err: any) {
            console.log(`[X] ${col} (${err.message})`);
        }
    }

    try {
        await sql.unsafe(`ALTER TABLE fips_categorizations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`);
        console.log(`[V] metadata`);
    } catch (err: any) {
        console.log(`[X] metadata (${err.message})`);
    }

    await sql.end();
}

main();
