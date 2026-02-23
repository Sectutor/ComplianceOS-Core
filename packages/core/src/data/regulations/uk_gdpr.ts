import { Regulation } from "./types";

export const ukGdpr: Regulation = {
    id: "uk-gdpr",
    name: "UK GDPR (United Kingdom General Data Protection Regulation)",
    description: "The UK GDPR, functioning in tandem with the Data Protection Act 2018 (DPA 2018), is the foundational digital privacy framework within the United Kingdom post-Brexit. While structurally mirroring the EU GDPR, it is an independent domestic legal regime enforced by the Information Commissioner's Office (ICO). It places aggressive regulatory requirements on how domestic and international organizations collect, route, monetize, and secure the personal data of UK residents, demanding continuous architectural accountability and proactive privacy-by-design methodologies.",
    type: "Privacy",
    logo: "/frameworks/uk.svg",
    articles: [
        {
            id: "uk-gdpr-art-5",
            numericId: "Article 5",
            title: "Core Processing Principles",
            description: "Article 5 establishes the constitutional engineering principles for data handling. Systems must be architected to process data lawfully, transparently, and exclusively for explicitly declared purposes (Purpose Limitation). Furthermore, databases must actively restrict data ingestion to the absolute minimum necessary payload (Data Minimization) and employ automated lifecycle purges limits to prevent indefinite storage (Storage Limitation).",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "SI-7", "MP-6"],
                "ISO 27001": ["A.18.1.4", "A.8.2.3"]
            }
        },
        {
            id: "uk-gdpr-art-6",
            numericId: "Article 6 & 9",
            title: "Lawful Basis and Special Categories",
            description: "No personal data may enter the organizational perimeter without a mathematically provable lawful basis (e.g., explicit consent, contract fulfillment, or a documented legitimate interest assessment). Furthermore, processing 'Special Categories' (e.g., biometric markers, racial data, health records) requires an elevated legal justification and substantially heavier cryptographic defense.",
            mappedControls: {
                "NIST 800-53": ["AC-3"],
                "ISO 27001": ["A.18.1.4"]
            }
        },
        {
            id: "uk-gdpr-rights",
            numericId: "Articles 13-22",
            title: "Data Subject Rights (DSR) Infrastructure",
            description: "UK residents possess formidable affirmative rights over their data telemetry. Controllers must engineer responsive APIs and front-end portals to honor these requests within 30 days. This includes fulfilling comprehensive Subject Access Requests (SARs), executing permanent cryptographic erasure ('Right to be Forgotten'), and allowing users to digitally restrict automated algorithmic profiling.",
            mappedControls: {
                "NIST 800-53": ["PT-5", "IA-8", "MP-6"],
                "ISO 27001": ["A.9.1.1", "A.18.1.4"]
            },
            subArticles: [
                { id: "uk-gdpr-art-15", title: "Subject Access Requests (SARs)", description: "Organizations must possess internal query tooling capable of rapidly aggregating and exporting a human-readable bundle of every piece of data held on a specific subject, tracing across both primary SQL stores and unstructured backups.", mappedControls: { "NIST 800-53": ["AC-3"] } },
                { id: "uk-gdpr-art-17", title: "Cryptographic Erasure", description: "Deletion requests mandate the total destruction of the user's data payload. Mere logical obfuscation is insufficient if the data can be re-identified; algorithms must ensure irreversible purging from active databases and downstream processors.", mappedControls: { "NIST 800-53": ["MP-6"] } }
            ]
        },
        {
            id: "uk-gdpr-art-25",
            numericId: "Article 25",
            title: "Data Protection by Design and by Default",
            description: "Privacy cannot be a reactive patch. Article 25 dictates that 'Privacy by Design' must be embedded directly into the software development lifecycle (SDLC). By default, application configurations—such as social visibility settings or cookie tracking flags—must be set to their most hostile, privacy-protective state prior to any user interaction.",
            mappedControls: {
                "NIST 800-53": ["SA-8", "CM-2"],
                "ISO 27001": ["A.14.2.5"]
            }
        },
        {
            id: "uk-gdpr-vendor",
            numericId: "Article 28 & 30",
            title: "Vendor Management and Processing Records",
            description: "Controllers cannot outsource liability. When utilizing third-party vendors (Processors), controllers must enforce strict Data Processing Agreements (DPAs) stipulating rigorous security standards. Concurrently, organizations must maintain an exhaustive, internally auditable Record of Processing Activities (RoPA) detailing exactly where, why, and how data flows through the enterprise.",
            mappedControls: {
                "NIST 800-53": ["SA-9", "CM-8"],
                "ISO 27001": ["A.15.1.1", "A.18.1.1"]
            }
        },
        {
            id: "uk-gdpr-art-32",
            numericId: "Article 32 & 33",
            title: "Cybersecurity Constraints and Breach Notification",
            description: "Article 32 demands 'appropriate technical and organisational measures' to secure data, explicitly highlighting encryption-at-rest and pseudonymization as baseline standards. Should these defenses fail, Article 33 enforces a draconian 72-hour window to report materially significant data breaches to the ICO, accompanied by detailed technical forensics.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-28", "IR-6"],
                "ISO 27001": ["A.12.6.1", "A.16.1.1"]
            }
        },
        {
            id: "uk-gdpr-art-35",
            numericId: "Article 35",
            title: "Data Protection Impact Assessments (DPIA)",
            description: "Prior to launching high-risk processing initiatives—such as deploying advanced machine learning models against user data, or executing large-scale surveillance—organizations are legally required to execute and formally document a comprehensive Data Protection Impact Assessment (DPIA) to mathematically weigh corporate benefits against individual civil liberties.",
            mappedControls: {
                "NIST 800-53": ["RA-3", "PL-2"],
                "ISO 27001": ["A.12.6.1"]
            }
        },
        {
            id: "uk-gdpr-art-44",
            numericId: "Chapter V (Article 44+)",
            title: "International Data Flow Jurisprudence",
            description: "Routing personal data physically or virtually outside the borders of the UK requires robust legal architecture. Unless the destination country holds an formal 'Adequacy Regulation', transfers to foreign severs (like US cloud datacenters) strictly require executing the ICO's International Data Transfer Agreement (IDTA) or the UK Addendum to the EU SCCs.",
            mappedControls: {
                "NIST 800-53": ["AC-20", "CA-3"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_uk_gdpr_lawful",
            text: "Algorithmic Collection Legitimacy: Has corporate counsel definitively proven and documented a valid Article 6 'Lawful Basis' (e.g., explicit opt-in, strict contract necessity) for every active API endpoint ingesting UK consumer data?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-6"]
        },
        {
            id: "q_uk_gdpr_default",
            text: "Privacy by Default Engineering: Do all software applications, upon initial installation or account creation, default to the maximum restrictive privacy baseline, forcibly requiring affirmative user action to activate tracking telemetry?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-25"]
        },
        {
            id: "q_uk_gdpr_vendor",
            text: "Downstream Processor Auditing: Has the organization legally executed binding Data Processing Agreements (DPAs) dictating strict security standards and auditing rights for all third-party vendors and cloud infrastructure providers?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-vendor"]
        },
        {
            id: "q_uk_gdpr_breach",
            text: "72-Hour Breach Forensics: Does the Security Operations Center (SOC) possess an automated, legally vetted Incident Response protocol capable of conducting full technical forensics and notifying the ICO within the strict 72-hour regulatory window?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-32"]
        },
        {
            id: "q_uk_gdpr_idta",
            text: "Foreign Server Compliance: If data is routed to foreign servers lacking UK Adequacy, has legal proactively implemented the International Data Transfer Agreement (IDTA) or UK Addendum to legitimize the cross-border flow?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-44"]
        },
        {
            id: "q_uk_gdpr_dpia",
            text: "High-Risk Architecture Vetting: Does the release pipeline contain a hard block requiring the completion of a Data Protection Impact Assessment (DPIA) before deploying any new AI models or high-risk tracking architecture?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-35"]
        }
    ]
};
