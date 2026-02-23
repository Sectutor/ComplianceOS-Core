
import { Regulation } from "./types";

export const australiaPrivacy: Regulation = {
    id: "australia-privacy",
    name: "Australia Privacy Act 1988 & APPs",
    description: "The Privacy Act 1988 is the fundamental Australian legislation governing the handling of personal information. It is structurally anchored by 13 Australian Privacy Principles (APPs) that mandate how private sector entities and federal government agencies govern the entire lifecycle of consumer data—from initial algorithmic collection through operational utilization to secure cryptographical destruction. The Office of the Australian Information Commissioner (OAIC) actively enforces these principles.",
    type: "Privacy",
    logo: "/frameworks/australia.svg",
    articles: [
        {
            id: "app-1",
            numericId: "APP 1",
            title: "Open and Transparent Management of Information",
            description: "APP 1 establishes the baseline for organizational accountability. It legally requires entities to engineer their data processing practices with absolute transparency, mandating a clearly articulated, publicly accessible Privacy Policy that meticulously outlines data flow architecture, the types of data collected, and the specific procedures consumers can use to issue complaints.",
            mappedControls: {
                "NIST 800-53": ["PM-1", "PT-5"],
                "ISO 27001": ["A.5.1.1"]
            },
            subArticles: [
                { id: "app-1-2", title: "Information Flow Governance", description: "Entities must implement concrete practices, procedures, and systems geared toward proactive compliance. This necessitates establishing internal data flow mapping and formalized governance structures to ensure the organization inherently respects the APPs in daily operations.", mappedControls: { "NIST 800-53": ["PM-1"] } }
            ]
        },
        {
            id: "app-8",
            numericId: "APP 8",
            title: "Cross-border Disclosure of Personal Information",
            description: "Before transferring or routing an Australian citizen's personal data to an overseas recipient (e.g., a foreign cloud provider), the Australian entity must execute 'reasonable steps'—typically legally binding contractual clauses—to guarantee the foreign recipient will not breach the APPs, ensuring liability remains anchored to the Australian source.",
            mappedControls: {
                "NIST 800-53": ["SA-9", "CA-3"],
                "ISO 27001": ["A.15.1.1"]
            }
        },
        {
            id: "app-11",
            numericId: "APP 11",
            title: "Security of Personal Information",
            description: "APP 11 is the cybersecurity cornerstone. It demands that entities take active, 'reasonable steps' to fiercely defend personal information from misuse, algorithmic interference, loss, and unauthorized logical access. Crucially, it dictates the immediate irrecoverable destruction or algorithmic de-identification of data once it is no longer required for its original authorized purpose.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SI-4", "MP-6"],
                "ISO 27001": ["A.12.6.1", "A.8.2.3"]
            },
            subArticles: [
                { id: "app-11-destroy", title: "Data Sanitization and Destruction", description: "Storage space is a liability. Entities must deploy automated data lifecycle management to reliably detect and cryptographically wipe or permanently de-identify personal data the exact moment it surpasses its legal retention necessity.", mappedControls: { "NIST 800-53": ["MP-6"] } }
            ]
        }
    ],
    questions: [
        {
            id: "q_australia_policy",
            text: "Transparent Governance: Does the organization prominently publish a legally vetted Privacy Policy that meticulously details the technical systems and business logic used to acquire, route, and monetize consumer data?",
            type: "boolean",
            relatedArticles: ["app-1"]
        },
        {
            id: "q_australia_crossborder",
            text: "Foreign Vendor Liability: If routing personal data to international servers or foreign third-party APIs, has legal counsel executed enforceable contracts (or verified adequacy) ensuring the overseas entity algorithmically complies with APP safeguards?",
            type: "boolean",
            relatedArticles: ["app-8"]
        },
        {
            id: "q_australia_security",
            text: "Proportional Defense Posture: Has the CISO deployed layered, active technical defenses (such as end-to-end encryption and SIEM monitoring) legally justifiable as 'reasonable steps' to protect the specific volume of data warehoused from compromise?",
            type: "boolean",
            relatedArticles: ["app-11"]
        },
        {
            id: "q_australia_retention",
            text: "Automated Data Expiration: Are strict technical lifecycle policies engineered into the database architecture to automatically trigger the irreversible cryptographic destruction or de-identification of data immediately upon the expiration of its operational purpose?",
            type: "boolean",
            relatedArticles: ["app-11"]
        }
    ]
};
