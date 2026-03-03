/**
 * Seed script to add sample data inventory assets marked as personal data for Client 3
 * Run with: npx tsx seed_data_inventory.ts
 */
import 'dotenv/config';
import { getDb } from "./packages/core/src/db";
import { assets } from "./packages/core/src/schema";

async function seedDataInventory() {
    const db = await getDb();
    const clientId = parseInt(process.env.DEFAULT_CLIENT_ID || process.argv[2] || '3', 10);

    // Sample personal data assets to add - matching schema exactly
    const personalDataAssets = [
        {
            clientId,
            name: "Employee Records Database",
            type: "Information",  // Required field
            category: "Database",
            description: "HR database containing employee personal information including names, addresses, SSNs, and performance records",
            owner: "HR Department",
            criticality: "High",
            status: "active" as const,
            isPersonalData: true,
            dataSensitivity: "High",
            dataFormat: "Structured (SQL Database)",
            location: "On-premise HR Server",
            tags: ["HR", "PII", "Employee Data"],
        },
        {
            clientId,
            name: "Customer Email List",
            type: "Information",
            category: "Data Store",
            description: "Marketing database of customer email addresses and communication preferences",
            owner: "Marketing Team",
            criticality: "Medium",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "Medium",
            dataFormat: "Structured (CSV/Excel)",
            location: "Cloud Storage (AWS)",
            tags: ["Marketing", "PII", "Email"],
        },
        {
            clientId,
            name: "Patient Health Records",
            type: "Information",
            category: "Database",
            description: "Medical records system containing patient health information, medical history, and treatment plans",
            owner: "Healthcare Operations",
            criticality: "High",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "High",
            dataFormat: "Structured (EHR System)",
            location: "HIPAA-compliant Cloud",
            tags: ["Healthcare", "PHI", "Medical"],
        },
        {
            clientId,
            name: "User Account Profiles",
            type: "Information",
            category: "Application",
            description: "Application user profiles containing login credentials, preferences, and activity history",
            owner: "IT Security",
            criticality: "High",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "Medium",
            dataFormat: "Structured (NoSQL)",
            location: "Production Database",
            tags: ["User Data", "Authentication", "PII"],
        },
        {
            clientId,
            name: "Financial Transaction Logs",
            type: "Information",
            category: "Database",
            description: "Transaction history including payment details, invoices, and financial reports",
            owner: "Finance Department",
            criticality: "High",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "High",
            dataFormat: "Structured (SQL)",
            location: "Finance Server",
            tags: ["Finance", "PCI-DSS", "Transaction"],
        },
        {
            clientId,
            name: "Job Application Documents",
            type: "Information",
            category: "Documents",
            description: "Recruitment files containing resumes, cover letters, and interview notes for job applicants",
            owner: "HR Department",
            criticality: "Medium",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "Medium",
            dataFormat: "Unstructured (Documents)",
            location: "HR Document Storage",
            tags: ["HR", "Recruitment", "PII"],
        },
        {
            clientId,
            name: "Website Visitor Analytics",
            type: "Information",
            category: "Analytics",
            description: "Website analytics containing visitor IP addresses, browsing patterns, and device information",
            owner: "Digital Marketing",
            criticality: "Low",
            status: "active",
            isPersonalData: true,
            dataSensitivity: "Low",
            dataFormat: "Semi-structured (JSON)",
            location: "Google Analytics",
            tags: ["Analytics", "Cookies", "Behavioral"],
        },
        {
            clientId,
            name: "Supplier Contact Directory",
            type: "Information",
            category: "Data Store",
            description: "Directory of supplier contacts including names, phone numbers, and business addresses",
            owner: "Procurement",
            criticality: "Low",
            status: "active",
            isPersonalData: false,
            dataSensitivity: "Low",
            dataFormat: "Structured (Spreadsheet)",
            location: "Shared Drive",
            tags: ["Suppliers", "Business"],
        },
    ];

    console.log(`Seeding ${personalDataAssets.length} data inventory assets for Client ${clientId}...`);

    let successCount = 0;
    let failCount = 0;

    for (const asset of personalDataAssets) {
        try {
            const [created] = await db.insert(assets).values(asset).returning();
            console.log(`✓ Created: ${created.name} (ID: ${created.id})`);
            successCount++;
        } catch (error: any) {
            console.log(`✗ Failed to create ${asset.name}: ${JSON.stringify(error)}`);
            failCount++;
        }
    }

    console.log(`\nSeeding complete!`);
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
    console.log("\nTo view in Data Inventory, visit:");
    console.log(`  http://localhost:5174/clients/${clientId}/privacy/inventory`);
    console.log("\nTo view in Assets page:");
    console.log(`  http://localhost:5174/clients/${clientId}/assets`);
}

seedDataInventory()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
