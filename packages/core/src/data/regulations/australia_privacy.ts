
import { Regulation } from "./types";

export const australiaPrivacy: Regulation = {
    id: "australia-privacy",
    name: "Privacy Act 1988 (Australia)",
    description: "The primary Australian law protecting the privacy of individuals.",
    type: "Privacy",
    logo: "/frameworks/australia.svg",
    articles: [
        {
            id: "app-1",
            numericId: "APP 1",
            title: "Open and transparent management",
            description: "Manage personal information in an open and transparent way."
        },
        {
            id: "app-8",
            numericId: "APP 8",
            title: "Cross-border disclosure",
            description: "Take reasonable steps to ensure that the overseas recipient does not breach the Australian Privacy Principles."
        }
    ],
    questions: [
        {
            id: "q_australia_app",
            text: "Does your privacy policy comply with the 13 Australian Privacy Principles (APPs)?",
            type: "boolean",
            relatedArticles: ["app-1"]
        }
    ]
};
