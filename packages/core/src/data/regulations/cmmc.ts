import { Regulation } from "./types";

export const cmmc: Regulation = {
    id: "cmmc",
    name: "CMMC 2.0",
    description: "Cybersecurity Maturity Model Certification - Unified standard for implementing cybersecurity across the Defense Industrial Base (DIB).",
    type: "Security",
    logo: "/cmmc-logo.png",
    articles: [
        {
            id: "ac",
            numericId: "1",
            title: "Access Control (AC)",
            description: "Establishing who can access what information and systems, and ensuring they only have the access they need.",
            subArticles: [
                { id: "ac.l1-3.1.1", title: "Limit information system access", description: "Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems)." },
                { id: "ac.l1-3.1.2", title: "Limit system access to types of transactions", description: "Limit information system access to the types of transactions and functions that authorized users are permitted to execute." }
            ]
        },
        {
            id: "ia",
            numericId: "2",
            title: "Identification and Authentication (IA)",
            description: "Ensuring that the people and devices accessing systems are who they say they are.",
            subArticles: [
                { id: "ia.l1-3.5.1", title: "Identify information system users", description: "Identify information system users, processes acting on behalf of users, or devices." },
                { id: "ia.l1-3.5.2", title: "Authenticate identities", description: "Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems." }
            ]
        },
        {
            id: "sc",
            numericId: "3",
            title: "System and Communications Protection (SC)",
            description: "Protecting information as it is transmitted and stored.",
            subArticles: [
                { id: "sc.l1-3.13.1", title: "Monitor and protect communications", description: "Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems." },
                { id: "sc.l1-3.13.2", title: "Implement subnetworks", description: "Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks." }
            ]
        },
        {
            id: "si",
            numericId: "4",
            title: "System and Information Integrity (SI)",
            description: "Ensuring that systems and information are not changed without authorization and that problems are detected and fixed.",
            subArticles: [
                { id: "si.l1-3.14.1", title: "Identify and correct system flaws", description: "Identify, report, and correct information and information system flaws in a timely manner." },
                { id: "si.l1-3.14.2", title: "Provide protection from malicious code", description: "Provide protection from malicious code at appropriate locations within organizational information systems." }
            ]
        }
    ],
    questions: [
        {
            id: "q1",
            text: "Do you have a formal process to limit system access to authorized users?",
            type: "boolean",
            relatedArticles: ["ac"],
            failureGuidance: "Implement an Access Control policy and procedure to ensure only authorized personnel can access sensitive systems."
        },
        {
            id: "q2",
            text: "Are all users required to authenticate their identities before accessing the network?",
            type: "boolean",
            relatedArticles: ["ia"],
            failureGuidance: "Enforce multi-factor authentication (MFA) for all users to verify identities securely."
        }
    ]
};
