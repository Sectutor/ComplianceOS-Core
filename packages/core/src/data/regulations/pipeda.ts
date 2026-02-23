import { Regulation } from "./types";

export const pipeda: Regulation = {
    id: "pipeda",
    name: "PIPEDA (Personal Information Protection and Electronic Documents Act)",
    description: "The Personal Information Protection and Electronic Documents Act (PIPEDA) operates as Canada's rigorous federal privacy framework targeting private-sector organizations. Rooted mechanically in ten fair information principles, PIPEDA restricts how corporations dynamically collect, exploit, or distribute the personal digital profiles of Canadian citizens during commercial activity. It legally intertwines robust data subject rights with the mandatory deployment of highly calibrated cybersecurity safeguards proportional to the data's inherent sensitivity.",
    type: "Privacy",
    logo: "/frameworks/pipeda.svg",
    articles: [
        {
            id: "pipeda-principle-1",
            numericId: "Principle 1 & 2",
            title: "Accountability and Purpose Identification",
            description: "PIPEDA forces organizational transparency and top-down responsibility. Organizations must publicly assign specific executive-level personnel (a Privacy Officer) legally accountable for the architectural integrity of the privacy program. Before a single byte of personal data is harvested, the organization must explicitly isolate, legally justify, and publicly identify the precise commercial purpose driving the collection.",
            mappedControls: {
                "NIST 800-53": ["PM-1", "PT-2"],
                "ISO 27001": ["A.6.1.1", "A.18.1.4"]
            }
        },
        {
            id: "pipeda-principle-3",
            numericId: "Principle 3 & 4",
            title: "Consent Logic and Data Minimization",
            description: "Unilateral data extraction is prohibited. The informed, verifiable consent of the digital subject is a legally required prerequisite to collection, use, or downstream disclosure of their data. Furthermore, engineering teams must be constrained by the Principle of Limiting Collection: systems must be mathematically throttled to ingest only the absolute minimum telemetry mathematically necessary to fulfill the pre-identified corporate purpose.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "AC-3"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "pipeda-col-limit", title: "Limiting Collection", description: "Information must not be collected indiscriminately. Both the amount and the precise technical type of information gathered must be rigidly filtered to strictly satisfy the purposes previously identified and consented to by the individual.", mappedControls: { "NIST 800-53": ["PT-2"] } }
            ]
        },
        {
            id: "pipeda-principle-7",
            numericId: "Principle 7",
            title: "Cryptographic & Administrative Safeguards",
            description: "A pivotal engineering mandate. PIPEDA requires architectural defense-in-depth targeting personal data. The deployed security parameters—encompassing physical facility locks, logically segmented network perimeters, and aggressive database encryption—must be quantitatively graded and structurally proportional to the financial, reputational, and psychological sensitivity of the data being protected.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-28", "AC-3", "PE-3"],
                "ISO 27001": ["A.12.6.1", "A.9.2.1", "A.11.1.1"]
            }
        },
        {
            id: "pipeda-principle-9",
            numericId: "Principle 9",
            title: "Individual Access and Data Sovereignty",
            description: "Consumers harbor the affirmative right to interrogate organizations. Upon verified request, data subjects must be rapidly supplied with a clear accounting of the existence, subsequent internal use, and specific external disclosures of their digital footprint. Subjects hold the legal authority to dispute computational inaccuracies and mandate prompt database corrections.",
            mappedControls: {
                "NIST 800-53": ["PT-5", "SI-4"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_pipeda_canada",
            text: "Jurisdictional Trigger: Does the organization actively facilitate data collection or execute telemetry processing of personal information directly connected to the execution of commercial activities involving Canadian citizens or operations?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-1"]
        },
        {
            id: "q_pipeda_officer",
            text: "Executive Accountability: Has the organization formally appointed a designated, publicly identifiable Privacy Officer armed with the executive authority to mandate architectural shifts to ensure PIPEDA compliance?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-1"]
        },
        {
            id: "q_pipeda_purpose",
            text: "Strict Purpose Limitation: Are engineering and marketing data pipelines structurally prevented from utilizing inherited personal data sets for secondary, undeclared monetization efforts without returning to secure a fresh affirmative consent token?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-3"]
        },
        {
            id: "q_pipeda_safeguards",
            text: "Proportional Security Defenses: Has the CISO deployed an active, layered security perimeter (including zero-trust RBAC and encryption-at-rest) that is mathematically proportional to the inherent sensitivity of the Canadian data profiles warehoused?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-7"]
        },
        {
            id: "q_pipeda_breach",
            text: "Incident Response Pipeline: Does the organization possess a battle-tested incident response playbook legally prepared to rapidly isolate breaches, assess 'real risk of significant harm', and notify the Privacy Commissioner of Canada within the tight statutory window?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-7"]
        }
    ]
};
