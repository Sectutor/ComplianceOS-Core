import { getDb } from "./packages/core/src/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Verifying access_expires_at columns...");

    try {
        const dbConn = await getDb();

        console.log("Checking users table...");
        const userResult = await dbConn.execute(sql`SELECT access_expires_at FROM users LIMIT 1`);
        console.log("Users table check successful.");

        console.log("Checking user_clients table...");
        const userClientResult = await dbConn.execute(sql`SELECT access_expires_at FROM user_clients LIMIT 1`);
        console.log("User_clients table check successful.");

        console.log("All columns verified successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error("Verification failed:", error.message);
        process.exit(1);
    }
}

main();
