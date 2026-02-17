
import 'dotenv/config';
import { getDb } from '../packages/core/src/db';
import { controls } from '../packages/core/src/schema';
import { eq, sql } from 'drizzle-orm';

async function verify() {
    const db = await getDb();

    const nist80053 = await db.select({ count: sql<number>`count(*)` })
        .from(controls)
        .where(eq(controls.framework, "NIST 800-53"));

    const nistRev5 = await db.select({ count: sql<number>`count(*)` })
        .from(controls)
        .where(eq(controls.framework, "NIST SP 800-53 Rev 5"));

    console.log(`NIST 800-53 count: ${nist80053[0].count}`);
    console.log(`NIST SP 800-53 Rev 5 count: ${nistRev5[0].count}`);

    const examples = await db.select().from(controls)
        .where(eq(controls.framework, "NIST 800-53"))
        .limit(5);

    console.log("Examples for NIST 800-53:");
    examples.forEach(c => console.log(`${c.controlId}: ${c.name} (${c.framework})`));

    process.exit(0);
}

verify();
