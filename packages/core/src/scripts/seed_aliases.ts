
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: false });

    const frameworks = [
        {
            name: "ISO 27001:2022",
            short_code: "ISO-27001",
            description: "Information security, cybersecurity and privacy protection — Information security management systems — Requirements",
            version: "2022",
            type: "standard"
        },
        {
            name: "ISO 27001:2022",
            short_code: "ISO27001", // Alias
            description: "Information security, cybersecurity and privacy protection — Information security management systems — Requirements",
            version: "2022",
            type: "standard"
        }
    ];

    for (const fw of frameworks) {
        await sql`
            INSERT INTO compliance_frameworks (name, short_code, description, version, type)
            VALUES (${fw.name}, ${fw.short_code}, ${fw.description}, ${fw.version}, ${fw.type})
            ON CONFLICT (short_code) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                version = EXCLUDED.version
        `;
    }

    console.log("Seeding aliases complete.");
    await sql.end();
}

main().catch(console.error);
