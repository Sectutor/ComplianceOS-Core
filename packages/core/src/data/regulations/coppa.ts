import { Regulation } from "./types";

export const coppa: Regulation = {
    id: "coppa",
    name: "COPPA",
    description: "Children's Online Privacy Protection Act (16 CFR Part 312). Regulates the online collection of personal information from children under 13.",
    type: "Privacy",
    logo: "/frameworks/coppa.svg",
    articles: [
        {
            id: "coppa-312-3",
            numericId: "312.3",
            title: "Regulation of unfair or deceptive acts or practices",
            description: "General prohibition against collecting personal information from children without parental consent.",
            subArticles: [
                { id: "312-3-a", title: "Notice", description: "Provide notice on the website or online service of what information is collected from children." },
                { id: "312-3-b", title: "Parental Consent", description: "Obtain verifiable parental consent prior to any collection, use, and/or disclosure of personal information from children." },
                { id: "312-3-c", title: "Review", description: "Provide a reasonable means for a parent to review the personal information collected from their child and to refuse to permit its further use or maintenance." }
            ]
        },
        {
            id: "coppa-312-4",
            numericId: "312.4",
            title: "Notice",
            description: "Requirements for the content and placement of the privacy notice.",
            subArticles: [
                { id: "312-4-b", title: "Direct Notice to Parents", description: "Direct notice to parents is required in certain circumstances." },
                { id: "312-4-d", title: "Content of Notice", description: "The notice must be clearly labeled and easy to read." }
            ]
        },
        {
            id: "coppa-312-5",
            numericId: "312.5",
            title: "Parental Consent",
            description: "Mechanisms for obtaining verifiable parental consent.",
            subArticles: [
                { id: "312-5-b", title: "Methods", description: "Reasonable efforts to ensure that the person providing consent is the child's parent." }
            ]
        },
        {
            id: "coppa-312-8",
            numericId: "312.8",
            title: "Confidentiality, security, and integrity of personal information",
            description: "Operators must establish and maintain reasonable procedures to protect the confidentiality, security, and integrity of personal information collected from children."
        }
    ],
    questions: [
        {
            id: "q_coppa_audience",
            text: "Is your website or service directed to children under 13, or do you have actual knowledge that you are collecting data from them?",
            type: "boolean",
            relatedArticles: ["coppa-312-3"]
        },
        {
            id: "q_coppa_consent",
            text: "Do you have a mechanism to obtain verifiable parental consent before collection?",
            type: "boolean",
            relatedArticles: ["coppa-312-5"]
        },
        {
            id: "q_coppa_security",
            text: "Do you have security measures in place specifically for children's data?",
            type: "boolean",
            relatedArticles: ["coppa-312-8"]
        }
    ]
};
