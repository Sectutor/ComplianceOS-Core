import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function test() {
    try {
        const db = await getDb();
        console.log("Connected to DB");
        const modules = await db.execute(sql`SELECT * FROM training_modules WHERE client_id = 3`);
        console.log("Modules for client 3:", modules);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

test();
