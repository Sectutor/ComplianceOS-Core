
import { Regulation } from "./types";

export const vcdpa: Regulation = {
    id: "vcdpa",
    name: "VCDPA (Virginia)",
    description: "Virginia Consumer Data Protection Act.",
    type: "Privacy",
    logo: "/frameworks/virginia.svg",
    articles: [
        {
            id: "vcdpa-59.1-577",
            numericId: "59.1-577",
            title: "Consumer Personal Data Rights",
            description: "Right to confirm whether a controller is processing the consumer's personal data and to access such data."
        },
        {
            id: "vcdpa-59.1-577-right-delete",
            numericId: "59.1-577.2",
            title: "Right to Delete",
            description: "Right to delete personal data provided by or obtained about the consumer."
        },
        {
            id: "vcdpa-59.1-577-right-optout",
            numericId: "59.1-577.5",
            title: "Right to Opt-Out",
            description: "Right to opt out of the processing of personal data for purposes of targeted advertising, the sale of personal data, or profiling."
        }
    ],
    questions: [
        {
            id: "q_vcdpa_optout",
            text: "Do you provide a clear and conspicuous link for consumers to opt-out of targeted advertising or data sales?",
            type: "boolean",
            relatedArticles: ["vcdpa-59.1-577-right-optout"]
        }
    ]
};
