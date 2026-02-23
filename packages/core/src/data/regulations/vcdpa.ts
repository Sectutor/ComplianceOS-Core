
import { Regulation } from "./types";

export const vcdpa: Regulation = {
    id: "vcdpa",
    name: "VCDPA (Virginia Consumer Data Protection Act)",
    description: "The Virginia Consumer Data Protection Act (VCDPA) establishes a comprehensive framework for controlling and processing the personal data of Virginia residents. It imposes rigorous obligations on operational controllers and processors to uphold robust data minimization, security, and transparency principles, while granting consumers sweeping affirmative rights to govern how their digital identities are monetized, shared, and protected.",
    type: "Privacy",
    logo: "/frameworks/virginia.svg",
    articles: [
        {
            id: "vcdpa-59.1-577",
            numericId: "§ 59.1-577",
            title: "Consumer Personal Data Rights & Operational Mechanics",
            description: "Section 59.1-577 defines the fundamental privacy rights granted to Virginia consumers, mandating that controllers engineer their consumer-facing interfaces and backend data systems to seamlessly, securely, and transparently authenticate and fulfill individual data requests without unreasonable administrative friction.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "IA-8", "PT-5"],
                "ISO 27001": ["A.9.1.1"]
            },
            subArticles: [
                { id: "vcdpa-59.1-577-right-access", title: "Confirmation and Access", description: "Consumers possess the unequivocal right to query a controller to defensively confirm whether their personal data is actively being processed, and to demand a clear, human-readable copy of all such data that the controller currently holds." },
                { id: "vcdpa-59.1-577-right-delete", title: "Right to Correction and Deletion", description: "Controllers are obligated to provide mechanisms for consumers to correct objective inaccuracies within their personal profiles. More critically, subjects hold the sovereign right to force the total deletion of their personal data—whether initially provided directly by the consumer or aggregately obtained from third-party data brokers.", mappedControls: { "NIST 800-53": ["MP-6"], "ISO 27001": ["A.8.2.1"] } },
                { id: "vcdpa-59.1-577-right-portability", title: "Right to Data Portability", description: "To prevent antitrust lock-in and foster user sovereignty, controllers must provide the requested personal data in a structured, commonly used, and machine-readable digital format that technologically permits the consumer to transmit the payload to an alternative service provider without arbitrary hindrance.", mappedControls: { "NIST 800-53": ["SC-1"] } },
                { id: "vcdpa-59.1-577-right-optout", title: "Right to Opt-Out of Profiling and Sales", description: "Perhaps the most commercially significant right: Consumers can explicitly opt-out of having their data processed for the specific purposes of targeted digital advertising, the financial sale of personal data to third parties, or algorithmic profiling in furtherance of automated decisions that produce legally significant or functionally equivalent economic effects.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "vcdpa-59.1-578",
            numericId: "§ 59.1-578",
            title: "Data Controller Responsibilities & Information Security",
            description: "Section 59.1-578 categorically establishes the operational duties a business must assume. It formally codifies the concepts of data minimization, mandatory purpose limitation, strict consent requirements for sensitive data, and the legal burden of implementing defensive technical cybersecurity controls.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-7", "SI-4", "AC-2", "IA-8"],
                "ISO 27001": ["A.12.6.1", "A.9.2.1", "A.18.1.4"]
            },
            subArticles: [
                { id: "vcdpa-59.1-578-security", title: "Data Security Requirements", description: "The core technical mandate: Controllers must establish, deploy, and demonstrably maintain commercially reasonable administrative, technical, and physical security practices uniquely scaled to the volume and nature of the personal data processed. This inherently requires continuous network monitoring, rigorous access management, and modern encryption standards to protect confidentiality and integrity.", mappedControls: { "NIST 800-53": ["SC-1", "SC-7", "SI-4"], "ISO 27001": ["A.12.6.1"] } },
                { id: "vcdpa-59.1-578-transparency", title: "Privacy Notice Transparency", description: "Controllers are statutorily required to publish a reasonably accessible, linguistically clear, and meaningful external privacy notice. This document must surgically outline what categories of data are harvested, the exact commercial purposes for processing, how data subjects can practically exercise their VCDPA rights, and an exhaustive list of the specific categories of third parties with whom data payloads are shared.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "vcdpa-59.1-578-sensitive", title: "Processing of Sensitive Data", description: "Under VCDPA, a controller cannot legally process 'sensitive data' (including racial/ethnic origin, religious beliefs, mental/physical health diagnosis, sexual orientation, precise geolocation, or granular biometric identification) without obtaining explicit, affirmative, and prior consent from the consumer.", mappedControls: { "NIST 800-53": ["AC-3"] } }
            ]
        },
        {
            id: "vcdpa-59.1-579",
            numericId: "§ 59.1-579",
            title: "Processor Accountability and Third-Party Contracts",
            description: "Acknowledging that modern enterprises rely entirely on vendor supply chains, Section 59.1-579 dictates that external data processors (vendors, cloud providers, SaaS products) must fundamentally adhere to the primary controller's instructions. Crucially, the VCDPA mandates that the data relationship must be governed by a highly specific, legally binding written contract that enforces absolute confidentiality, dictates mandatory technical security benchmarks, and requires processors to contractually submit to exhaustive security audits.",
            mappedControls: {
                "NIST 800-53": ["SA-9"],
                "ISO 27001": ["A.15.1.1"]
            }
        },
        {
            id: "vcdpa-59.1-580",
            numericId: "§ 59.1-580",
            title: "Data Protection Assessments (DPA)",
            description: "To enforce preventative risk management at the boardroom level, controllers are legally required to orchestrate, document, and securely store comprehensive Data Protection Assessments for any processing activity that presents a demonstrably heightened risk of harm to Virginia consumers. By law, 'heightened risk' specifically includes the financial sale of personal data, continuous targeted digital advertising, sophisticated deterministic profiling, and any algorithmic processing involving sensitive class data. These assessments mathematically weigh the predicted benefits of the processing against the potential structural risks to the subjects.",
            mappedControls: {
                "NIST 800-53": ["RA-3", "PL-8"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_vcdpa_scope",
            text: "Jurisdictional Scope: Does the organization actively conduct business within the Commonwealth of Virginia or produce targeted commercial products/services, while concurrently exceeding the statutory threshold of controlling the data of 100,000+ consumers, or deriving 50%+ of gross revenue from the sale of data of 25,000+ consumers?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-576"]
        },
        {
            id: "q_vcdpa_optout",
            text: "Opt-Out Architecture: Has the digital engineering team deployed a conspicuous, frictionless, and technically reliable web-based mechanism permitting users to globally opt-out of behavioral profiling, targeted digital advertising networks, and third-party data monetization?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-577-right-optout"]
        },
        {
            id: "q_vcdpa_dpa",
            text: "Risk Management (DPA): Does the privacy compliance office routinely generate and formally document exhaustive Data Protection Assessments (DPAs) specifically isolating and analyzing the liability and socio-economic risks involved prior to launching high-risk processing initiatives or campaigns involving sensitive Virginia populations?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-580"]
        },
        {
            id: "q_vcdpa_security",
            text: "Technical Safeguards: Are comprehensive 'commercially reasonable' technical, administrative, and physical cybersecurity barricades (such as multi-factor authentication, database-level encryption-in-transit, and routine penetration testing) actively implemented and mathematically proportional to the volume and sensitivity of the data stored?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-578-security"]
        },
        {
            id: "q_vcdpa_processor",
            text: "Supply Chain Governance: Have corporate legal counsel and procurement definitively updated all existing vendor Master Service Agreements (MSAs) and Data Processing Addendums (DPAs) to mandate strict VCDPA compliance, forced breach notifications, and the continuous right to audit downstream data sub-processors?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-579"]
        }
    ]
};
