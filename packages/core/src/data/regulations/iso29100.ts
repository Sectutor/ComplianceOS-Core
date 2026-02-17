
import { Regulation } from "./types";

export const iso29100: Regulation = {
    id: "iso-29100",
    name: "ISO/IEC 29100:2011",
    description: "Privacy framework providing a high-level privacy architecture and terminology.",
    type: "Privacy",
    logo: "/frameworks/iso.svg",
    articles: [
        {
            id: "iso29100-principle-1",
            numericId: "1",
            title: "Consent and Choice",
            description: "Present the PII principal with the choice to opt-in or opt-out of PII processing."
        },
        {
            id: "iso29100-principle-2",
            numericId: "2",
            title: "Purpose Legitimacy and Specification",
            description: "Ensure the processing purpose is lawful and specified at the time of collection."
        },
        {
            id: "iso29100-principle-3",
            numericId: "3",
            title: "Collection Limitation",
            description: "Limit the collection of PII to that which is strictly necessary for specified purposes."
        },
        {
            id: "iso29100-principle-4",
            numericId: "4",
            title: "Data Minimization",
            description: "Minimize the PII processed to the minimum necessary for the purpose."
        },
        {
            id: "iso29100-principle-5",
            numericId: "5",
            title: "Use, Retention and Relevant Disclosures Limitation",
            description: "Limit the use, retention, and disclosure of PII to defined purposes."
        },
        {
            id: "iso29100-principle-6",
            numericId: "6",
            title: "Accuracy and Quality",
            description: "Ensure PII is accurate, complete, and up-to-date."
        },
        {
            id: "iso29100-principle-7",
            numericId: "7",
            title: "Openness, Transparency and Notice",
            description: "Provide PII principals with information about PII processing policies."
        },
        {
            id: "iso29100-principle-8",
            numericId: "8",
            title: "Individual Participation and Access",
            description: "Allow PII principals to access and review their PII."
        },
        {
            id: "iso29100-principle-9",
            numericId: "9",
            title: "Accountability",
            description: "Establish accountability for complying with privacy principles."
        },
        {
            id: "iso29100-principle-10",
            numericId: "10",
            title: "Information Security",
            description: "Implement appropriate technical and organizational measures to protect PII."
        },
        {
            id: "iso29100-principle-11",
            numericId: "11",
            title: "Privacy Compliance",
            description: "Verify compliance with the privacy framework."
        }
    ],
    questions: [
        {
            id: "q_iso29100_architecture",
            text: "Does your system architecture incorporate the 11 privacy principles defined in ISO 29100?",
            type: "boolean",
            relatedArticles: ["iso29100-principle-1", "iso29100-principle-11"]
        }
    ]
};
