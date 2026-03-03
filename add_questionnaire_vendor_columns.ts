/**
 * Migration script to add vendor assessment columns to questionnaires and questionnaire_questions tables.
 * 
 * IMPORTANT: Run with ts-node:
 *   npx ts-node add_questionnaire_vendor_columns.ts
 * 
 * This script uses PostgreSQL-specific syntax (ALTER TABLE ADD COLUMN IF NOT EXISTS).
 * Ensure you are running against a PostgreSQL database.
 */
import dotenv from "dotenv";
dotenv.config({ path: "packages/core/.env" });
import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        const db = await getDb();
        console.log("Adding vendor assessment columns to questionnaires table...");

        // Add basic columns first (no FK dependencies)
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS vendor_name TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS vendor_email TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS vendor_token TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS vendor_link_expires_at TIMESTAMP`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS category TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS priority TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS control_id TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS control_framework TEXT`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS remediation_deadline TIMESTAMP`);
        await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`);

        // Add FK columns as INTEGER first, then add FK constraints separately
        // This allows migration to succeed even if users table has issues
        try {
            await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS answered_by INTEGER`);
            await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS approved_by INTEGER`);
            await db.execute(sql`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
        } catch (e: any) {
            console.log("FK columns may already exist or users table issue:", e.message);
        }

        console.log("Adding enhanced workflow columns to questionnaire_questions table...");

        await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS category TEXT`);
        await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS priority TEXT`);
        await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS control_id TEXT`);
        await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS control_framework TEXT`);
        await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS remediation_deadline TIMESTAMP`);

        // Add FK columns for questionnaire_questions
        try {
            await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS answered_by INTEGER`);
            await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS approved_by INTEGER`);
            await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
            await db.execute(sql`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`);
        } catch (e: any) {
            console.log("FK columns may already exist:", e.message);
        }

        // Add FK constraints for questionnaires table (with error handling)
        try {
            await db.execute(sql`ALTER TABLE questionnaires 
                ADD CONSTRAINT fk_qn_answered_by FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL`);
        } catch (e: any) {
            if (!e.message?.includes("already exists")) {
                console.log("FK constraint for answered_by may already exist:", e.message);
            }
        }
        try {
            await db.execute(sql`ALTER TABLE questionnaires 
                ADD CONSTRAINT fk_qn_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL`);
        } catch (e: any) {
            if (!e.message?.includes("already exists")) {
                console.log("FK constraint for approved_by may already exist:", e.message);
            }
        }

        // Add FK constraints for questionnaire_questions table (with error handling)
        try {
            await db.execute(sql`ALTER TABLE questionnaire_questions 
                ADD CONSTRAINT fk_qq_answered_by FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL`);
        } catch (e: any) {
            if (!e.message?.includes("already exists")) {
                console.log("FK constraint for qq_answered_by may already exist:", e.message);
            }
        }
        try {
            await db.execute(sql`ALTER TABLE questionnaire_questions 
                ADD CONSTRAINT fk_qq_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL`);
        } catch (e: any) {
            if (!e.message?.includes("already exists")) {
                console.log("FK constraint for qq_approved_by may already exist:", e.message);
            }
        }

        console.log("✅ Successfully added all vendor assessment and workflow columns!");
    } catch (e: any) {
        if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
            console.log("Columns already exist, skipping...");
        } else {
            console.error("Error:", e);
        }
    } finally {
        process.exit();
    }
}

run();
