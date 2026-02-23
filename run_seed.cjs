const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Try multiple connection configs
    const configs = [
        // Local
        {
            host: 'localhost',
            port: 5432,
            database: 'complianceos',
            user: 'postgres',
            password: 'postgres'
        },
        // Supabase AWS Pooler
        {
            host: 'aws-1-eu-west-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            user: 'postgres.erjlkrtccmlrvsjtpppp',
            password: 'rDAO3DsFTjZyZJpj',
            ssl: { rejectUnauthorized: false }
        }
    ];

    let client = null;
    let connected = false;

    for (const config of configs) {
        try {
            console.log(`Trying to connect to ${config.host}:${config.port}...`);
            client = new Client(config);
            await client.connect();
            connected = true;
            console.log(`Connected successfully to ${config.host}!`);
            break;
        } catch (err) {
            console.log(`Failed to connect to ${config.host}: ${err.message}`);
            if (client) {
                try { await client.end(); } catch (e) { }
            }
            client = null;
        }
    }

    if (!connected || !client) {
        console.error('Could not connect to any database. Please check your connection settings.');
        return;
    }

    try {
        // Read and run migration
        console.log('Running migration: 0020_add_fisma_system_columns.sql');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'packages/core/drizzle/0020_add_fisma_system_columns.sql'),
            'utf-8'
        );
        await client.query(migrationSQL);
        console.log('Migration completed!');

        // Read and run seed data
        console.log('Running seed data: seed_nist_simple.sql');
        const seedSQL = fs.readFileSync(
            path.join(__dirname, 'packages/core/drizzle/seed_nist_simple.sql'),
            'utf-8'
        );

        // Split by semicolon and execute each statement
        const statements = seedSQL.split(';').filter(s => s.trim() && !s.startsWith('--'));
        console.log(`Executing ${statements.length} statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await client.query(statements[i]);
            } catch (err) {
                // Skip ON CONFLICT errors and other non-critical errors
                if (!err.message.includes('duplicate') &&
                    !err.message.includes('conflict') &&
                    !err.message.includes('ON CONFLICT')) {
                    console.log(`Statement ${i + 1} note: ${err.message.substring(0, 80)}`);
                }
            }
        }

        console.log('Seed data completed!');

        // Verify data
        const result = await client.query('SELECT COUNT(*) as count FROM federal_fisma_systems WHERE client_id = 3');
        console.log(`FISMA Systems created for client 3: ${result.rows[0].count}`);

        const poamResult = await client.query('SELECT COUNT(*) as count FROM federal_poams WHERE client_id = 3');
        console.log(`POA&M Plans created for client 3: ${poamResult.rows[0].count}`);

        const threatResult = await client.query('SELECT COUNT(*) as count FROM nist_80030_threat_sources WHERE client_id = 3');
        console.log(`Threat Sources created for client 3: ${threatResult.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

runMigration();
