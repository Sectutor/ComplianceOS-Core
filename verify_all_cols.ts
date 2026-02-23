
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

    const tables = [
        'risk_assessments',
        'federal_ssps',
        'federal_sars',
        'federal_poams',
        'fips_categorizations',
        'federal_nist_800_53_assessments',
        'nist_80030_threat_sources',
        'nist_80030_threat_events',
        'nist_80030_impact_assessments'
    ];

    console.log('Verifying fisma_system_id column in relevant tables:');
    for (const table of tables) {
        try {
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table} AND column_name = 'fisma_system_id'
            `;
            if (columns.length > 0) {
                console.log(`[OK]      ${table}`);
            } else {
                console.log(`[MISSING] ${table}`);
            }
        } catch (err: any) {
            console.log(`[ERROR]   ${table} (${err.message})`);
        }
    }

    await sql.end();
}

main();
