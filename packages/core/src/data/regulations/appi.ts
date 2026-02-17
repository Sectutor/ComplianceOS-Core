
import { Regulation } from "./types";

export const appi: Regulation = {
    id: "appi",
    name: "APPI (Japan)",
    description: "Act on the Protection of Personal Information.",
    type: "Privacy",
    logo: "/frameworks/japan.svg",
    articles: [
        {
            id: "appi-principle",
            numericId: "1",
            title: "Purpose of Use",
            description: "Specify the purpose of using personal information as much as possible."
        },
        {
            id: "appi-optout",
            numericId: "23",
            title: "Third-party Provision",
            description: "A business operator shall not provide personal data to a third party without obtaining the prior consent of the principal."
        }
    ],
    questions: [
        {
            id: "q_appi_adequacy",
            text: "Are you aware of the Mutual Adequacy decision between Japan and the EU/UK?",
            type: "boolean",
            relatedArticles: ["appi-optout"]
        }
    ]
};
