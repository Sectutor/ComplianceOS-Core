import { Regulation } from "./types";

export const iso29100: Regulation = {
    id: "iso-29100",
    name: "ISO/IEC 29100 (Privacy Framework Architecture)",
    description: "ISO/IEC 29100 provides a foundational, high-level vocabulary and architectural framework for privacy in Information and Communication Technology (ICT) systems. Designed explicitly for systems engineers, privacy architects, and corporate governance teams, it outlines eleven sweeping privacy principles. Unlike prescriptive laws, ISO 29100 acts as a global design pattern, guiding organizations on how to fundamentally embed privacy-by-design concepts into their underlying technical infrastructure.",
    type: "Privacy",
    logo: "/frameworks/iso.svg",
    articles: [
        {
            id: "iso29100-principle-1",
            numericId: "Principles 1 & 2",
            title: "Consent Logic and Purpose Legitimacy",
            description: "Engineers must architect front-end and back-end systems capable of capturing, recording, and cryptographically verifying the explicit consent of the PII principal. Concurrently, data ingestion pipelines must be strictly tied to a specified, fully documented, and legally legitimate processing purpose at the exact moment of collection.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "AC-3"],
                "ISO 27001": ["A.18.1.4"]
            }
        },
        {
            id: "iso29100-principle-3",
            numericId: "Principles 3 & 4",
            title: "Collection Limitation and Data Minimization",
            description: "A core tenet of privacy-by-design: software must actively resist data hoarding. Systems must be engineered to strictly limit data extraction and functionally minimize the internal processing of PII, ensuring that the stored data payload is the absolute minimum required to satisfy the immediate commercial function.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "SC-1"],
                "ISO 27001": ["A.14.2.5"]
            }
        },
        {
            id: "iso29100-principle-5",
            numericId: "Principles 5 & 6",
            title: "Retention Limits and Data Accuracy",
            description: "Data cannot be stored indefinitely. Database administrators must implement automated lifecycle policies (e.g., TTL protocols) to securely purge or permanently de-identify PII when its authorized purpose expires. Furthermore, systems must ensure the ongoing accuracy and integrity of the PII traversing the network.",
            mappedControls: {
                "NIST 800-53": ["SI-7", "MP-6"],
                "ISO 27001": ["A.8.2.3"]
            }
        },
        {
            id: "iso29100-principle-7",
            numericId: "Principles 7 & 8",
            title: "Transparency and Individual Participation",
            description: "Organizations must escape the 'black box' model. Infrastructure must proactively generate transparent operational notices for end-users, whilst simultaneously supporting rapid APIs granting users the ability to access, review, challenge, and export their PII upon fully verified digital request.",
            mappedControls: {
                "NIST 800-53": ["PT-5"],
                "ISO 27001": ["A.18.1.4"]
            }
        },
        {
            id: "iso29100-principle-9",
            numericId: "Principles 9, 10 & 11",
            title: "Accountability, Security, and Compliance",
            description: "Management must legally bind the organization to these principles. This involves deploying a rigorous Information Security architecture (incorporating advanced cryptography, RBAC, and SIEM monitoring) to aggressively defend the PII, coupled with internal audit programs (Principle 11) to continuously verify and document adherence to the broader ISO framework.",
            mappedControls: {
                "NIST 800-53": ["PM-1", "SC-1", "AU-3", "CA-2"],
                "ISO 27001": ["A.6.1.1", "A.12.6.1", "A.18.2.2"]
            }
        }
    ],
    questions: [
        {
            id: "q_iso29100_consent",
            text: "Consent Engineering: Do the overarching software architecture and underlying data schemas natively support the granular ingestion, tracking, and unilateral revocation of explicit user consent?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-1"]
        },
        {
            id: "q_iso29100_minimization",
            text: "Algorithmic Minimization: Are processing payloads explicitly engineered to ingest 'just enough' data to fulfill the declared business function, actively resisting the aggregation of unnecessary digital telemetry?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-3"]
        },
        {
            id: "q_iso29100_lifecycle",
            text: "Automated Lifecycle Purge: Has the engineering team deployed automated retention logic (such as dynamic time-to-live triggers) forcing the cryptographic destruction or de-identification of PII immediately upon purpose expiration?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-5"]
        },
        {
            id: "q_iso29100_security",
            text: "Sustained Information Security: Does the organization actively maintain defensive technological parameters—like Multi-Factor Authentication (MFA), network segmentation, and encryption-at-rest—expressly tuned to protect the confidentiality of the tracked PII?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-9"]
        },
        {
            id: "q_iso29100_audit",
            text: "Continuous Validation: Is there a formally funded internal or external audit apparatus dedicated exclusively to mathematically validating the organization's ongoing architectural adherence to these 11 Privacy Principles?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-9"]
        }
    ]
};
