import { Regulation } from "./types";

export const euAiAct: Regulation = {
    id: "eu-ai-act",
    name: "EU AI Act",
    type: "Security",
    logo: "/frameworks/eu_flag.svg",
    description: "The world's first comprehensive AI law, classifying systems by risk (Unacceptable, High, Limited, Minimal) and establishing strict obligations for high-risk systems and GPAI models.",
    articles: [
        {
            id: "ai-act-art-5",
            numericId: "5",
            title: "Prohibited Practices",
            description: "Bans AI systems with unacceptable risks, such as social scoring, significant manipulation, and real-time remote biometric identification in public (with exceptions).",
            subArticles: [
                { id: "ai-act-art-5-1", title: "Social Scoring", description: "Ban on evaluating natural persons based on social behavior." },
                { id: "ai-act-art-5-2", title: "Biometric Identification", description: "Ban on real-time remote biometric ID in public spaces for law enforcement." }
            ]
        },
        {
            id: "ai-act-art-9",
            numericId: "9",
            title: "Risk Management System",
            description: "A continuous iterative process throughout the lifecycle to identify, estimate, evaluate, and mitigate risks, including risks to fundamental rights and vulnerable groups.",
            mappedControls: ["NIST CSF ID.RA-01", "ISO 27001 A.8.2.1"]
        },
        {
            id: "ai-act-art-10",
            numericId: "10",
            title: "Data Governance",
            description: "Training, validation, and testing datasets must be representative, error-free, and complete. Includes distinct requirements for bias monitoring and mitigation.",
            mappedControls: ["NIST CSF PR.DS-01"]
        },
        {
            id: "ai-act-art-11-13",
            numericId: "11/13",
            title: "Transparency and Documentation",
            description: "Requirement for detailed technical documentation (Annex IV) and logging features to ensure traceability. systems must be transparent to deployers.",
            mappedControls: ["ISO 27001 A.12.6.1", "NIST CSF DE.CM-01"]
        },
        {
            id: "ai-act-art-14",
            numericId: "14",
            title: "Human Oversight",
            description: "Systems must be designed with interfaces for effective human oversight, allowing interveners to stop the system or disregard outputs ('human-in-the-loop').",
            mappedControls: ["NIST CSF PR.AA-01"]
        },
        {
            id: "ai-act-art-15",
            numericId: "15",
            title: "Robustness & Cybersecurity",
            description: "High-risk systems must achieve appropriate levels of accuracy, robustness, and cybersecurity. Includes resilience against adversarial attacks and data poisoning.",
            mappedControls: ["NIST CSF PR.IP-01", "ISO 27001 A.14.2.1"]
        },
        {
            id: "ai-act-art-61",
            numericId: "61",
            title: "Post-Market Monitoring",
            description: "Providers must establish a system to monitor performance in the real world and report serious incidents to national authorities within 15 days.",
            mappedControls: ["NIST CSF DE.CM-01"]
        },
        {
            id: "ai-act-art-43",
            numericId: "43",
            title: "Conformity Assessment",
            description: "Before placing on the market, systems must undergo conformity assessment (internal control or third-party) to demonstrate compliance. Includes CE marking.",
            mappedControls: []
        },
        {
            id: "ai-act-art-53",
            numericId: "53/54",
            title: "Real-World Testing",
            description: "Testing of high-risk AI systems in real-world conditions is permitted in regulatory sandboxes under strict conditions and with informed consent.",
            mappedControls: []
        },
        {
            id: "ai-act-art-52",
            numericId: "52",
            title: "Limited-Risk (Transparency)",
            description: "Transparency obligations for certain systems (e.g., chatbots, deep fakes). Users must be informed they are interacting with AI; content must be marked.",
            mappedControls: []
        },
        {
            id: "ai-act-art-50",
            numericId: "50",
            title: "GPAI Models",
            description: "Obligations for General Purpose AI models: technical documentation, copyright compliance, and summary of training content. Systemic risk models have extra rules.",
            mappedControls: []
        }
    ],
    questions: [
        {
            id: "ai-q1",
            text: "Does your organization develop or deploy any AI systems that fall under the 'Prohibited Practices' list (e.g., social scoring, emotion recognition in work/schools)?",
            type: "boolean",
            relatedArticles: ["ai-act-art-5"],
            failureGuidance: "Immediate Action Required: Cease development/deployment of prohibited systems. Consult legal counsel to review specific use-case exclusions."
        },
        {
            id: "ai-q2",
            text: "Have you implemented a risk management system that covers the entire lifecycle of your high-risk AI system?",
            type: "boolean",
            relatedArticles: ["ai-act-art-9"],
            failureGuidance: "Establish a continuous risk management process. Document known and foreseeable risks and your mitigation strategies."
        },
        {
            id: "ai-q3",
            text: "Are your training, validation, and testing datasets representative, error-free, and complete?",
            type: "boolean",
            relatedArticles: ["ai-act-art-10"],
            failureGuidance: "Audit your data sources for bias. Implement data governance protocols to ensure data quality and provenance."
        },
        {
            id: "ai-q4",
            text: "Do you maintain detailed technical documentation (as per Annex IV) to demonstrate conformity with the AI Act?",
            type: "boolean",
            relatedArticles: ["ai-act-art-11"],
            failureGuidance: "Compile technical files describing system architecture, logic, and validation results. Keep this updated continuously."
        },
        {
            id: "ai-q5",
            text: "Is the AI system designed to allow for effective human oversight (e.g., intervention capabilities, interpretability)?",
            type: "boolean",
            relatedArticles: ["ai-act-art-14"],
            failureGuidance: "Integrate 'human-in-the-loop' interfaces. Add functionality for operators to override or stop the system safely."
        },
        {
            id: "ai-q6",
            text: "Have you tested the system for robustness against adversarial attacks and cybersecurity vulnerabilities?",
            type: "boolean",
            relatedArticles: ["ai-act-art-15", "ai-act-art-51"],
            failureGuidance: "Perform adversarial testing (Red Teaming). Secure the model weights and training pipeline against poisoning attacks."
        },
        {
            id: "ai-q7",
            text: "If you provide a GPAI model, do you publish a detailed summary of the content used for training?",
            type: "boolean",
            relatedArticles: ["ai-act-art-50"],
            failureGuidance: "Prepare and publish a transparency report detailing training data sources while respecting copyright laws."
        },
        {
            id: "ai-q8",
            text: "Do you have a post-market monitoring plan to track performance and report serious incidents within 15 days?",
            type: "boolean",
            relatedArticles: ["ai-act-art-61"],
            failureGuidance: "Set up automated logging for performance metrics. Define an incident reporting workflow to notify national authorities."
        }
    ]
};
