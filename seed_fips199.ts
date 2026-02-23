
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from './packages/core/src/db';
import { fips199InformationTypesRef } from './packages/core/src/schema';

async function seedFips199() {
    // Ensure DATABASE_URL is set from the .env file in the root or packages/core
    const db = await getDb();
    console.log("Seeding FIPS 199 Information Types...");

    const infoTypes = [
        {
            code: "C.3.2.1",
            name: "Financial Management",
            category: "Service-Based",
            description: "Financial management information types involve the stewardship of financial resources.",
            provisionalConfidentiality: "moderate",
            provisionalIntegrity: "moderate",
            provisionalAvailability: "low"
        },
        {
            code: "C.3.5.1",
            name: "Human Resources Management",
            category: "Service-Based",
            description: "HR management information involves the management of the organization's workforce.",
            provisionalConfidentiality: "moderate",
            provisionalIntegrity: "moderate",
            provisionalAvailability: "low"
        },
        {
            code: "D.3.4.1",
            name: "Information Technology Infrastructure",
            category: "Service-Based",
            description: "IT infrastructure information involves the management of the computing environment.",
            provisionalConfidentiality: "low",
            provisionalIntegrity: "moderate",
            provisionalAvailability: "moderate"
        },
        {
            code: "C.1.1.1",
            name: "Public Affairs",
            category: "Mission-Based",
            description: "Information provided to the public about the organization.",
            provisionalConfidentiality: "low",
            provisionalIntegrity: "moderate",
            provisionalAvailability: "low"
        },
        {
            code: "C.2.8.2",
            name: "Criminal Investigation",
            category: "Mission-Based",
            description: "Information related to criminal investigations.",
            provisionalConfidentiality: "high",
            provisionalIntegrity: "high",
            provisionalAvailability: "moderate"
        },
        {
            code: "GEN.01",
            name: "Personally Identifiable Information (PII)",
            category: "General",
            description: "Any information about an individual maintained by an agency.",
            provisionalConfidentiality: "moderate",
            provisionalIntegrity: "moderate",
            provisionalAvailability: "low"
        },
        {
            code: "GEN.02",
            name: "Health Information",
            category: "General",
            description: "Information relating to the past, present, or future physical or mental health of an individual.",
            provisionalConfidentiality: "high",
            provisionalIntegrity: "high",
            provisionalAvailability: "moderate"
        }
    ];

    for (const type of infoTypes) {
        try {
            await db.insert(fips199InformationTypesRef).values(type).onConflictDoUpdate({
                target: fips199InformationTypesRef.code,
                set: type
            });
            console.log(`- Seeded ${type.code}: ${type.name}`);
        } catch (error) {
            console.error(`- Error seeding ${type.code}:`, error.message);
        }
    }

    console.log("FIPS 199 Seeding complete.");
    process.exit(0);
}

seedFips199();
