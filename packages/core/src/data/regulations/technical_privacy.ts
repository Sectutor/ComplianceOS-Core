import { Regulation } from "./types";

export const technicalPrivacy: Regulation = {
    id: "tech-privacy",
    name: "Architectural Privacy Standards (GPC & IAB TCF)",
    description: "Legal compliance is increasingly dictated by technical signals rather than written policies. This module covers critical, emerging technical standards like the Global Privacy Control (GPC) and the IAB Transparency & Consent Framework (TCF). These are standardized HTTP payload mechanisms and APIs designed to broadcast and enforce consumer consent autonomously across the entire digital advertising and tracking ecosystem. Their implementation is closely monitored by regulatory bodies (e.g., California AG).",
    type: "Privacy",
    logo: "/frameworks/technology.svg",
    articles: [
        {
            id: "gpc",
            numericId: "GPC (Global Privacy Control)",
            title: "Automated HTTP Consent Signaling",
            description: "The Global Privacy Control (GPC) is a technical specification transmitted via HTTP headers or the DOM (`navigator.globalPrivacyControl`). It allows users to globally broadcast a binding signal demanding that their data not be sold or shared. Under multiple state laws (like the CCPA and CPA), organizations must architect their web applications to passively listen for, parse, and immediately enforce this digital signal without requiring the user to click any manual opt-out links.",
            mappedControls: {
                "NIST 800-53": ["PT-5", "SI-7"],
                "ISO 27001": ["A.18.1.4"]
            }
        },
        {
            id: "iab-tcf",
            numericId: "IAB TCF v2.2",
            title: "Programmatic Advertising Consent Propagation",
            description: "The Interactive Advertising Bureau's Transparency and Consent Framework (IAB TCF) is the definitive industry API for managing and propagating consent strings throughout the programmatic advertising supply chain (Real-Time Bidding). Implementing TCF v2.2 correctly ensures that when a user interacts with a Consent Management Platform (CMP) on the frontend, that explicit consent decision is cryptographically forwarded to all downstream AdTech vendors.",
            mappedControls: {
                "NIST 800-53": ["AC-3"],
                "ISO 27001": ["A.18.1.4"]
            }
        }
    ],
    questions: [
        {
            id: "q_tech_gpc_listener",
            text: "GPC Signal Parsing: Are the primary web properties and Tag Management Systems (TMS) explicitly engineered to capture and respect the 'Sec-GPC' HTTP header or DOM-level variable as a legally binding 'Do Not Sell/Share' mandate?",
            type: "boolean",
            relatedArticles: ["gpc"]
        },
        {
            id: "q_tech_gpc_enforcement",
            text: "GPC Pipeline Enforcement: Upon detecting a positive GPC signal, does the application logic autonomously halt the firing of all non-essential third-party tracking pixels and analytics tags without requiring secondary user interaction?",
            type: "boolean",
            relatedArticles: ["gpc"]
        },
        {
            id: "q_tech_iab",
            text: "IAB-Certified Consent Infrastructure: Does the organization utilize an IAB-certified Consent Management Platform (CMP) capable of generating and broadcasting valid TC Strings to downstream vendors prior to loading programmatic ad units?",
            type: "boolean",
            relatedArticles: ["iab-tcf"]
        },
        {
            id: "q_tech_tcf_audit",
            text: "TCF Versioning Compliance: Have engineering teams confirmed the ongoing deployment of IAB TCF v2.2 (or the most current standard), ensuring the correct manifestation of 'Legitimate Interest' deprecations and updated vendor lists?",
            type: "boolean",
            relatedArticles: ["iab-tcf"]
        }
    ]
};
