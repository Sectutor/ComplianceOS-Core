
import { Regulation } from "./types";

export const ucpa: Regulation = {
    id: "ucpa",
    name: "UCPA (Utah Consumer Privacy Act)",
    description: "The Utah Consumer Privacy Act (UCPA) provides a distinctly business-friendly privacy framework compared to its coastal counterparts. Targeted exclusively at large-scale data processors, the UCPA balances consumer transparency and control rights (like data access and deletion) against operational pragmatism. Notably, it omits the requirement for Data Protection Assessments and private rights of action, relying instead entirely on the Utah Attorney General for enforcement.",
    type: "Privacy",
    logo: "/frameworks/utah.svg",
    articles: [
        {
            id: "ucpa-13-61-201",
            numericId: "§ 13-61-201",
            title: "Consumer Privacy Rights & Access Mechanics",
            description: "Section 13-61-201 enumerates the fundamental digital rights of Utah residents. Data controllers must architect their systems to systematically ingest, authenticate, and fulfill these consumer requests within a rigid 45-day statutory response window, ensuring consumers have transparent oversight of their digital footprints without imposing undue friction.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "IA-8", "PT-5"],
                "ISO 27001": ["A.9.1.1"]
            },
            subArticles: [
                { id: "ucpa-201-access", title: "Confirmation, Access, and Deletion", description: "Consumers possess the affirmative right to confirm whether a business is actively processing their personal data and to access a copy of that specific data payload. Furthermore, consumers hold the right to demand the permanent deletion of personal data that the consumer directly provided to the controller.", mappedControls: { "NIST 800-53": ["MP-6"] } },
                { id: "ucpa-201-portability", title: "Data Portability Right", description: "Controllers are mandated to supply the authenticated consumer with a copy of the personal data they previously provided in a format that is universally portable, technically structured, and readily usable, strictly enabling the transfer of the data to an alternative service provider.", mappedControls: { "NIST 800-53": ["SC-1"] } },
                { id: "ucpa-201-optout", title: "Targeted Advertising and Sales Opt-Out", description: "Consumers have the statutory right to instruct digital controllers to immediately cease processing their personal data for the specific purposes of executing targeted digital advertising campaigns or the financial sale of their personal data to third-party aggregators.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "ucpa-13-61-302",
            numericId: "§ 13-61-302",
            title: "Corporate Duties & Data Transparency",
            description: "Section 13-61-302 outlines the core operational responsibilities governing data controllers under the UCPA. It mandates a philosophy of aggressive transparency regarding data practices and imposes stringent security obligations to shield consumer data from adversarial compromise.",
            mappedControls: {
                "NIST 800-53": ["PT-5", "SC-1", "SC-7", "SI-4"],
                "ISO 27001": ["A.18.1.4", "A.12.6.1"]
            },
            subArticles: [
                { id: "ucpa-302-notice", title: "Meaningful Privacy Notices", description: "The controller must publicly furnish a reasonably accessible and crystal-clear privacy notice. This document is legally compelled to disclose the exact categories of personal data processed, the specific operational purposes driving that processing, how consumers can enact their UCPA rights, and an inventory of the third-party classes accessing the data.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "ucpa-302-security", title: "Reasonable Security Guardrails", description: "Utah law legislatively mandates that businesses establish, implement, and dynamically maintain technically and administratively reasonable cybersecurity data security practices. These security barricades (like AES-256 encryption and MFA) must be mathematically proportional to the volume and specific characteristics of the consumer data warehoused.", mappedControls: { "NIST 800-53": ["SC-1", "SI-4"] } },
                { id: "ucpa-302-sensitive", title: "Disclosure of Sensitive Data Processing", description: "Unlike other state laws that require prior affirmative consent, the UCPA legally permits the processing of sensitive demographic data (race, religion, medical status) provided the controller first presents the consumer with a clear notice and subsequently provides an obvious technical mechanism for the consumer to aggressively opt-out.", mappedControls: { "NIST 800-53": ["AC-3"] } }
            ]
        }
    ],
    questions: [
        {
            id: "q_ucpa_threshold",
            text: "Jurisdictional Threshold: Has corporate finance definitively confirmed that the organization exceeds the UCPA's dual economic threshold—generating over $25,000,000 in annual revenue AND either controlling the data of 100,000+ Utah consumers or deriving 50%+ of gross revenue from the sale of data of 25,000+ Utah consumers?",
            type: "boolean",
            relatedArticles: ["ucpa-rights"]
        },
        {
            id: "q_ucpa_optout",
            text: "Opt-Out Architecture: Does the application feature an easily accessible, friction-free interface explicitly empowering users to legally opt-out of behavioral targeted advertising and the financial sale of their digital identity footprints?",
            type: "boolean",
            relatedArticles: ["ucpa-13-61-201"]
        },
        {
            id: "q_ucpa_sensitive",
            text: "Sensitive Data Governance: If processing historically sensitive categories (e.g., genetic algorithms, precise geolocation), has the engineering team deployed an upfront notification barrier bundled with an immediate, functional opt-out parameter?",
            type: "boolean",
            relatedArticles: ["ucpa-13-61-302"]
        },
        {
            id: "q_ucpa_security",
            text: "Cybersecurity Proportionality: Can the organization technically prove that its currently deployed administrative and physical cybersecurity defenses (such as role-based access control and database encryption) are legally 'reasonable' and mathematically scaled to the volume of data stored?",
            type: "boolean",
            relatedArticles: ["ucpa-13-61-302"]
        }
    ]
};
