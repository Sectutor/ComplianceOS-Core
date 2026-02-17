import { config } from "dotenv";
import fs from "fs";
import postgres from "postgres";

if (fs.existsSync(".env.local")) {
    config({ path: ".env.local" });
} else {
    config({ path: ".env" });
}

async function test() {
    console.log("Attempting connection to:", process.env.DATABASE_URL?.substring(0, 50) + "...");
    try {
        const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });
        await sql`SELECT 1`;
        console.log("✅ Database Connected successfully!");
        await sql.end();
    } catch (e) {
        console.error("❌ Connection failed:", e);
    }
}

test();
