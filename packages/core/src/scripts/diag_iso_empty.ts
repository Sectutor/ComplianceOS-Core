
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: false });
    const clientId = 3;
    const inputFrameworkId = "iso-27001";

    console.log(`Diagnosing resolution for ${inputFrameworkId}...`);

    // 1. Resolve short code
    const frameworks = await sql`
        SELECT name, short_code FROM compliance_frameworks 
        WHERE UPPER(short_code) = ${inputFrameworkId.toUpperCase()}
    `;
    console.log("Resolution Result:", frameworks);

    let frameworkName = inputFrameworkId;
    if (frameworks.length > 0) {
        frameworkName = frameworks[0].name;
    }
    console.log("Resolved Framework Name:", frameworkName);

    // 2. Test query logic
    const results = await sql`
        SELECT COUNT(*) 
        FROM client_controls cc
        JOIN controls c ON cc.control_id = c.id
        WHERE cc.client_id = ${clientId}
        AND (
            c.framework = ${frameworkName}
            OR c.framework = ${inputFrameworkId.toUpperCase()}
            OR c.framework = ${inputFrameworkId}
            OR (
                c.framework ILIKE ${'%' + inputFrameworkId + '%'}
                AND LENGTH(${inputFrameworkId}) > 3
            )
            OR (
                ${frameworkName.includes("ISO 27001")} AND c.framework ILIKE 'ISO 27001%'
            )
        )
    `;
    console.log("Found Controls:", results[0].count);

    // List categories found
    const categories = await sql`
        SELECT c.category, COUNT(*) 
        FROM client_controls cc
        JOIN controls c ON cc.control_id = c.id
        WHERE cc.client_id = ${clientId}
        AND (
            c.framework = ${frameworkName}
            OR c.framework = ${inputFrameworkId.toUpperCase()}
            OR c.framework = ${inputFrameworkId}
            OR (
                c.framework ILIKE ${'%' + inputFrameworkId + '%'}
                AND LENGTH(${inputFrameworkId}) > 3
            )
            OR (
                ${frameworkName.includes("ISO 27001")} AND c.framework ILIKE 'ISO 27001%'
            )
        )
        GROUP BY c.category
    `;
    console.log("Categories:", categories);

    await sql.end();
}

main().catch(console.error);
