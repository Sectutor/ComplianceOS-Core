
import * as db from "./packages/core/src/db.ts";
import { readinessAssessments } from "./packages/core/src/schema.ts";
import { eq, and } from "drizzle-orm";

async function main() {
    try {
        const dbConn = await db.getDb();
        const results = await dbConn.select().from(readinessAssessments).where(eq(readinessAssessments.clientId, 3));
        console.log("Found " + results.length + " assessments.");
        results.forEach(r => {
            console.log("==========================================");
            console.log(`STANDARD: ${r.standardId}`);
            console.log(`REPORT CONTENT:\n${r.scopingReport || "NO REPORT GENERATED"}`);
            console.log("==========================================");
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
