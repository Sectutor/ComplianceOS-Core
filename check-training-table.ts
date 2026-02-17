import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function check() {
    try {
        const db = await getDb();
        console.log("Connected to DB");
        const result = await db.execute(sql`SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'training_modules'
        );`);
        console.log("Table exists check:", result);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

check();
