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
                { id: "164-308-a-1", title: "Risk Analysis", description: "Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity." }
            ]
        },
        {
            id: "hipaa-164-310",
            numericId: "164.310",
            title: "Physical Safeguards",
            description: "Facility Access Controls: Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed, while ensuring that properly authorized access is allowed.",
        }
    ]
};
