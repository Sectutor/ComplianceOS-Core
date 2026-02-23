import { Regulation } from "./types";

export const coppa: Regulation = {
    id: "coppa",
    name: "COPPA (Children's Online Privacy Protection Act)",
    description: "The Children's Online Privacy Protection Act (COPPA), aggressively enforced by the FTC, represents the zenith of statutory online privacy protection within the United States. Designed to completely shield minors, COPPA governs the digital platforms, websites, and IoT devices that deliberately target children under 13, or operators that obtain 'actual knowledge' they are harvesting adolescent data. The law establishes an uncompromising regime characterized by 'Verifiable Parental Consent' (VPC), strict data collection embargoes, and heavy financial penalties for non-compliance.",
    type: "Privacy",
    logo: "/frameworks/coppa.svg",
    articles: [
        {
            id: "coppa-312-3",
            numericId: "§ 312.3",
            title: "Regulation of Unfair or Deceptive Digital Practices",
            description: "Section 312.3 forms the absolute core of the FTC's enforcement mandate. It acts as a blanket statutory prohibition: no commercial operator may legally extract, deploy, or distribute the personal digital identifiers of a child under 13 absent the prior, mathematically verifiable explicit consent of a parent or legal guardian.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "AC-3"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "312-3-a", title: "Mandatory Public Notification", description: "Operators must boldly deploy direct, inescapable public notices explicitly detailing the exact nature, scope, and ultimate commercial destination of the personal information harvested from underage users.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "312-3-b", title: "The Verifiable Parental Consent (VPC) Barrier", description: "The most critical engineering hurdle: prior to the execution of any silent data collection scripts (including cookies and device fingerprinting), operators must successfully orchestrate a technical transaction that definitively obtains 'Verifiable Parental Consent' via FTC-approved authentication mechanisms.", mappedControls: { "NIST 800-53": ["AC-3"] } },
                { id: "312-3-c", title: "Parental Oversight and Data Purge Rights", description: "Operators must architect secure, authenticated administrative interfaces granting parents the perpetual right to meticulously review the exact data profiles built on their children, simultaneously empowering them to unilaterally revoke consent and command an immediate database purge.", mappedControls: { "NIST 800-53": ["MP-6"] } }
            ]
        },
        {
            id: "coppa-312-4",
            numericId: "§ 312.4",
            title: "Notice Construction and Delivery Mechanisms",
            description: "Section 312.4 strictly dictates the anatomical structure and delivery choreography of COPPA-compliant privacy notices, ensuring that legal transparency is not buried beneath impenetrable corporate legalese.",
            mappedControls: {
                "NIST 800-53": ["PT-5"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "312-4-b", title: "Direct 'Just-In-Time' Parental Notice", description: "Beyond a static webpage, platforms must actively push direct, immediate notifications (often via verified email) explicitly informing the parent of the operator's intention to initiate data collection workflows against their child.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "312-4-d", title: "Absolute Clarity of Content", description: "The resulting Notice must be distinctly labeled, aggressively decoupled from generic Terms of Service documents, and written in highly legible, non-technical language that explicitly outlines the exact data elements extracted.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "coppa-312-5",
            numericId: "§ 312.5",
            title: "Verifiable Parental Consent (VPC) Frameworks",
            description: "The engineering reality of COPPA. Operators cannot rely on simple checkboxes. The FTC demands the integration of high-friction 'Verifiable Parental Consent' mechanisms specifically designed to reasonably ensure the human interacting with the consent portal is simultaneously an adult and the authorized legal guardian.",
            mappedControls: {
                "NIST 800-53": ["IA-2", "IA-8"],
                "ISO 27001": ["A.9.2.1"]
            },
            subArticles: [
                { id: "312-5-b", title: "Approved Authentication Methodologies", description: "Engineering teams must deploy FTC-sanctioned validation flows, which historically include cryptographic credit card transactions, knowledge-based authentication (KBA), facial recognition against government ID, or toll-free verification hotlines staffed by trained operatives.", mappedControls: { "NIST 800-53": ["IA-2"] } }
            ]
        },
        {
            id: "coppa-312-8",
            numericId: "§ 312.8",
            title: "Fiduciary Confidentiality, Security, and Integrity",
            description: "Operators storing children's data assume extreme liability. Under section 312.8, they must establish, persistently upgrade, and mathematically validate robust, militarized cybersecurity procedures to guarantee the absolute confidentiality, security pipeline, and unalterable integrity of the accumulated adolescent data.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-7", "SI-4", "AC-2", "IA-8"],
                "ISO 27001": ["A.12.6.1", "A.9.2.1"]
            }
        }
    ],
    questions: [
        {
            id: "q_coppa_audience",
            text: "Jurisdictional Trigger: Is the digital application, game, or online service subjectively designed to actively target an audience under the age of 13, or has the engineering team established 'actual knowledge' that underage users are actively utilizing the platform?",
            type: "boolean",
            relatedArticles: ["coppa-312-3"]
        },
        {
            id: "q_coppa_consent",
            text: "VPC Engineering: Has the product team successfully integrated a high-friction, FTC-approved 'Verifiable Parental Consent' (VPC) authentication array (e.g., credit card verification, KBA) that physically blocks data ingestion pipelines until adult authorization is mathematically confirmed?",
            type: "boolean",
            relatedArticles: ["coppa-312-5"]
        },
        {
            id: "q_coppa_review",
            text: "Parental Command Architecture: Does the platform feature a secure, authenticated dashboard explicitly granting verified parents the operational autonomy to review their child's granular data sets and unilaterally trigger irreversible database purges?",
            type: "boolean",
            relatedArticles: ["coppa-312-3"]
        },
        {
            id: "q_coppa_security",
            text: "Ring-Fenced Cybersecurity: Recognizing the catastrophic liability of breached adolescent data, has the CISO engineered specific, highly defensive security classifications (e.g., aggressive encryption-at-rest, strict RBAC) uniquely protecting the tables storing children's data?",
            type: "boolean",
            relatedArticles: ["coppa-312-8"]
        }
    ]
};
