
import { Regulation } from "./types";

export const cpa: Regulation = {
    id: "cpa",
    name: "CPA (Colorado Privacy Act)",
    description: "The Colorado Privacy Act (CPA) is a seminal state-level privacy framework designed to firmly empower Colorado consumers with sweeping affirmative rights over their rapidly expanding digital footprint. Concurrently, it places heavy, uncompromising affirmative duties on corporate data controllers regarding absolute transparency, strict purpose limitation, and the mandatory execution of highly granular Data Protection Assessments before deploying high-risk technical profiling paradigms.",
    type: "Privacy",
    logo: "/frameworks/colorado.svg",
    articles: [
        {
            id: "cpa-6-1-1306",
            numericId: "§ 6-1-1306",
            title: "Consumer Personal Data Rights & Architectural Implementation",
            description: "Section 6-1-1306 structurally dictates the core consumer rights under the CPA. The legislature heavily emphasizes that controllers must engineer robust, automated, and legally compliant mechanisms capable of fielding and resolving data subject rights requests (DSRRs) efficiently, transparently, and without establishing discriminatory burdens on the requesting consumer.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "IA-8", "PT-5"],
                "ISO 27001": ["A.9.1.1"]
            },
            subArticles: [
                { id: "cpa-6-1-1306-rights-access", title: "Rights to Access, Correction, and Deletion", description: "Consumers harbor the absolute statutory right to securely confirm whether their personal data is under processing, demand unrestricted access to that data profile, force the immediate eradication of objective inaccuracies, and to mandate the permanent deletion of personal data spanning across both the controller's primary databases and the fragmented systems of downstream third-party processors.", mappedControls: { "NIST 800-53": ["MP-6"] } },
                { id: "cpa-6-1-1306-portability", title: "Right to Data Portability", description: "Controllers are statutorily required to furnish a consumer's personal data payload in a highly structured, universally readable, and technologically portable format (like JSON or XML), explicitly enabling the subject to transmit the aggregate data sets to competing commercial entities without proprietary restriction.", mappedControls: { "NIST 800-53": ["SC-1"] } },
                { id: "cpa-6-1-1306-optout", title: "The Right to Opt-Out & Universal Signals", description: "A defining characteristic of the CPA is the mandatory right for consumers to opt-out of behavioral targeted advertising, direct data monetization (sales), and algorithm-driven profiling algorithms. Crucially, the CPA mandates that controllers must technically support and automatically honor Global Privacy Control (GPC) signals and other browser-level Universal Opt-Out Mechanisms (UOOMs), elevating consumer intent above individual consent pop-ups.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "cpa-6-1-1308",
            numericId: "§ 6-1-1308",
            title: "Fiduciary Duties of Data Controllers",
            description: "Under Section 6-1-1308, the CPA pivots from granting consumer rights to fiercely restricting corporate behavior. It legislatively mandates that data controllers adhere to specific uncompromising operational duties—such as data minimization, absolute purpose limitation, and the strict requirement for explicit user consent prior to collecting sensitive demographic information.",
            mappedControls: {
                "NIST 800-53": ["PT-5", "SC-1", "SC-7", "SI-4", "AC-2", "IA-8"],
                "ISO 27001": ["A.18.1.4", "A.12.6.1", "A.9.2.1"]
            },
            subArticles: [
                { id: "cpa-6-1-1308-transparency", title: "Duty of Transparency", description: "Controllers must furnish a deliberately clear, intuitively accessible, and constantly updated privacy notice. This document must not obscure details in legalese; it must explicitly map exact categories of personal data to their specific commercial purposes and list the classifications of third-party affiliates accessing the data streams.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "cpa-6-1-1308-minimization", title: "Duty of Data Minimization & Purpose Specification", description: "Engineering teams are legally throttled: data collection must strictly be 'adequate, relevant, and objectively limited' to what is reasonably necessary for the immediately specified commercial purpose. Furthermore, controllers cannot creatively process secondary data streams for unrelated purposes without seeking fresh, affirmative consumer consent.", mappedControls: { "NIST 800-53": ["PT-2"] } },
                { id: "cpa-6-1-1308-security", title: "Duty of Care (Cybersecurity Defense)", description: "The legislation sets a liability threshold requiring controllers to enact and perpetually maintain reasonable administrative, technical, and physical data security measures. These technical barricades must be functionally appropriate to combat the specific volume, context, and structural nature of the personal data actively being warehoused.", mappedControls: { "NIST 800-53": ["SC-1", "SI-4"] } },
                { id: "cpa-6-1-1308-sensitive", title: "Duty Regarding Sensitive Data", description: "Organizations are completely barred from secretly processing sensitive personal data (e.g., precise biometric markers, sexual orientation, religious affiliations, known medical diagnoses) without preemptively extracting clear, affirmative, and unambiguous consent directly from the consumer.", mappedControls: { "NIST 800-53": ["AC-3"] } }
            ]
        },
        {
            id: "cpa-6-1-1309",
            numericId: "§ 6-1-1309",
            title: "Data Protection Assessments (DPA)",
            description: "To combat reckless deployment of advanced technology, the legislature compels controllers to thoroughly conduct, structurally document, and indefinitely securely store deeply analytical Data Protection Assessments for any processing engine that presents a 'heightened risk of harm'. This explicitly targets the large-scale integration of data monetization strategies, behavioral profiling arrays involving predictive analytics, and the ingestion of sensitive data classifications. These DPAs must scientifically weigh corporate utility against societal and individual privacy degradation.",
            mappedControls: {
                "NIST 800-53": ["RA-3", "PL-8"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_cpa_scope",
            text: "Jurisdictional Threshold: Has corporate counsel definitively determined whether the organization surpasses the CPA's legal threshold—specifically commanding the personal data of over 100,000 Colorado consumers, or deriving existential revenue (or accepting discounts) from monetizing the data of at least 25,000 consumers?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1304"]
        },
        {
            id: "q_cpa_uoop",
            text: "Ad-Tech Engineering (UOOMs): Have frontend development teams successfully engineered web properties to automatically ingest, interpret, and legally honor browser-level Universal Opt-Out Mechanisms (like Global Privacy Control) as immediate, irrevocable user mandates blocking targeted advertising?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1306-optout"]
        },
        {
            id: "q_cpa_sensitive_consent",
            text: "Sensitive Data Governance: Do the application's user flows completely halt the ingestion of historically protected classifications (race, deeply held religious beliefs, health diagnostics, precise geographical tracking) until an explicit, non-coerced, affirmative consent transaction is mathematically logged?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1308-sensitive"]
        },
        {
            id: "q_cpa_dpia",
            text: "Data Protection Assessments: Is there formally mandated operational governance requiring Chief Privacy Officers to author exhaustive Data Protection Assessments detailing mitigation mathematics *before* the engineering department launches new high-risk, algorithmic profiling, or targeted advertising pipelines?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1309"]
        },
        {
            id: "q_cpa_notice",
            text: "Transparency Obligations: Is the organization's public-facing Privacy Policy actively maintained by legal teams to surgically detail the exact operational purpose of every data category ingested, rather than relying on legally dangerous, historically vague umbrella statements?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1308-transparency"]
        }
    ]
};
