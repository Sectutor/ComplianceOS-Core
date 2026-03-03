import { getDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';

async function createThreatAssetMappingsTable() {
    const db = await getDb();

    console.log('Creating threat_asset_mappings table...');

    try {
        // Create the table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS threat_asset_mappings (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        threat_id INTEGER NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        confidence INTEGER DEFAULT 100,
        impact_level VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'active',
        mapped_by INTEGER,
        mapping_method VARCHAR(50) DEFAULT 'manual',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

        console.log('Table created successfully!');

        // Create indexes
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_threat_asset_mappings_client 
      ON threat_asset_mappings(client_id);
    `);

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_threat_asset_mappings_threat 
      ON threat_asset_mappings(threat_id);
    `);

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_threat_asset_mappings_asset 
      ON threat_asset_mappings(asset_id);
    `);

        console.log('Indexes created successfully!');

    } catch (error) {
        console.error('Error creating table:', error);
    }

    process.exit(0);
}

createThreatAssetMappingsTable();
