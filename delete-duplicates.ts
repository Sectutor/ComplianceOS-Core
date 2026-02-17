import { getDb } from "./packages/core/src/db";
import { clients } from "./packages/core/src/schema";
import { eq } from "drizzle-orm";

async function deleteDuplicates() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Get all clients ordered by name and id
    const allClients = await db.select().from(clients).orderBy(clients.name, clients.id);

    console.log(`Total clients: ${allClients.length}`);

    // Find duplicates
    const seenNames = new Set<string>();
    const idsToDelete: number[] = [];

    for (const client of allClients) {
      if (seenNames.has(client.name)) {
        idsToDelete.push(client.id);
      } else {
        seenNames.add(client.name);
      }
    }

    console.log(`Unique clients: ${seenNames.size}`);
    console.log(`Duplicate clients to delete: ${idsToDelete.length}`);

    if (idsToDelete.length > 0) {
      console.log(`IDs to delete: ${idsToDelete.join(", ")}`);

      // Delete duplicates one by one
      for (const id of idsToDelete) {
        await db.delete(clients).where(eq(clients.id, id));
      }
      console.log(`✓ Deleted ${idsToDelete.length} duplicate clients`);
    } else {
      console.log("No duplicates found");
    }

    // Verify
    const remaining = await db.select().from(clients);
    console.log(`✓ Remaining clients: ${remaining.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

deleteDuplicates();
