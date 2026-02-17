import 'dotenv/config';
import { getDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log("Checking for missing table: essential_eight_assessments...");
    const db = await getDb();

    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "essential_eight_assessments" (
                "id" serial PRIMARY KEY,
                "client_id" integer NOT NULL,
                "control_id" varchar(80) NOT NULL,
                "maturity_level" integer NOT NULL DEFAULT 0,
                "target_level" integer NOT NULL DEFAULT 1,
                "assessment_answers" jsonb DEFAULT '{}',
                "quality_criteria" jsonb DEFAULT '{}',
                "level_notes" jsonb DEFAULT '{}',
                "outcome" varchar(30) NOT NULL DEFAULT 'not_assessed',
                "evidence_quality" varchar(20) NOT NULL DEFAULT 'poor',
                "evidence_quality_by_level" jsonb DEFAULT '{}',
                "sample_coverage" jsonb DEFAULT '{}',
                "compensating_controls" jsonb DEFAULT '[]',
                "evidence_links" jsonb DEFAULT '[]',
                "notes" text,
                "updated_at" timestamp DEFAULT now(),
                "created_at" timestamp DEFAULT now()
            );
            
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_e8_client_control') THEN
                    CREATE UNIQUE INDEX "idx_e8_client_control" ON "essential_eight_assessments" ("client_id", "control_id");
                END IF;
            END $$;
        `);
        console.log("Table 'essential_eight_assessments' created successfully (or already exists).");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
