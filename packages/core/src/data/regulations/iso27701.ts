import { Regulation } from "./types";

export const iso27701: Regulation = {
    id: "iso-27701",
    name: "ISO/IEC 27701:2019",
    description: "Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management — Requirements and guidelines.",
    type: "Privacy",
    logo: "/frameworks/iso27701.svg",
    articles: [
        {
            id: "iso27701-5",
            numericId: "5",
            title: "PIMS-specific requirements for ISO/IEC 27001",
            description: "Requirements for PIMS related to ISO/IEC 27001 clauses 4 to 10.",
            subArticles: [
                { id: "5.2", title: "Context of the organization", description: "Determine external and internal factors relevant to privacy." },
                { id: "5.4", title: "Planning", description: "Address risks and opportunities related to PII processing." },
                { id: "5.5", title: "Support", description: "Resources, competence, and awareness for privacy." }
            ]
        },
        {
            id: "iso27701-6",
            numericId: "6",
            title: "PIMS-specific guidance for ISO/IEC 27002",
            description: "Guidance for PIMS related to ISO/IEC 27002 controls.",
            subArticles: [
                { id: "6.3", title: "Information security policies", description: "Include privacy protection in policies." },
                { id: "6.5", title: "Human resource security", description: "Privacy training and awareness." },
                { id: "6.9", title: "Access control", description: "User access management for PII." },
                { id: "6.10", title: "Cryptography", description: "Encryption of PII." },
                { id: "6.15", title: "Supplier relationships", description: "Privacy requirements in supplier agreements." }
            ]
        },
        {
            id: "iso27701-7",
            numericId: "7",
            title: "Additional guidance for PII Controllers",
            description: "Specific controls for organizations acting as PII Controllers.",
            subArticles: [
                { id: "7.2.1", title: "Identify lawful basis", description: "Determine and document the lawful basis for processing." },
                { id: "7.2.2", title: "Consent", description: "Obtain and record consent where applicable." },
                { id: "7.2.3", title: "Privacy impact assessment", description: "Conduct PIAs for high-risk processing." },
                { id: "7.3.1", title: "Notice", description: "Provide privacy notices to PII principals." },
                { id: "7.3.4", title: "Access, correction, deletion", description: "Mechanisms for data subject rights." }
            ]
        },
        {
            id: "iso27701-8",
            numericId: "8",
            title: "Additional guidance for PII Processors",
            description: "Specific controls for organizations acting as PII Processors.",
            subArticles: [
                { id: "8.2.1", title: "Customer agreement", description: "Process PII only per customer instructions." },
                { id: "8.2.2", title: "Marketing and advertising", description: "Do not use PII for marketing without consent." },
                { id: "8.2.6", title: "Records", description: "Maintain records of processing activities." },
                { id: "8.5.1", title: "Secure transfer", description: "Ensure security of cross-border transfers." }
            ]
        }
    ],
    questions: [
        {
            id: "q_iso27701_role",
            text: "Does your organization act as a PII Controller, Processor, or both?",
            type: "select",
            options: ["Controller", "Processor", "Both"],
            relatedArticles: ["iso27701-7", "iso27701-8"]
        },
        {
            id: "q_iso27701_isms",
            text: "Do you have an existing ISO 27001 ISMS in place?",
            type: "boolean",
            relatedArticles: ["iso27701-5"]
        },
        {
            id: "q_iso27701_pia",
            text: "Do you conduct Privacy Impact Assessments (PIAs) for new processing activities?",
            type: "boolean",
            relatedArticles: ["iso27701-7"]
        }
    ]
};
