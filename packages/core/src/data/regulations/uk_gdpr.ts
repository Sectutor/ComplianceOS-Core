
import { Regulation } from "./types";

export const ukGdpr: Regulation = {
    id: "uk-gdpr",
    name: "UK GDPR",
    description: "Post-Brexit UK data protection law, legally distinct from EU GDPR.",
    type: "Privacy",
    logo: "/frameworks/uk.svg",
    articles: [
        {
            id: "uk-gdpr-art-44",
            numericId: "44",
            title: "General principle for transfers",
            description: "Any transfer of personal data to a third country or international organization shall take place only if the conditions in this Chapter are complied with."
        },
        {
            id: "uk-gdpr-idta",
            numericId: "IDTA",
            title: "International Data Transfer Agreement",
            description: "Requirement to use the UK IDTA or the Addendum to the EU SCCs for data transfers outside the UK."
        }
    ],
    questions: [
        {
            id: "q_uk_gdpr_rep",
            text: "Do you have a UK-based representative (if you are outside the UK but targeting UK consumers)?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-art-44"]
        },
        {
            id: "q_uk_gdpr_idta",
            text: "Have you implemented the UK IDTA or appropriate Addendum for cross-border data transfers?",
            type: "boolean",
            relatedArticles: ["uk-gdpr-idta"]
        }
    ]
};
