import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        const db = await getDb();
        console.log("Connected to DB");

        console.log("Creating training_completions table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "training_completions" (
            "id" serial PRIMARY KEY NOT NULL,
            "client_id" integer NOT NULL,
            "employee_id" integer NOT NULL,
            "module_id" integer NOT NULL,
            "completed_at" timestamp DEFAULT now(),
            "score" integer,
            "feedback" text
        );`);

        console.log("Creating training_modules table...");
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "training_modules" (
            "id" serial PRIMARY KEY NOT NULL,
            "client_id" integer NOT NULL,
            "title" varchar(255) NOT NULL,
            "description" text,
            "type" varchar(20) NOT NULL,
            "video_url" text,
            "content" text,
            "duration_minutes" integer DEFAULT 0,
            "active" boolean DEFAULT true,
            "order" integer DEFAULT 0,
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
        );`);

        console.log("Creating indexes...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_training_completion_employee" ON "training_completions" ("employee_id");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_training_completion_module" ON "training_completions" ("module_id");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_training_module_client" ON "training_modules" ("client_id");`);

        console.log("Success!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
