import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });
import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';

async function createTable() {
    const db = await getDb();
    if (!db) { console.error('No DB'); return; }
    console.log('Creating table...');
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_feedback (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            client_id INTEGER,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            url VARCHAR(1024),
            status VARCHAR(50) DEFAULT 'new',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_status ON system_feedback (status);
        CREATE INDEX IF NOT EXISTS idx_feedback_type ON system_feedback (type);
    `);
    console.log('Done');
    process.exit(0);
}

createTable().catch(e => {
    console.error(e);
    process.exit(1);
});
