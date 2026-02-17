import 'dotenv/config';
import postgres from 'postgres';

async function main() {
    console.log("Checking DB connection...");
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing from environment!");
        process.exit(1);
    }
    console.log("DATABASE_URL is present.");

    try {
        // Match db.ts configuration
        const sql = postgres(process.env.DATABASE_URL, {
            ssl: 'require',
            max: 1
        });

        const controlsResult = await sql`SELECT count(*) as count FROM controls`;
        console.log(`Controls Count: ${controlsResult[0].count}`);

        const clientsResult = await sql`SELECT count(*) as count FROM clients`;
        console.log(`Clients Count: ${clientsResult[0].count}`);

        await sql.end();
        process.exit(0);
    } catch (e) {
        console.error("Database Error:", e);
        process.exit(1);
    }
}

main();
