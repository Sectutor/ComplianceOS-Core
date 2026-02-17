
import { Regulation } from "./types";

export const technicalPrivacy: Regulation = {
    id: "tech-privacy",
    name: "Technical & Emerging Standards",
    description: "Standard technical protocols for cross-site privacy signals and consent management.",
    type: "Privacy",
    logo: "/frameworks/technology.svg",
    articles: [
        {
            id: "gpc",
            numericId: "GPC",
            title: "Global Privacy Control",
            description: "Technical specification for a browser-level signal that communicates an opting out of the sale or sharing of personal information."
        },
        {
            id: "iab-tcf",
            numericId: "IAB TCF 2.2",
            title: "IAB Consent Framework",
            description: "Industry standard for managing transparency and consent signals in the digital advertising ecosystem."
        }
    ],
    questions: [
        {
            id: "q_tech_gpc",
            text: "Does your website listen and respond to the GPC signal? (Legally mandatory in CA/CO)",
            type: "boolean",
            relatedArticles: ["gpc"]
        },
        {
            id: "q_tech_iab",
            text: "Do you use an IAB-certified Consent Management Platform (CMP)?",
            type: "boolean",
            relatedArticles: ["iab-tcf"]
        }
    ]
};
