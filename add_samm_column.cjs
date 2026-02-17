
const { Client } = require('pg');
require('dotenv').config();
async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query('ALTER TABLE samm_stream_assessments ADD COLUMN IF NOT EXISTS level_notes JSONB DEFAULT \'{}\';');
        console.log('Column level_notes added successfully');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}
main();
