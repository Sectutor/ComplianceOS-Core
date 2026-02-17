
import { Regulation } from "./types";

export const ucpa: Regulation = {
    id: "ucpa",
    name: "UCPA (Utah)",
    description: "Utah Consumer Privacy Act.",
    type: "Privacy",
    logo: "/frameworks/utah.svg",
    articles: [
        {
            id: "ucpa-rights",
            numericId: "13-61-201",
            title: "Consumer Rights",
            description: "Ability for consumers to access, delete, and port data. Right to opt out of the sale of personal data or targeted advertising."
        },
        {
            id: "ucpa-notices",
            numericId: "13-61-302",
            title: "Privacy Notice",
            description: "Transparency requirements for controllers regarding processing practices."
        }
    ],
    questions: [
        {
            id: "q_ucpa_threshold",
            text: "Does your company meet the $25M revenue threshold for UCPA applicability?",
            type: "boolean",
            relatedArticles: ["ucpa-rights"]
        }
    ]
};
