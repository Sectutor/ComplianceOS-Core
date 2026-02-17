import { Regulation } from "./types";

export const glba: Regulation = {
    id: "glba",
    name: "GLBA",
    description: "Gramm-Leach-Bliley Act. Requires financial institutions to explain their information-sharing practices to their customers and to safeguard sensitive data.",
    type: "Privacy",
    logo: "/frameworks/glba.svg",
    articles: [
        {
            id: "glba-privacy-rule",
            numericId: "Privacy Rule",
            title: "Financial Privacy Rule",
            description: "Governs the collection and disclosure of customers' personal financial information.",
            subArticles: [
                { id: "glba-notice", title: "Privacy Notice", description: "Clear and conspicuous notice that accurately reflects privacy policies and practices." },
                { id: "glba-opt-out", title: "Opt-Out", description: "Right to opt out of having nonpublic personal information shared with nonaffiliated third parties." }
            ]
        },
        {
            id: "glba-safeguards-rule",
            numericId: "Safeguards Rule",
            title: "Safeguards Rule",
            description: "Requires financial institutions to develop a written information security plan that describes their program to protect customer information.",
            subArticles: [
                { id: "glba-risk-assessment", title: "Risk Assessment", description: "Identify reasonably foreseeable internal and external risks to the security, confidentiality, and integrity of customer information." },
                { id: "glba-controls", title: "Design and Implement Safeguards", description: "Design and implement information safeguards to control the risks identified through risk assessment." },
                { id: "glba-monitor", title: "Monitor and Test", description: "Regularly test or otherwise monitor the effectiveness of the safeguards' key controls, systems, and procedures." }
            ]
        },
        {
            id: "glba-pretexting",
            numericId: "Pretexting",
            title: "Pretexting Provisions",
            description: "Protects consumers from individuals and companies that obtain their personal financial information under false pretenses."
        }
    ],
    questions: [
        {
            id: "q_glba_financial",
            text: "Are you a financial institution or significantly engaged in financial activities?",
            type: "boolean",
            relatedArticles: ["glba-privacy-rule"]
        },
        {
            id: "q_glba_program",
            text: "Do you have a written Information Security Program (WISP)?",
            type: "boolean",
            relatedArticles: ["glba-safeguards-rule"]
        },
        {
            id: "q_glba_notice",
            text: "Do you provide annual privacy notices to customers?",
            type: "boolean",
            relatedArticles: ["glba-notice"]
        }
    ]
};
