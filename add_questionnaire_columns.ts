import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log("Adding new columns to questionnaire_questions table...");

  try {
    await client`
      ALTER TABLE "questionnaire_questions" 
      ADD COLUMN IF NOT EXISTS "comment" text,
      ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json,
      ADD COLUMN IF NOT EXISTS "access" varchar(50) DEFAULT 'internal',
      ADD COLUMN IF NOT EXISTS "assignee_id" integer REFERENCES "users"("id");
    `;
    console.log("✓ Added comment, tags, access, and assignee_id columns");

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
