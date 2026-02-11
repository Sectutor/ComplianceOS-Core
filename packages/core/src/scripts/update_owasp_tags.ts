
import { getDb } from "../db";
import { complianceFrameworks, implementationPhases, frameworkRequirements, controls } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const WEB_TAGS: Record<string, string[]> = {
    "A01:2025": ["OWASP", "WEB", "2025", "Tampering", "Elevation of Privilege"],
    "A02:2025": ["OWASP", "WEB", "2025", "Information Disclosure", "Cryptography"],
    "A03:2025": ["OWASP", "WEB", "2025", "Tampering", "Injection"],
    "A04:2025": ["OWASP", "WEB", "2025", "Insecure Design"],
    "A05:2025": ["OWASP", "WEB", "2025", "Tampering", "Security Misconfiguration"],
    "A06:2025": ["OWASP", "WEB", "2025", "Information Disclosure", "Vulnerable Components"],
    "A07:2025": ["OWASP", "WEB", "2025", "Spoofing", "Authentication"],
    "A08:2025": ["OWASP", "WEB", "2025", "Tampering", "Data Integrity"],
    "A09:2025": ["OWASP", "WEB", "2025", "Information Disclosure", "Logging", "Monitoring"],
    "A10:2025": ["OWASP", "WEB", "2025", "Tampering", "SSRF"]
};

const API_TAGS: Record<string, string[]> = {
    "API1:2023": ["OWASP", "API", "2023", "Tampering", "Elevation of Privilege", "BOLA"],
    "API2:2023": ["OWASP", "API", "2023", "Spoofing", "Authentication"],
    "API3:2023": ["OWASP", "API", "2023", "Information Disclosure", "BOPLA"],
    "API4:2023": ["OWASP", "API", "2023", "Denial of Service", "Resource Consumption"],
    "API5:2023": ["OWASP", "API", "2023", "Tampering", "BFLA"],
    "API6:2023": ["OWASP", "API", "2023", "Tampering", "Business Logic"],
    "API7:2023": ["OWASP", "API", "2023", "Tampering", "Server-Side Request Forgery"],
    "API8:2023": ["OWASP", "API", "2023", "Security Misconfiguration"],
    "API9:2023": ["OWASP", "API", "2023", "Information Disclosure", "Inventory"],
    "API10:2023": ["OWASP", "API", "2023", "Tampering", "Unsafe Consumption"]
};

async function main() {
    const db = await getDb();
    console.log("[TagUpdate] Updating OWASP mapping tags for better intelligence...");

    const requirements = await db.select().from(frameworkRequirements);

    let count = 0;
    for (const req of requirements) {
        let newTags: string[] | null = null;

        if (WEB_TAGS[req.identifier]) {
            newTags = WEB_TAGS[req.identifier];
        } else if (API_TAGS[req.identifier]) {
            newTags = API_TAGS[req.identifier];
        } else if (req.identifier.startsWith("ML")) {
            newTags = ["OWASP", "ML", "2023", "AI", "Tampering"];
        }

        if (newTags) {
            await db.update(frameworkRequirements)
                .set({ mappingTags: newTags })
                .where(eq(frameworkRequirements.id, req.id));
            count++;
        }
    }

    console.log(`[TagUpdate] Successfully updated ${count} requirements with rich tags.`);
    process.exit(0);
}

main().catch(console.error);
