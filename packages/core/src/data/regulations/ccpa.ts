
import { Regulation } from "./types";

export const ccpa: Regulation = {
    id: "ccpa-cpra",
    name: "CCPA / CPRA",
    description: "California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).",
    type: "Privacy",
    logo: "/frameworks/ccpa.svg",
    articles: [
        {
            id: "ccpa-1798-100",
            numericId: "1798.100",
            title: "General Duties of Businesses that Collect Personal Information",
            description: "A business that controls the collection of a consumer's personal information shall, at or before the point of collection, inform consumers as to the categories of personal information to be collected and the purposes for which the categories of personal information shall be used."
        },
        {
            id: "ccpa-1798-105",
            numericId: "1798.105",
            title: "Right to Delete Personal Information",
            description: "A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected from the consumer."
        },
        {
            id: "ccpa-1798-106",
            numericId: "1798.106",
            title: "Right to Correct Inaccurate Personal Information",
            description: "A consumer shall have the right to request a business that maintains inaccurate personal information about the consumer to correct that inaccurate personal information."
        },
        {
            id: "ccpa-1798-110",
            numericId: "1798.110",
            title: "Right to Know What Personal Information is Being Collected",
            description: "Consumers have the right to request that a business that collects personal information about the consumer disclose to the consumer the categories and specific pieces of personal information the business has collected."
        },
        {
            id: "ccpa-1798-115",
            numericId: "1798.115",
            title: "Right to Know What Personal Information is Sold or Shared",
            description: "A consumer shall have the right to request that a business that sells or shares the consumer's personal information, or that discloses it for a business purpose, disclose to that consumer the categories of personal information sold, shared, or disclosed."
        },
        {
            id: "ccpa-1798-120",
            numericId: "1798.120",
            title: "Right to Opt-Out of Sale or Sharing of Personal Information",
            description: "A consumer shall have the right, at any time, to direct a business that sells or shares personal information about the consumer to third parties not to sell or share the consumer's personal information."
        },
        {
            id: "ccpa-1798-121",
            numericId: "1798.121",
            title: "Right to Limit Use and Disclosure of Sensitive Personal Information",
            description: "A consumer shall have the right, at any time, to direct a business that collects sensitive personal information about the consumer to limit its use of the consumer's sensitive personal information to that use which is necessary to perform the services or provide the goods reasonably expected by an average consumer."
        },
        {
            id: "ccpa-1798-125",
            numericId: "1798.125",
            title: "Right of Non-Discrimination",
            description: "A business shall not discriminate against a consumer because the consumer exercised any of the consumer's rights under this title."
        },
        {
            id: "ccpa-1798-130",
            numericId: "1798.130",
            title: "Notice, Disclosure, Correction, and Deletion Requirements",
            description: "Businesses must make available to consumers two or more designated methods for submitting requests for information required to be disclosed pursuant to Sections 1798.110 and 1798.115, including, at a minimum, a toll-free telephone number."
        },
        {
            id: "ccpa-1798-150",
            numericId: "1798.150",
            title: "Personal Information Security Breaches",
            description: "Consumers may institute a civil action if nonencrypted and nonredacted personal information is subject to an unauthorized access and exfiltration, theft, or disclosure as a result of the business's violation of the duty to implement and maintain reasonable security procedures."
        }
    ],
    questions: [
        {
            id: "q_ccpa_1",
            text: "Does your business collect personal information of California residents?",
            type: "boolean",
            relatedArticles: ["ccpa-1798-100"]
        },
        {
            id: "q_ccpa_2",
            text: "Do you have a process to respond to requests to delete personal information?",
            type: "boolean",
            relatedArticles: ["ccpa-1798-105"]
        },
        {
            id: "q_ccpa_3",
            text: "Do you sell or share personal information for cross-context behavioral advertising?",
            type: "boolean",
            relatedArticles: ["ccpa-1798-120"]
        },
        {
            id: "q_ccpa_4",
            text: "Do you provide a 'Do Not Sell or Share My Personal Information' link on your homepage?",
            type: "boolean",
            relatedArticles: ["ccpa-1798-135"]
        }
    ]
};
