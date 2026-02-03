import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(process.cwd(), 'migrations', 'ropa_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running ROPA tables migration...');
        await client.query(sql);
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
