
import "dotenv/config";
import { getDb } from "./packages/core/src/db";
import { evidence, clientControls } from "./packages/core/src/schema";
import { eq, and } from "drizzle-orm";

async function count() {
    try {
        const db = await getDb();
        const results = await db.select().from(evidence).where(eq(evidence.clientId, 3));
        console.log(`[CHECK] Total evidence for Client 3: ${results.length}`);
        results.forEach((r: any) => {
            console.log(` - ID: ${r.evidenceId}, Framework: ${r.framework}, ControlID: ${r.clientControlId}, Desc: ${r.description}`);
        });

        const controls = await db.select().from(clientControls).where(eq(clientControls.clientId, 3)).limit(5);
        console.log(`[CHECK] Available Control IDs for Client 3: ${controls.map((c: any) => c.id).join(', ')}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

count();
