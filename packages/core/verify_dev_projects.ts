
import "dotenv/config";
import { getDb } from "./src/db";
import { devProjects } from "./src/schema";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Connecting to DB...");
        const db = await getDb();
        console.log("Connected.");

        console.log("Querying devProjects table...");
        const projects = await db.select().from(devProjects).limit(1);
        console.log("Success! Projects found:", projects.length);
        console.log("Data:", projects);

        console.log("Inserting test project...");
        const [inserted] = await db.insert(devProjects).values({
            clientId: 1, // Assuming client 1 exists
            name: "Test Project Verification",
            description: "Verifying schema",
            owner: "Debugger"
        } as any).returning();
        console.log("Inserted:", inserted);

        console.log("Deleting test project...");
        await db.delete(devProjects).where(sql`${devProjects.id} = ${inserted.id}`);
        console.log("Deleted.");

    } catch (error) {
        console.error("VERIFICATION FAILED:");
        console.error(error);
    }
    process.exit(0);
}

main();
