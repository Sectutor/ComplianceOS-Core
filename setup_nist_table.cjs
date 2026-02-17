const postgres = require('postgres');
const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true });
} else {
    dotenv.config();
}

const sql = postgres(process.env.DATABASE_URL);

async function setup() {
    try {
        console.log("Creating nist_tiers table...");
        await sql`
            CREATE TABLE IF NOT EXISTS nist_tiers (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL,
                function_code VARCHAR(20) NOT NULL,
                current_tier INTEGER DEFAULT 1,
                target_tier INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;

        console.log("Creating unique index...");
        await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_nist_tiers_client_function 
            ON nist_tiers (client_id, function_code);
        `;

        console.log("Setup complete!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

setup();
