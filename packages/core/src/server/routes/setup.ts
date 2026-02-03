import express from 'express';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

export const setupRouter = express.Router();

setupRouter.post('/create-ropa-tables', async (req, res) => {
    try {
        const db = await getDb();

        console.log('Creating ROPA tables...');

        // Create processing_activities table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS processing_activities (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        activity_name TEXT NOT NULL,
        activity_id TEXT NOT NULL UNIQUE,
        description TEXT,
        role VARCHAR(50) NOT NULL,
        controller_name TEXT,
        controller_contact TEXT,
        dpo_name TEXT,
        dpo_contact TEXT,
        representative_name TEXT,
        representative_contact TEXT,
        purposes JSON NOT NULL DEFAULT '[]',
        legal_basis VARCHAR(100) NOT NULL,
        data_categories JSON NOT NULL DEFAULT '[]',
        data_subject_categories JSON NOT NULL DEFAULT '[]',
        special_categories JSON DEFAULT '[]',
        recipients JSON NOT NULL DEFAULT '[]',
        recipient_categories JSON DEFAULT '[]',
        has_international_transfers BOOLEAN DEFAULT FALSE,
        transfer_countries JSON DEFAULT '[]',
        transfer_safeguards TEXT,
        transfer_details TEXT,
        retention_period TEXT,
        retention_criteria TEXT,
        deletion_procedure TEXT,
        technical_measures JSON DEFAULT '[]',
        organizational_measures JSON DEFAULT '[]',
        security_description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        last_review_date TIMESTAMP,
        next_review_date TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pa_client ON processing_activities(client_id)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_pa_activity_id ON processing_activities(activity_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pa_status ON processing_activities(status)`);

        // Create processing_activity_vendors table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS processing_activity_vendors (
        id SERIAL PRIMARY KEY,
        processing_activity_id INTEGER NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pav_pa ON processing_activity_vendors(processing_activity_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pav_vendor ON processing_activity_vendors(vendor_id)`);

        // Create processing_activity_assets table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS processing_activity_assets (
        id SERIAL PRIMARY KEY,
        processing_activity_id INTEGER NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_paa_pa ON processing_activity_assets(processing_activity_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_paa_asset ON processing_activity_assets(asset_id)`);

        console.log('✅ ROPA tables created successfully!');

        res.json({
            success: true,
            message: 'ROPA tables created successfully',
            tables: ['processing_activities', 'processing_activity_vendors', 'processing_activity_assets']
        });

    } catch (error: any) {
        console.error('Error creating ROPA tables:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
