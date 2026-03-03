
import 'dotenv/config';
import { getDb } from './db';
import * as schema from './schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
    const db = await getDb();
    console.log("--- Database Requirement Verification ---");

    const iso = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "ISO27001")
    });

    if (iso) {
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.frameworkRequirements)
            .where(eq(schema.frameworkRequirements.frameworkId, iso.id));
        console.log(`ISO 27001 Requirements: ${count[0].count}`);
    }

    const soc2 = await db.query.complianceFrameworks.findFirst({
        where: eq(schema.complianceFrameworks.shortCode, "SOC2")
    });
    
    if (soc2) {
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.frameworkRequirements)
            .where(eq(schema.frameworkRequirements.frameworkId, soc2.id));
        console.log(`SOC 2 Requirements: ${count[0].count}`);
    }

    process.exit(0);
}

main();
