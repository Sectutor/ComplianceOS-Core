import { Regulation } from "./types";

export const pipeda: Regulation = {
    id: "pipeda",
    name: "PIPEDA",
    description: "Personal Information Protection and Electronic Documents Act. Canadian federal privacy law for private-sector organizations.",
    type: "Privacy",
    logo: "/frameworks/pipeda.svg",
    articles: [
        {
            id: "pipeda-principle-1",
            numericId: "Principle 1",
            title: "Accountability",
            description: "An organization is responsible for personal information under its control and shall designate an individual or individuals who are accountable for the organization's compliance.",
        },
        {
            id: "pipeda-principle-2",
            numericId: "Principle 2",
            title: "Identifying Purposes",
            description: "The purposes for which personal information is collected shall be identified by the organization at or before the time the information is collected.",
        },
        {
            id: "pipeda-principle-3",
            numericId: "Principle 3",
            title: "Consent",
            description: "The knowledge and consent of the individual are required for the collection, use, or disclosure of personal information, except where appropriate.",
        },
        {
            id: "pipeda-principle-4",
            numericId: "Principle 4",
            title: "Limiting Collection",
            description: "The collection of personal information shall be limited to that which is necessary for the purposes identified by the organization.",
        },
        {
            id: "pipeda-principle-7",
            numericId: "Principle 7",
            title: "Safeguards",
            description: "Personal information shall be protected by security safeguards appropriate to the sensitivity of the information.",
        },
        {
            id: "pipeda-principle-9",
            numericId: "Principle 9",
            title: "Individual Access",
            description: "Upon request, an individual shall be informed of the existence, use, and disclosure of his or her personal information and shall be given access to that information.",
        }
    ],
    questions: [
        {
            id: "q_pipeda_canada",
            text: "Do you collect, use, or disclose personal information in the course of commercial activities in Canada?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-1"]
        },
        {
            id: "q_pipeda_officer",
            text: "Have you designated a Privacy Officer accountable for compliance?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-1"]
        },
        {
            id: "q_pipeda_breach",
            text: "Do you have a process to report breaches to the Privacy Commissioner of Canada?",
            type: "boolean",
            relatedArticles: ["pipeda-principle-7"]
        }
    ]
};
