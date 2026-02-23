
import { Regulation } from "./types";

export const ctdpa: Regulation = {
    id: "ctdpa",
    name: "CTDPA (Connecticut Data Privacy Act)",
    description: "The Connecticut Data Privacy Act (CTDPA) establishes a rigorous regulatory framework governing how commercial entities process the personal data of Connecticut residents. Modeled on establishing firm consumer rights and restricting corporate overreach, the CTDPA mandates critical operational shifts relating to transparency, algorithmic consent regarding sensitive data, adolescent data protections, and the mandatory honorization of browser-level Global Privacy Controls (GPC).",
    type: "Privacy",
    logo: "/frameworks/connecticut.svg",
    articles: [
        {
            id: "ctdpa-sec-4",
            numericId: "Section 4",
            title: "Consumer Personal Data Rights & Architectural Fulfillment",
            description: "Section 4 dictates the irrefutable privacy rights granted to Connecticut consumers. Controllers are legally required to architect backend infrastructure capable of ingesting, authenticating, and fulfilling continuous data subject requests securely and without artificial friction natively within a rolling 45-day SLA.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "IA-8", "PT-5"],
                "ISO 27001": ["A.9.1.1"]
            },
            subArticles: [
                { id: "ctdpa-sec-4-rights", title: "Access, Correction, and Cryptographic Deletion", description: "Consumers harbor the affirmative right to discover exactly what data the organization holds, correct material inaccuracies, and orchestrate the permanent cryptographic deletion of their data across primary databases, cold backups, and third-party vendor systems.", "mappedControls": { "NIST 800-53": ["MP-6"] } },
                { id: "ctdpa-sec-4-portability", title: "Mandatory Data Portability", description: "Controllers must engineer export pipelines capable of rendering the consumer's personal data into an interoperable, technically usable format (e.g., JSON)—structurally allowing the subject to seamlessly migrate their digital identity to a competing commercial entity.", "mappedControls": { "NIST 800-53": ["SC-1"] } },
                { id: "ctdpa-sec-4-optout", title: "Opt-Out Sovereignty and Targeted Advertising", description: "Consumers possess the absolute right to unilaterally block their data from being processed for targeted digital advertising, third-party monetization (sales), or algorithmic profiling producing significant legal/economic effects. Crucially, the CTDPA demands that organizations recognize Global Privacy Control (GPC) network signals as legally binding opt-out mandates.", "mappedControls": { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "ctdpa-sec-6",
            numericId: "Section 6",
            title: "Data Controller Duties & Security Guardrails",
            description: "Connecticut strictly limits corporate autonomy, converting data controllers into fiduciaries of consumer information. Section 6 statutorily restricts data proliferation, demanding strict purpose limitation, engineered data minimization, and mathematically appropriate cybersecurity defenses.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-7", "SI-4", "PT-2"],
                "ISO 27001": ["A.12.6.1", "A.9.2.1", "A.18.1.4"]
            },
            subArticles: [
                { id: "ctdpa-sec-6-minimization", title: "Data Minimization Requirements", description: "Engineering and marketing departments must be rigorously restrained: data ingestion must be legally justifiable and structurally limited purely to the data necessary for fulfilling the immediately explicitly disclosed commercial purpose. Unauthorized secondary monetization is strictly barred.", mappedControls: { "NIST 800-53": ["PT-2"] } },
                { id: "ctdpa-sec-6-security", title: "Mandatory Cybersecurity Defenses", description: "The law requires controllers to define, implement, and aggressively maintain administrative, technical, and physical security practices—such as rigorous encryption regimens and continuous vulnerability scanning—specifically calibrated to protect the confidentiality and integrity of the specific data volume managed.", mappedControls: { "NIST 800-53": ["SC-1", "SI-4"], "ISO 27001": ["A.12.6.1"] } },
                { id: "ctdpa-sec-6-sensitive", title: "Governance of Sensitive and Adolescent Data", description: "The processing of precisely defined sensitive data (biometrics, exact geolocation, health phenotypes) is unequivocally prohibited without preemptive, transparent, affirmative consumer consent. Furthermore, the CTDPA severely restricts targeted algorithmic advertising directed at known minors (13-15 years old) without absolute explicit consent.", mappedControls: { "NIST 800-53": ["AC-3"] } }
            ]
        },
        {
            id: "ctdpa-sec-8",
            numericId: "Section 8",
            title: "Mandatory Data Protection Assessments (DPA)",
            description: "Prior to initiating any technological processing presenting a 'heightened risk of harm' to Connecticut civilians—explicitly including the deployment of targeted advertising networks, demographic profiling, or the aggregation of sensitive demographic data—organizations must execute, formally document, and secure exhaustive Data Protection Assessments. These DPAs must scientifically justify the processing risk against the consumer benefit, and can be forcefully subpoenaed by the Connecticut Attorney General during an investigation.",
            mappedControls: {
                "NIST 800-53": ["RA-3", "PL-8"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_ctdpa_scope",
            text: "Jurisdictional Threshold: Has legal counsel verified if the organization falls within the CTDPA footprint by controlling the personal data of 100,000+ Connecticut consumers (excluding payment transaction data), or deriving 25%+ of gross revenue from monetizing data relating to 25,000+ consumers?",
            type: "boolean",
            relatedArticles: ["ctdpa-sec-4"]
        },
        {
            id: "q_ctdpa_sensitive",
            text: "Sensitive & Adolescent Data Constraints: Has engineering implemented hard technical blockers ensuring no 'sensitive' data (e.g., biometrics, health, precise geolocation compass data) is ingested without explicit affirmative consent, and that targeted advertising is globally disabled for known minors (ages 13-15)?",
            type: "boolean",
            relatedArticles: ["ctdpa-sec-6-sensitive"]
        },
        {
            id: "q_ctdpa_uoop",
            text: "Universal Opt-Out Architecture: Does the web application routing and frontend tracking layer natively ingest, decode, and legally honor browser-level Global Privacy Control (GPC) proxy signals as definitive mandates to halt targeted advertising and data sales?",
            type: "boolean",
            relatedArticles: ["ctdpa-sec-4-optout"]
        },
        {
            id: "q_ctdpa_dpia",
            text: "Data Protection Assessments: Are executive-level Data Protection Assessments (DPAs) formally drafted, reviewed, and algorithmically stored by the privacy office before the deployment of any high-risk data processing operations or targeted profiling initiatives?",
            type: "boolean",
            relatedArticles: ["ctdpa-sec-8"]
        },
        {
            id: "q_ctdpa_security",
            text: "Proportional Security Defenses: Can the Chief Information Security Officer (CISO) technically demonstrate that the applied cyber defense architecture (encryption layers, access auditing, payload monitoring) is tangibly proportional to the financial value and sensitivity of the consumer data warehoused?",
            type: "boolean",
            relatedArticles: ["ctdpa-sec-6-security"]
        }
    ]
};
