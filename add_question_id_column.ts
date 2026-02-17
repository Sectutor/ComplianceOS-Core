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
  console.log("Adding question_id column to questionnaire_questions table...");

  try {
    await client`
      ALTER TABLE "questionnaire_questions" 
      ADD COLUMN IF NOT EXISTS "question_id" text;
    `;
    console.log("✓ Added question_id column");

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
