
import 'dotenv/config';
import { getDb } from '../packages/core/src/db';
import { controls } from '../packages/core/src/schema';
import { eq } from 'drizzle-orm';

const NIST_800_53_CONTROLS = [
    {
        controlId: "AC-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] an access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and procedures to facilitate the implementation of the access control policy and associated access controls; and reviews and updates the current access control policy [Assignment: organization-defined frequency]; and access control procedures [Assignment: organization-defined frequency].",
        framework: "NIST 800-53",
        category: "Access Control",
        grouping: "AC",
        status: "active",
        version: 5
    },
    {
        controlId: "AC-2",
        name: "Account Management",
        description: "The organization identifies and selects the following types of information system accounts to support organizational missions/business functions: [Assignment: organization-defined information system account types]; assigns account managers for information system accounts; establishes conditions for group and role membership; specifies authorized users of the information system, group and role membership, and access authorizations (i.e., privileges) and other attributes (as required) for each account; requires approvals by [Assignment: organization-defined personnel or roles] for requests to create information system accounts; creates, enables, modifies, disables, and removes information system accounts in accordance with [Assignment: organization-defined procedures or conditions]; monitors the use of information system accounts; notifies account managers when accounts are no longer required, when users are terminated or transferred, and when individual information system usage or need-to-know changes; authorizes access to the information system based on a valid access authorization, intended system usage, and other attributes as required by the organization or associated mission/business functions; reviews accounts for compliance with account management requirements [Assignment: organization-defined frequency]; and establishes a process for reissuing shared/group account credentials (if deployed) when individuals are removed from the group.",
        framework: "NIST 800-53",
        category: "Access Control",
        grouping: "AC",
        status: "active",
        version: 5
    },
    {
        controlId: "AC-3",
        name: "Access Enforcement",
        description: "The information system enforces approved authorizations for logical access to information and system resources in accordance with the access control policies.",
        framework: "NIST 800-53",
        category: "Access Control",
        grouping: "AC",
        status: "active",
        version: 5
    },
    {
        controlId: "AT-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a security awareness and training policy...",
        framework: "NIST 800-53",
        category: "Awareness and Training",
        grouping: "AT",
        status: "active",
        version: 5
    },
    {
        controlId: "AT-2",
        name: "Literacy Training and Awareness",
        description: "The organization provides basic security awareness training to information system users (including managers, senior executives, and contractors)...",
        framework: "NIST 800-53",
        category: "Awareness and Training",
        grouping: "AT",
        status: "active",
        version: 5
    },
    {
        controlId: "AU-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] an audit and accountability policy...",
        framework: "NIST 800-53",
        category: "Audit and Accountability",
        grouping: "AU",
        status: "active",
        version: 5
    },
    {
        controlId: "AU-2",
        name: "Event Logging",
        description: "The organization identifies the types of events that the system is capable of logging...",
        framework: "NIST 800-53",
        category: "Audit and Accountability",
        grouping: "AU",
        status: "active",
        version: 5
    },
    {
        controlId: "CM-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a configuration management policy...",
        framework: "NIST 800-53",
        category: "Configuration Management",
        grouping: "CM",
        status: "active",
        version: 5
    },
    {
        controlId: "CM-8",
        name: "System Component Inventory",
        description: "The organization develops and documents an inventory of information system components that: a. Accurately reflects the current information system; b. Includes all components within the authorization boundary of the information system; c. Is at the level of granularity deemed necessary for tracking and reporting; and d. Includes [Assignment: organization-defined information deemed necessary to achieve effective property accountability and/or correct component identification]; reviews and updates the information system component inventory [Assignment: organization-defined frequency].",
        framework: "NIST 800-53",
        category: "Configuration Management",
        grouping: "CM",
        status: "active",
        version: 5
    },
    {
        controlId: "CP-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a contingency planning policy...",
        framework: "NIST 800-53",
        category: "Contingency Planning",
        grouping: "CP",
        status: "active",
        version: 5
    },
    {
        controlId: "IA-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] an identification and authentication policy...",
        framework: "NIST 800-53",
        category: "Identification and Authentication",
        grouping: "IA",
        status: "active",
        version: 5
    },
    {
        controlId: "IA-2",
        name: "Identification and Authentication (Organizational Users)",
        description: "The information system uniquely identifies and authenticates organizational users (or processes acting on behalf of organizational users).",
        framework: "NIST 800-53",
        category: "Identification and Authentication",
        grouping: "IA",
        status: "active",
        version: 5
    },
    {
        controlId: "IR-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] an incident response policy...",
        framework: "NIST 800-53",
        category: "Incident Response",
        grouping: "IR",
        status: "active",
        version: 5
    },
    {
        controlId: "RA-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a risk assessment policy...",
        framework: "NIST 800-53",
        category: "Risk Assessment",
        grouping: "RA",
        status: "active",
        version: 5
    },
    {
        controlId: "SC-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a system and communications protection policy...",
        framework: "NIST 800-53",
        category: "System and Communications Protection",
        grouping: "SC",
        status: "active",
        version: 5
    },
    {
        controlId: "SI-1",
        name: "Policy and Procedures",
        description: "The organization develops, documents, and disseminates to [Assignment: organization-defined personnel or roles] a system and information integrity policy...",
        framework: "NIST 800-53",
        category: "System and Information Integrity",
        grouping: "SI",
        status: "active",
        version: 5
    }
];

// Helper to convert to DB insert type (partial)
type InsertControl = typeof controls.$inferInsert;

async function seed() {
    console.log("Initializing DB connection...");
    const db = await getDb();

    console.log(`Seeding ${NIST_800_53_CONTROLS.length} NIST 800-53 controls...`);

    let added = 0;
    let updated = 0;

    for (const ctrl of NIST_800_53_CONTROLS) {
        // Check if exists
        const existing = await db.select().from(controls)
            .where(eq(controls.controlId, ctrl.controlId))
            .limit(1);

        const controlData: InsertControl = {
            ...ctrl,
            frequency: "Annual",
            evidenceType: "Document",
        };

        if (existing.length > 0) {
            // Update
            await db.update(controls)
                .set({
                    ...controlData,
                    updatedAt: new Date()
                })
                .where(eq(controls.id, existing[0].id));
            updated++;
        } else {
            // Insert
            await db.insert(controls).values(controlData);
            added++;
        }
    }

    console.log(`Finished. Added: ${added}, Updated: ${updated}`);
    process.exit(0);
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
