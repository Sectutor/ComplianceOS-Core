
import { getDb, bulkAssignControls, NATIVE_OWASP_STANDARDS } from "../db";
import { clients } from "../schema";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const db = await getDb();
    console.log("Starting Retroactive OWASP Standards Sync...");

    const allClients = await db.select().from(clients);
    console.log(`Found ${allClients.length} organizations to sync.`);

    for (const client of allClients) {
        console.log(`Syncing standards for: ${client.name} (ID: ${client.id})`);
        try {
            const result = await bulkAssignControls(client.id, NATIVE_OWASP_STANDARDS);
            console.log(`  - Result: ${result.message}`);
        } catch (error: any) {
            console.error(`  - FAILED for ${client.name}:`, error.message);
        }
    }

    console.log("Retroactive Sync Complete.");
    process.exit(0);
}

main().catch(error => {
    console.error("Sync failed:", error);
    process.exit(1);
});
