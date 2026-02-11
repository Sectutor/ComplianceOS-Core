
import { getDb } from "../db";
import { frameworkRequirements, frameworkKnowledgeMappings } from "../schema";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MAPPINGS = [
    // WEB 2025
    { identifier: "A01:2025", type: "threat_category", value: "Tampering" },
    { identifier: "A01:2025", type: "threat_category", value: "Elevation of Privilege" },
    { identifier: "A01:2025", type: "component_type", value: "Web Client" },
    { identifier: "A01:2025", type: "component_type", value: "API" },

    { identifier: "A02:2025", type: "threat_category", value: "Information Disclosure" },
    { identifier: "A02:2025", type: "component_type", value: "Web Client" },
    { identifier: "A02:2025", type: "component_type", value: "API" },
    { identifier: "A02:2025", type: "component_type", value: "Database" },

    { identifier: "A03:2025", type: "threat_category", value: "Tampering" },
    { identifier: "A03:2025", type: "component_type", value: "General" },

    { identifier: "A04:2025", type: "threat_category", value: "Information Disclosure" },
    { identifier: "A04:2025", type: "component_type", value: "Server" },

    { identifier: "A05:2025", type: "threat_category", value: "Tampering" },
    { identifier: "A05:2025", type: "component_type", value: "Database" },

    // API 2023
    { identifier: "API1:2023", type: "threat_category", value: "Tampering" },
    { identifier: "API1:2023", type: "threat_category", value: "Elevation of Privilege" },
    { identifier: "API1:2023", type: "component_type", value: "API" },

    { identifier: "API2:2023", type: "threat_category", value: "Spoofing" },
    { identifier: "API2:2023", type: "component_type", value: "API" },

    // ML 2023
    { identifier: "ML01:2023", type: "threat_category", value: "Tampering" },
    { identifier: "ML01:2023", type: "component_type", value: "ML Model" },
];

async function main() {
    const db = await getDb();
    console.log("[MappingSeed] Starting mapping seed...");

    // Get all framework requirements to map identifiers to IDs
    const requirements = await db.select().from(frameworkRequirements);
    const reqMap = new Map();
    requirements.forEach((r: any) => reqMap.set(r.identifier, r.id));

    let count = 0;
    for (const m of MAPPINGS) {
        const reqId = reqMap.get(m.identifier);
        if (!reqId) {
            console.warn(`[MappingSeed] Requirement ${m.identifier} not found in DB. Skipping.`);
            continue;
        }

        // Check if mapping exists
        const existing = await db.select().from(frameworkKnowledgeMappings).where(
            and(
                eq(frameworkKnowledgeMappings.sourceRequirementId, reqId),
                eq(frameworkKnowledgeMappings.targetType, m.type),
                eq(frameworkKnowledgeMappings.targetValue, m.value)
            )
        );

        if (existing.length === 0) {
            await db.insert(frameworkKnowledgeMappings).values({
                sourceRequirementId: reqId,
                targetType: m.type,
                targetValue: m.value,
                mappingWeight: 1
            });
            count++;
        }
    }

    console.log(`[MappingSeed] Successfully created ${count} mappings.`);
    process.exit(0);
}

main().catch(console.error);
