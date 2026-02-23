import { Regulation } from "./types";

export const iso27701: Regulation = {
    id: "iso-27701",
    name: "ISO/IEC 27701 (Privacy Information Management)",
    description: "ISO/IEC 27701 operates as the premier global privacy extension to the renowned ISO/IEC 27001 Information Security Management System (ISMS). Actively transforming an ISMS into a Privacy Information Management System (PIMS), it provides an actionable, universally accepted auditing framework. ISO 27701 bridges the gap between privacy legislation (like GDPR or CCPA) and operational cybersecurity, detailing exact administrative and technical controls required for both PII Controllers and PII Processors.",
    type: "Privacy",
    logo: "/frameworks/iso27701.svg",
    articles: [
        {
            id: "iso27701-5",
            numericId: "Clause 5",
            title: "PIMS-Specific Requirements (Extending ISO 27001)",
            description: "Clause 5 demands the structural integration of privacy risks into the organization's existing ISMS architecture. Information Security teams are required to formally expand the 'Context of the Organization' to recognize the risks posed not just to the corporation, but explicitly to the data subjects (PII Principals) regarding the loss of confidentiality or privacy.",
            mappedControls: {
                "NIST 800-53": ["PM-1", "PM-9", "RA-3"],
                "ISO 27001": ["A.6.1.1"]
            },
            subArticles: [
                { id: "5.4", title: "Privacy Risk Assessment Planning", description: "The overarching Risk Assessment methodology must be modified. Teams must systematically identify, prioritize, and mathematically mitigate risks relating to the specific collection, processing, and hardware storage of PII.", mappedControls: { "NIST 800-53": ["RA-3"] } }
            ]
        },
        {
            id: "iso27701-6",
            numericId: "Clause 6",
            title: "PIMS-Specific Guidance (Extending ISO 27002)",
            description: "A pivotal engineering domain. Clause 6 expands upon standard ISO 27002 security controls, strictly tailoring them to protect PII. This requires deploying stringent Access Control logic, robust cryptographic parameters, and aggressive supplier auditing to ensure PII is defended at all architectural endpoints.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "SC-28", "AT-2", "SA-9"],
                "ISO 27001": ["A.9.1.1", "A.10.1.1", "A.15.1.1"]
            },
            subArticles: [
                { id: "6.9", title: "Access Control Modeling for PII", description: "Systems must enforce Zero-Trust access logic focused specifically on PII. Personnel and software agents must be granted the absolute minimum logical access necessary to operate, governed by strict Role-Based Access Control (RBAC).", mappedControls: { "NIST 800-53": ["AC-3"] } },
                { id: "6.10", title: "Cryptographic Deployment", description: "Encryption is mandatory. PII must be structurally protected via robust encryption algorithms both at-rest within databases and in-transit across network perimeters.", mappedControls: { "NIST 800-53": ["SC-28"] } }
            ]
        },
        {
            id: "iso27701-7",
            numericId: "Clause 7",
            title: "Architectural Controls for PII Controllers",
            description: "If the organization subjectively decides the 'why' and 'how' of data processing, it is a PII Controller. Clause 7 dictates specific operational constraints, mandating clear privacy notices, verified consent mechanisms (where applicable), and the systemic engineering required to instantly fulfill Data Subject Rights.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "MP-6"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "7.2.3", title: "Privacy Impact Assessments (PIAs)", description: "Before deploying new technology or fundamentally altering a processing pipeline, controllers must conduct, document, and review rigorous Privacy Impact Assessments examining the specific rights impact to the user.", mappedControls: { "NIST 800-53": ["RA-3"] } },
                { id: "7.3", title: "Notice and Data Subject Rights", description: "Controllers must architect public-facing, technically sound mechanisms allowing users to access, review, securely export, or permanently delete their data within statutory timeframes.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "iso27701-8",
            numericId: "Clause 8",
            title: "Operational Guardrails for PII Processors",
            description: "If the organization processes data purely on behalf of a client, it is a PII Processor. Clause 8 establishes defensive legal and technical parameters: processors are strictly forbidden from utilizing the inherited PII for internal algorithmic training or marketing, and must securely process data exclusively according to binding client contracts.",
            mappedControls: {
                "NIST 800-53": ["SA-9", "SC-1"],
                "ISO 27001": ["A.15.1.1"]
            },
            subArticles: [
                { id: "8.2.1", title: "Strict Customer Instruction Execution", description: "Software logic must ensure PII is processed exclusively based on documented customer instructions. The lateral movement or secondary monetization of inherited PII is a severe violation.", mappedControls: { "NIST 800-53": ["AC-3"] } }
            ]
        }
    ],
    questions: [
        {
            id: "q_iso27701_isms",
            text: "ISMS Integration Foundation: Has the organization successfully achieved and formally maintained ISO/IEC 27001 certification, serving as the required foundational architecture before pursuing the 27701 Privacy extension?",
            type: "boolean",
            relatedArticles: ["iso27701-5"]
        },
        {
            id: "q_iso27701_role",
            text: "Organizational Data Designation: Has legal counsel formally mapped the organization's data flows to accurately designate structural legal identity as either a 'PII Controller', a 'PII Processor', or contextually both?",
            type: "select",
            options: ["PII Controller", "PII Processor", "Both (Context-Dependent)"],
            relatedArticles: ["iso27701-7", "iso27701-8"]
        },
        {
            id: "q_iso27701_pia",
            text: "Privacy Impact Assessments (PIAs): Does the engineering deployment pipeline mandate the formal execution of Privacy Impact Assessments (PIAs) prior to releasing new features or architectures that fundamentally change PII handling logic?",
            type: "boolean",
            relatedArticles: ["iso27701-7"]
        },
        {
            id: "q_iso27701_access",
            text: "Identity & Access Management: Are the internal systems harboring PII barricaded behind zero-trust Access Control models, granting personnel explicit 'least privilege' access strictly correlated to their immediate operational duties?",
            type: "boolean",
            relatedArticles: ["iso27701-6"]
        },
        {
            id: "q_iso27701_processor",
            text: "Strict Processor Boundaries (If Applicable): If operating as a PII Processor, are technical safeguards in place that definitively prevent inherited client PII from being utilized in secondary marketing campaigns or unauthorized algorithmic AI training?",
            type: "boolean",
            relatedArticles: ["iso27701-8"]
        }
    ]
};
