
import { Regulation } from "./types";

export const appi: Regulation = {
    id: "appi",
    name: "APPI (Act on the Protection of Personal Information)",
    description: "Japan's Act on the Protection of Personal Information (APPI) is a comprehensive, globally respected data protection framework governing all private enterprises actively processing personal and 'Special Care-Required' data. Following recent amendments, the APPI has expanded its extraterritorial scope, dramatically increasing maximum financial penalties, reinforcing individual data rights, and legally harmonizing its core statutes to facilitate smooth mutual adequacy data flows with the EU via the GDPR.",
    type: "Privacy",
    logo: "/frameworks/japan.svg",
    articles: [
        {
            id: "appi-art-17",
            numericId: "Article 17 & 18",
            title: "Purpose Specification and Proper Acquisition",
            description: "A business operator must algorithmically map and explicitly specify the purpose of utilizing personal data to the maximum possible extent. Crucially, the collection vectors—whether through front-end forms, tracking cookies, or third-party brokers—must be objectively 'proper', forbidding deceitful telemetry acquisition and absolutely prohibiting scope creep beyond the stated intent.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5"],
                "ISO 27001": ["A.18.1.4"]
            }
        },
        {
            id: "appi-art-23",
            numericId: "Article 23",
            title: "Security Control Actions and Employee Supervision",
            description: "Reflecting Japan's emphasis on organizational discipline, Article 23 technically dictates that operators must take mathematically sufficient 'Security Control Actions' to prevent data leakage, loss, or silent degradation. This legally mandates the rigorous active supervision, logging, and continuous privacy training of both internal engineering employees and downstream outsourced processors.",
            mappedControls: {
                "NIST 800-53": ["AT-2", "PE-2", "PS-4", "SA-9"],
                "ISO 27001": ["A.7.2.2", "A.15.1.1"]
            }
        },
        {
            id: "appi-art-27",
            numericId: "Article 27",
            title: "Restriction on Third-Party Data Exfiltration",
            description: "Operators are structurally forbidden from deploying code that routes 'Personal Data' to any third-party corporate entity without forcefully securing the prior, mathematically verifiable explicit consent of the data subject. The 'opt-out' exception to this rule is heavily regulated and requires explicit prior notification to the Personal Information Protection Commission (PPC).",
            mappedControls: {
                "NIST 800-53": ["AC-3", "AC-20"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "appi-art-28", title: "Cross-Border Foreign Cloud Transfers", description: "When routing personal data over international boundaries to a foreign third party, the operator must obtain distinct consent specifically authorizing the foreign transfer, while concurrently verifying the foreign territory possesses an 'equivalent' data protection regime to Japan.", mappedControls: { "NIST 800-53": ["CA-3"] } }
            ]
        },
        {
            id: "appi-art-33",
            numericId: "Article 33",
            title: "Consumer Rights to Disclosure and Deletion",
            description: "Consumers harbor the robust right to demand immediate disclosure regarding the existence of their data, the operational source of the collection, and records of third-party transmission. They can issue binding technical mandates requiring the operator to correct factual errors, restrict behavioral processing, or execute an irreversible deletion purge.",
            mappedControls: {
                "NIST 800-53": ["MP-6"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_appi_purpose",
            text: "Algorithmic Scope Hardening: Are the technical data ingestion pipelines rigidly constrained to extract only the specific telemetry vectors explicitly justified and disclosed to the subject at the point of origin?",
            type: "boolean",
            relatedArticles: ["appi-art-17"]
        },
        {
            id: "q_appi_security",
            text: "Employee Oversight & Security Actions: Has the organization deployed sufficient 'Security Control Actions'—including stringent endpoint monitoring, database access logs, and comprehensive phishing training—to proactively defend against malicious internal and external exploitation?",
            type: "boolean",
            relatedArticles: ["appi-art-23"]
        },
        {
            id: "q_appi_thirdparty",
            text: "Third-Party Consent Barricades: Do the application's digital workflows technically block the routing of personal information to third-party APIs or marketing brokers unless explicitly confirmed by a verified user consent token?",
            type: "boolean",
            relatedArticles: ["appi-art-27"]
        },
        {
            id: "q_appi_crossborder",
            text: "Foreign Server Sovereignty: When transmitting Japanese data to foreign cloud architecture or international vendors, are those transfers explicitly protected by verified consumer consent or legally governed by recognized international adequacy frameworks?",
            type: "boolean",
            relatedArticles: ["appi-art-28"]
        },
        {
            id: "q_appi_deletion",
            text: "Rights Execution APIs: Does the privacy operations team possess the necessary administrative tooling to rapidly pull disclosure reports and execute permanent cryptographic deletion requests honoring Japanese consumer rights?",
            type: "boolean",
            relatedArticles: ["appi-art-33"]
        }
    ]
};
