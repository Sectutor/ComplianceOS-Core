import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "./packages/core/src/db";

async function runMigration() {
    console.log("Starting manual migration for report_logs...");
    const db = await getDb();

    try {
        // 1. Create Enum
        console.log("Creating report_type enum...");
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "report_type" AS ENUM ('executive_summary', 'controls', 'policies', 'evidence', 'mappings', 'soa', 'compliance_readiness', 'audit_bundle');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Create Table
        console.log("Creating report_logs table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "report_logs" (
                "id" serial PRIMARY KEY NOT NULL,
                "client_id" integer NOT NULL,
                "user_id" integer,
                "report_type" "report_type" NOT NULL,
                "format" varchar(20) NOT NULL,
                "timestamp" timestamp DEFAULT now() NOT NULL,
                "metadata" json
            );
        `);

        // 3. Create Indices
        console.log("Creating indices...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_rl_client" ON "report_logs" ("client_id");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_rl_type" ON "report_logs" ("report_type");`);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration().then(() => process.exit(0));
