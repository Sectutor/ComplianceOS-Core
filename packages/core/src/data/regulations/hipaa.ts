import { Regulation } from "./types";

export const hipaa: Regulation = {
    id: "hipaa",
    name: "HIPAA",
    description: "The Health Insurance Portability and Accountability Act of 1996 is a federal law that required the creation of national standards to protect sensitive patient health information from being disclosed without the patient's consent or knowledge.",
    type: "Privacy",
    logo: "/frameworks/hipaa.svg",
    articles: [
        {
            id: "hipaa-164-308",
            numericId: "164.308",
            title: "Administrative Safeguards",
            description: "Security Management Process: Implement policies and procedures to prevent, detect, contain, and correct security violations.",
            subArticles: [
                { id: "164-308-a-1", title: "Risk Analysis", description: "Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity." },
                { id: "164-308-a-2", title: "Risk Management", description: "Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level." },
                { id: "164-308-a-3", title: "Sanction Policy", description: "Apply appropriate sanctions against workforce members who fail to comply with the security policies and procedures." },
                { id: "164-308-a-4", title: "Information System Activity Review", description: "Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports." },
                { id: "164-308-a-5", title: "Security Awareness and Training", description: "Implement a security awareness and training program for all members of its workforce." }
            ]
        },
        {
            id: "hipaa-164-310",
            numericId: "164.310",
            title: "Physical Safeguards",
            description: "Facility Access Controls: Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed, while ensuring that properly authorized access is allowed.",
            subArticles: [
                { id: "164-310-a-1", title: "Contingency Operations", description: "Establish (and implement as needed) procedures that allow facility access in support of restoration of lost data under the disaster recovery plan and emergency mode operations plan." },
                { id: "164-310-a-2", title: "Facility Security Plan", description: "Implement policies and procedures to safeguard the facility and the equipment therein from unauthorized physical access, tampering, and theft." },
                { id: "164-310-d-1", title: "Device and Media Controls", description: "Implement policies and procedures that govern the receipt and removal of hardware and electronic media that contain electronic protected health information into and out of a facility, and the movement of these items within the facility." }
            ]
        },
        {
            id: "hipaa-164-312",
            numericId: "164.312",
            title: "Technical Safeguards",
            description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights.",
            subArticles: [
                { id: "164-312-a-1", title: "Access Control", description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights." },
                { id: "164-312-a-2-i", title: "Unique User Identification", description: "Assign a unique name and/or number for identifying and tracking user identity." },
                { id: "164-312-a-2-ii", title: "Emergency Access Procedure", description: "Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency." },
                { id: "164-312-b", title: "Audit Controls", description: "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information." },
                { id: "164-312-c-1", title: "Integrity", description: "Implement policies and procedures to protect electronic protected health information from improper alteration or destruction." },
                { id: "164-312-d", title: "Person or Entity Authentication", description: "Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed." },
                { id: "164-312-e-1", title: "Transmission Security", description: "Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network." }
            ]
        },
        {
            id: "hipaa-164-400",
            numericId: "164.400",
            title: "Breach Notification Rule",
            description: "Regulations requiring covered entities and business associates to provide notification following a breach of unsecured protected health information.",
            subArticles: [
                { id: "164-404", title: "Notification to Individuals", description: "A covered entity shall notify an affected individual of a breach of unsecured protected health information without unreasonable delay and in no case later than 60 calendar days after discovery of the breach." },
                { id: "164-406", title: "Notification to the Media", description: "Notice to media is required if a breach affects more than 500 residents of a State or jurisdiction." },
                { id: "164-408", title: "Notification to the Secretary", description: "A covered entity shall notify the Secretary of Health and Human Services of breaches of unsecured protected health information." }
            ]
        },
        {
            id: "hipaa-164-500",
            numericId: "164.500",
            title: "Privacy Rule",
            description: "Standards for Privacy of Individually Identifiable Health Information.",
            subArticles: [
                { id: "164-502", title: "Uses and Disclosures", description: "A covered entity or business associate may not use or disclose protected health information, except as permitted or required by this subpart." },
                { id: "164-520", title: "Notice of Privacy Practices", description: "An individual has a right to adequate notice of the uses and disclosures of protected health information that may be made by the covered entity." },
                { id: "164-524", title: "Access of Individuals to PHI", description: "An individual has a right of access to inspect and obtain a copy of protected health information about the individual in a designated record set." }
            ]
        }
    ],
    questions: [
        {
            id: "q_hipaa_entity",
            text: "Is your organization a Covered Entity or a Business Associate?",
            type: "select",
            options: ["Covered Entity", "Business Associate", "Neither (but compliant)"],
            relatedArticles: ["hipaa-164-500"]
        },
        {
            id: "q_hipaa_baa",
            text: "Do you have Business Associate Agreements (BAAs) in place with all vendors handling PHI?",
            type: "boolean",
            relatedArticles: ["hipaa-164-308"]
        },
        {
            id: "q_hipaa_ra",
            text: "Have you conducted a Security Risk Analysis within the last 12 months?",
            type: "boolean",
            relatedArticles: ["hipaa-164-308-a-1"]
        }
    ]
};
