import { Regulation } from "./types";

export const glba: Regulation = {
    id: "glba",
    name: "GLBA (Gramm-Leach-Bliley Act)",
    description: "The Gramm-Leach-Bliley Act (GLBA) asserts federal dominion over the data security and privacy practices of U.S. financial institutions. It dictates strictly governed conditions under which institutions can share nonpublic personal information (NPI). Beyond privacy, the recently updated FTC Safeguards Rule within GLBA aggressively mandates that financial entities mathematically formalize, implement, and dynamically test comprehensive Written Information Security Programs (WISPs) to shield financial data against catastrophic exploitation.",
    type: "Privacy",
    logo: "/frameworks/glba.svg",
    articles: [
        {
            id: "glba-privacy-rule",
            numericId: "15 U.S.C. § 6801",
            title: "The Financial Privacy Rule",
            description: "The Privacy Rule legally constrains how financial institutions collect, operationalize, and ultimately disclose the nonpublic personal information (NPI) of their consumer base. It forces institutions to embrace corporate transparency by publishing their exact information-sharing architectures and affording consumers the explicit right to sever data flows to unaffiliated third parties.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "AC-3"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "glba-notice", title: "Mandatory Privacy Notice Architecture", description: "Institutions must deliver a 'clear and conspicuous' privacy notice upon the establishment of the customer relationship and annually thereafter. This document must explicitly diagram the types of NPI collected, the categories of affiliates/non-affiliates receiving the data, and the cryptographic/administrative protocols used to protect it.", mappedControls: { "NIST 800-53": ["PT-5"] } },
                { id: "glba-opt-out", title: "Non-Affiliate Third-Party Opt-Out", description: "Before a financial entity can legally transmit NPI to a non-affiliated third party, they must provide the consumer with a 'reasonable opportunity' and a mathematically robust, low-friction technical mechanism to affirmatively opt-out of that data transmigration.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        },
        {
            id: "glba-safeguards-rule",
            numericId: "16 CFR Part 314",
            title: "The FTC Safeguards Rule requires",
            description: "Recently amended and aggressively enforced, the Safeguards Rule converts abstract security concepts into rigid legal obligations. It requires the 'Qualified Individual' (often the CISO) to develop, engineer, and continuously maintain a comprehensively documented Written Information Security Program (WISP) specifically tuned to protect the confidentiality and integrity of customer financial data.",
            mappedControls: {
                "NIST 800-53": ["PM-1", "RA-1", "SC-1", "SI-4", "AT-2"],
                "ISO 27001": ["A.6.1.1", "A.12.6.1", "A.9.2.1"]
            },
            subArticles: [
                { id: "glba-risk-assessment", title: "Mathematical Risk Assessment", description: "The WISP must be fundamentally grounded in formally documented risk assessments. Security teams must continuously identify and forensically evaluate reasonably foreseeable internal and external risks to the security network, analyzing the adequacy of existing controls to mitigate those vectors.", mappedControls: { "NIST 800-53": ["RA-3"] } },
                { id: "glba-controls", title: "Engineered Security Controls", description: "Institutions must deploy specific, hardened technical defenses: this includes the mandatory implementation of rigid Multi-Factor Authentication (MFA) across all NPI access vectors, the continuous encryption of all NPI (both in-transit and at-rest), and the aggressive enforcement of the principle of least privilege.", mappedControls: { "NIST 800-53": ["AC-3", "IA-2", "IA-8", "SC-28"] } },
                { id: "glba-monitor", title: "Continuous Monitoring & Penetration Testing", description: "Static defense is illegal. Systems supporting NPI must be subjected to continuous automated vulnerability monitoring or, at an absolute minimum, rigid annual manual penetration testing alongside bi-annual automated vulnerability scans to empirically prove defensive viability.", mappedControls: { "NIST 800-53": ["CA-8", "SI-4"] } }
            ]
        },
        {
            id: "glba-pretexting",
            numericId: "15 U.S.C. § 6821",
            title: "Pretexting Combat Provisions",
            description: "Addressing social engineering, this provision legally prohibits exactly the deceptive practices used to manipulate financial personnel into surrendering customer data. Institutions must engineer rigorous identity verification protocols to technically counter 'pretexting' attacks.",
            mappedControls: {
                "NIST 800-53": ["AT-2", "IA-8"],
                "ISO 27001": ["A.7.2.2"]
            }
        }
    ],
    questions: [
        {
            id: "q_glba_financial",
            text: "Jurisdictional Trigger: Has legal counsel formally established that the primary business model inherently constitutes a 'financial institution' under FTC jurisdiction (e.g., lending, brokering, financial advising), therefore commanding strict adherence to GLBA rules?",
            type: "boolean",
            relatedArticles: ["glba-privacy-rule"]
        },
        {
            id: "q_glba_program",
            text: "Formal WISP Architecture: Has the designated 'Qualified Individual' (CISO/CTO) formally codified, reviewed, and algorithmically stored a comprehensive Written Information Security Program (WISP) directly mapped to the updated FTC Safeguards requirements?",
            type: "boolean",
            relatedArticles: ["glba-safeguards-rule"]
        },
        {
            id: "q_glba_encryption",
            text: "Hardened Encryption & MFA: Is all Nonpublic Personal Information (NPI) aggressively encrypted both at-rest and in-transit utilizing NIST-approved algorithms, and is physical/logical access to that NPI guarded by unbroken Multi-Factor Authentication (MFA)?",
            type: "boolean",
            relatedArticles: ["glba-controls"]
        },
        {
            id: "q_glba_notice",
            text: "Transparency Obligations: Is the organization's backend infrastructure configured to automatically distribute legally reviewed privacy notices to customers annually, while concurrently supporting a friction-free mechanism to honor third-party sharing opt-outs?",
            type: "boolean",
            relatedArticles: ["glba-notice", "glba-opt-out"]
        },
        {
            id: "q_glba_pentest",
            text: "Defensive Validation: Are all systems harboring NPI subjected to either sophisticated continuous automated monitoring or, alternatively, strict annual penetration testing combined with bi-annual vulnerability sweeps to prove impenetrable geometry?",
            type: "boolean",
            relatedArticles: ["glba-monitor"]
        }
    ]
};
