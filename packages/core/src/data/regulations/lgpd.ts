import { Regulation } from "./types";

export const lgpd: Regulation = {
    id: "lgpd",
    name: "LGPD",
    description: "Lei Geral de Proteção de Dados (Brazil). Regulates the processing of personal data in Brazil.",
    type: "Privacy",
    logo: "/frameworks/lgpd.svg",
    articles: [
        {
            id: "lgpd-art-7",
            numericId: "Art. 7",
            title: "Legal Bases for Processing",
            description: "Processing of personal data shall only be carried out under the following hypotheses: I - with the consent of the data subject; II - for compliance with a legal or regulatory obligation...",
        },
        {
            id: "lgpd-art-18",
            numericId: "Art. 18",
            title: "Rights of the Data Subject",
            description: "The data subject has the right to obtain from the controller... confirmation of the existence of processing; access to the data; correction of incomplete, inaccurate or out-of-date data...",
        },
        {
            id: "lgpd-art-41",
            numericId: "Art. 41",
            title: "Data Protection Officer",
            description: "The controller shall appoint a data protection officer (DPO) to be in charge of processing personal data.",
        },
        {
            id: "lgpd-art-46",
            numericId: "Art. 46",
            title: "Security and Secrecy",
            description: "Agents shall adopt security, technical and administrative measures able to protect personal data from unauthorized access and accidental or unlawful situations.",
        },
        {
            id: "lgpd-art-48",
            numericId: "Art. 48",
            title: "Security Incident Notification",
            description: "The controller must communicate to the national authority and to the data subject the occurrence of a security incident that may create risk or relevant damage.",
        }
    ],
    questions: [
        {
            id: "q_lgpd_brazil",
            text: "Do you process data of individuals located in Brazil?",
            type: "boolean",
            relatedArticles: ["lgpd-art-7"]
        },
        {
            id: "q_lgpd_dpo",
            text: "Have you appointed a Data Protection Officer (Encarregado)?",
            type: "boolean",
            relatedArticles: ["lgpd-art-41"]
        },
        {
            id: "q_lgpd_rights",
            text: "Can you respond to data subject requests within 15 days?",
            type: "boolean",
            relatedArticles: ["lgpd-art-18"]
        }
    ]
};
