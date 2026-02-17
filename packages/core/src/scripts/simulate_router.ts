
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: false });

    // Simulating the router's logic exactly
    const clientId = 3;
    const inputId = "iso-27001";

    // 1. Resolve framework name
    const frameworks = await sql`
        SELECT name FROM compliance_frameworks 
        WHERE UPPER(short_code) = ${inputId.toUpperCase()}
        LIMIT 1
    `;

    let frameworkName = inputId;
    if (frameworks.length > 0) {
        frameworkName = frameworks[0].name;
    }
    console.log(`Resolved: ${frameworkName}`);

    // 2. Fetch results
    const results = await sql`
        SELECT 
            cc.id,
            c.control_id as "controlId",
            c.name,
            c.description,
            cc.status,
            c.category
        FROM client_controls cc
        JOIN controls c ON cc.control_id = c.id
        WHERE cc.client_id = ${clientId}
        AND (
            c.framework = ${frameworkName}
            OR c.framework = ${inputId.toUpperCase()}
            OR c.framework = ${inputId.toUpperCase().replace('-', ' ')}
            OR c.framework = ${inputId.toUpperCase().replace('-', '')}
            OR c.framework ILIKE ${'%' + inputId + '%'}
            OR c.framework ILIKE ${frameworkName + '%'}
        )
        ORDER BY c.control_id ASC
    `;

    console.log(`Found ${results.length} results.`);
    if (results.length > 0) {
        console.log("First result:", results[0]);
    }

    await sql.end();
}

main().catch(console.error);
