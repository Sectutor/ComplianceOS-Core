
import { Regulation } from "./types";

export const ctdpa: Regulation = {
    id: "ctdpa",
    name: "CTDPA (Connecticut)",
    description: "Connecticut Data Privacy Act.",
    type: "Privacy",
    logo: "/frameworks/connecticut.svg",
    articles: [
        {
            id: "ctdpa-rights",
            numericId: "4",
            title: "Consumer Rights",
            description: "Right to access, correct, delete, and port personal data. Right to opt out of targeted advertising, data sales, and profiling."
        },
        {
            id: "ctdpa-dpia",
            numericId: "8",
            title: "Data Protection Assessments",
            description: "Requirement to conduct assessments for processing activities that present a heightened risk of harm to consumers."
        }
    ],
    questions: [
        {
            id: "q_ctdpa_sensitive",
            text: "Do you obtain explicit consent before processing sensitive personal data?",
            type: "boolean",
            relatedArticles: ["ctdpa-rights"]
        }
    ]
};
