import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        const db = await getDb();
        console.log("Connected to DB");

        console.log("Creating maturity_frameworks table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_frameworks" (
            "id" varchar(50) PRIMARY KEY,
            "name" varchar(100) NOT NULL,
            "description" text,
            "version" varchar(20),
            "logo" varchar(255),
            "levels" jsonb NOT NULL,
            "status" varchar(20) DEFAULT 'active',
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
        );`);

        console.log("Creating maturity_categories table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_categories" (
            "id" serial PRIMARY KEY,
            "framework_id" varchar(50) NOT NULL REFERENCES "maturity_frameworks"("id"),
            "code" varchar(20) NOT NULL,
            "name" varchar(100) NOT NULL,
            "description" text,
            "icon" varchar(50),
            "order" integer DEFAULT 0
        );`);

        console.log("Creating maturity_requirements table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_requirements" (
            "id" serial PRIMARY KEY,
            "framework_id" varchar(50) NOT NULL REFERENCES "maturity_frameworks"("id"),
            "category_id" integer NOT NULL REFERENCES "maturity_categories"("id"),
            "code" varchar(50) NOT NULL,
            "title" varchar(255) NOT NULL,
            "description" text,
            "level" integer NOT NULL,
            "order" integer DEFAULT 0,
            "benefits" text,
            "activities" jsonb DEFAULT '[]'::jsonb
        );`);

        console.log("Creating maturity_assessments table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_assessments" (
            "id" serial PRIMARY KEY,
            "client_id" integer NOT NULL,
            "framework_id" varchar(50) NOT NULL REFERENCES "maturity_frameworks"("id"),
            "requirement_id" integer NOT NULL REFERENCES "maturity_requirements"("id"),
            "is_achieved" boolean DEFAULT false,
            "notes" text,
            "evidence" jsonb DEFAULT '[]'::jsonb,
            "is_target" boolean DEFAULT false,
            "assessed_by" integer,
            "assessment_date" timestamp,
            "updated_at" timestamp DEFAULT now()
        );`);

        console.log("Creating maturity_client_frameworks table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_client_frameworks" (
            "id" serial PRIMARY KEY NOT NULL,
            "client_id" integer NOT NULL,
            "framework_id" varchar(50) NOT NULL REFERENCES "maturity_frameworks"("id"),
            "overall_score" integer DEFAULT 0,
            "target_score" integer DEFAULT 0,
            "status" varchar(20) DEFAULT 'not_started',
            "last_assessed_at" timestamp,
            "updated_at" timestamp DEFAULT now()
        );`);

        console.log("Creating maturity_simulations table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "maturity_simulations" (
            "id" serial PRIMARY KEY NOT NULL,
            "client_id" integer NOT NULL,
            "framework_id" varchar(50) NOT NULL,
            "name" varchar(100) NOT NULL,
            "description" text,
            "config" jsonb NOT NULL,
            "results" jsonb,
            "created_at" timestamp DEFAULT now(),
            "created_by" integer
        );`);

        console.log("Adding unique constraints and indexes...");
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_maturity_client_framework_req" ON "maturity_assessments" ("client_id", "framework_id", "requirement_id");`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_maturity_client_framework" ON "maturity_client_frameworks" ("client_id", "framework_id");`);

        console.log("Success!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
