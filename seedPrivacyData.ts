
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { getDb } from "./packages/core/src/db";
import {
    assets,
    businessProcesses,
    processDataFlows,
    dsarRequests,
    privacyAssessments
} from "./packages/core/src/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Seeding Privacy Module Data...");
    const db = await getDb();

    // Using Client ID 6 (ACME INC - identified from tasks seeder)
    const clientId = 6;
    console.log(`Targeting Client ID: ${clientId}`);

    // 1. Create Business Processes
    console.log("Creating Business Processes...");
    const processes = [
        {
            clientId,
            name: "Customer Onboarding",
            description: "Process for registering new customers and performing KYC checks.",
            department: "Operations",
            criticalityTier: "Tier 1",
        },
        {
            clientId,
            name: "Payroll Processing",
            description: "Monthly payroll cycles for employees and contractors.",
            department: "HR/Finance",
            criticalityTier: "Tier 1",
        },
        {
            clientId,
            name: "Marketing Analytics",
            description: "Analyzing customer behavior on the web platform.",
            department: "Marketing",
            criticalityTier: "Tier 2",
        }
    ];

    const insertedProcesses = await db.insert(businessProcesses).values(processes).returning();
    const onboardingProcessId = insertedProcesses[0].id;
    const payrollProcessId = insertedProcesses[1].id;

    // 2. Create PII Assets
    console.log("Creating PII Assets...");
    const piiAssets = [
        {
            clientId,
            name: "Customer CRM Database",
            type: "Information",
            isPersonalData: true,
            dataSensitivity: "Confidential",
            dataFormat: "Digital",
            description: "Main customer database containing names, emails, and purchase history.",
            department: "IT",
            owner: "CTO",
        },
        {
            clientId,
            name: "Employee HR Records",
            type: "Information",
            isPersonalData: true,
            dataSensitivity: "Restricted",
            dataFormat: "Digital",
            description: "HR records including SSNs, bank details, and home addresses.",
            department: "HR",
            owner: "HR Director",
        },
        {
            clientId,
            name: "Web Server Access Logs",
            type: "Information",
            isPersonalData: true,
            dataSensitivity: "Internal",
            dataFormat: "Digital",
            description: "Logs containing IP addresses and user agent strings.",
            department: "IT",
            owner: "Security Lead",
        }
    ];

    const insertedAssets = await db.insert(assets).values(piiAssets).returning();
    const crmAssetId = insertedAssets[0].id;
    const hrAssetId = insertedAssets[1].id;

    // 3. Create Data Flows (ROPA)
    console.log("Creating Data Flows...");
    const flows = [
        {
            processId: onboardingProcessId,
            assetId: crmAssetId,
            flowDirection: "inbound", // e.g., customer -> CRM
            dataOrigin: "Customer Portal",
            dataDestination: "Main Database",
            description: "Input of customer registration details.",
            lawfulBasis: "Contractual Necessity",
            retentionPeriod: "7 years post-contract",
        },
        {
            processId: payrollProcessId,
            assetId: hrAssetId,
            flowDirection: "outbound",
            dataOrigin: "Internal HR System",
            dataDestination: "Payment Provider (Stripe/Bank)",
            description: "Transfer of employee details for payment processing.",
            lawfulBasis: "Legal Obligation",
            retentionPeriod: "10 years (Tax law)",
        }
    ];

    await db.insert(processDataFlows).values(flows);

    // 4. Create DSAR Requests
    console.log("Creating DSAR Requests...");
    const dsars = [
        {
            clientId,
            requestId: "DSAR-2024-001",
            requestType: "Access",
            status: "In Progress",
            subjectName: "John Doe",
            subjectEmail: "john.doe@example.com",
            requestDate: new Date("2024-02-10"),
            dueDate: new Date("2024-03-10"),
            priority: "high",
        },
        {
            clientId,
            requestId: "DSAR-2024-002",
            requestType: "Deletion",
            status: "New",
            subjectName: "Jane Smith",
            subjectEmail: "jane.smith@example.com",
            requestDate: new Date("2024-02-14"),
            dueDate: new Date("2024-03-14"),
            priority: "medium",
        }
    ];

    await db.insert(dsarRequests).values(dsars);

    // 5. Create Privacy Assessments
    console.log("Creating Privacy Assessments...");
    const assessments = [
        {
            clientId,
            type: "gdpr",
            status: "in_progress",
            score: 45,
            responses: {
                "Q1.1": { answer: "Yes", notes: "Privacy policy is updated and linked in footer." },
                "Q1.2": { answer: "Partial", notes: "Working on cookie consent banner implementation." },
                "Q2.1": { answer: "No", notes: "DPIA process needs to be finalized." }
            }
        }
    ];

    await db.insert(privacyAssessments).values(assessments);

    console.log("✓ Privacy Data Seeding Completed Successfully.");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Error seeding privacy data:", err);
        process.exit(1);
    });
