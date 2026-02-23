
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true });
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        process.exit(1);
    }

    const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

    try {
        console.log('Querying all columns of risk_assessments:');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'risk_assessments'
            ORDER BY ordinal_position
        `;
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

        console.log('\nChecking specifically for fisma_system_id:');
        const specific = columns.filter(c => c.column_name === 'fisma_system_id');
        console.log(specific.length > 0 ? 'FOUND' : 'NOT FOUND');
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await sql.end();
    }
}

main();
