
import { Regulation } from "./types";

export const cpa: Regulation = {
    id: "cpa",
    name: "CPA (Colorado)",
    description: "Colorado Privacy Act.",
    type: "Privacy",
    logo: "/frameworks/colorado.svg",
    articles: [
        {
            id: "cpa-6-1-1306",
            numericId: "6-1-1306",
            title: "Consumer Personal Data Rights",
            description: "Consumers have the right to opt out of the processing of personal data for purposes of targeted advertising and the sale of personal data."
        },
        {
            id: "cpa-6-1-1308",
            numericId: "6-1-1308",
            title: "Duties of Controllers",
            description: "Controllers must provide a reasonably accessible, clear, and meaningful privacy notice."
        },
        {
            id: "cpa-dpia",
            numericId: "DPIA",
            title: "Data Protection Assessments",
            description: "Requirement to conduct data protection assessments for high-risk processing activities."
        }
    ],
    questions: [
        {
            id: "q_cpa_uoop",
            text: "Do you recognize Universal Opt-Out signals (like GPC) as a valid opt-out request?",
            type: "boolean",
            relatedArticles: ["cpa-6-1-1306"]
        }
    ]
};
