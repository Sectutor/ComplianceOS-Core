import 'dotenv/config';
import * as db from './packages/core/src/db';
import * as schema from './packages/core/src/schema';
import { sql, asc, or, ilike } from "drizzle-orm";

async function verify() {
    const dbConn = await db.getDb();

    console.log("--- Fetching Frameworks via Drizzle ---");
    const frameworks = await dbConn
        .select()
        .from(schema.complianceFrameworks)
        .orderBy(asc(schema.complianceFrameworks.name));

    console.log(`Found ${frameworks.length} frameworks in DB.`);

    const results = await Promise.all(frameworks.map(async (fw) => {
        const controlCount = await dbConn
            .select({ count: sql<number>`count(*)` })
            .from(schema.controls)
            .where(
                or(
                    ilike(schema.controls.framework, `%${fw.name}%`),
                    sql`${fw.name} ILIKE '%' || ${schema.controls.framework} || '%'`,
                    sql`REPLACE(REPLACE(${schema.controls.framework}, ' ', ''), '-', '') ILIKE '%' || REPLACE(REPLACE(${fw.shortCode}, ' ', ''), '-', '') || '%'`,
                    sql`REPLACE(REPLACE(${schema.controls.framework}, ' ', ''), '-', '') ILIKE '%' || REPLACE(REPLACE(${fw.name}, ' ', ''), '-', '') || '%'`
                )

            );

        return {
            name: fw.name,
            shortCode: fw.shortCode,
            controlCount: Number(controlCount[0]?.count || 0)
        };
    }));

    console.log("--- Results ---");
    results.forEach(r => {
        console.log(`${r.name} (${r.shortCode}): ${r.controlCount} controls`);
    });
}

verify().catch(console.error);
