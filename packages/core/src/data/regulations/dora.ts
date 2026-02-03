import { Regulation } from "./types";

export const dora: Regulation = {
    id: "dora",
    name: "EU DORA",
    description: "The Digital Operational Resilience Act (DORA) is an EU regulation that ensures the financial sector in Europe is able to stay resilient in the event of a severe operational disruption.",
    type: "Security",
    logo: "/frameworks/eu_flag.svg",
    articles: [
        {
            id: "dora-art-5",
            numericId: "5",
            title: "Governance and Organisation",
            description: "1. Financial entities shall have in place an internal governance and control framework that ensures an effective and prudent management of all ICT risks, in order to achieve a high level of digital operational resilience. 2. The management body of the financial entity shall define, approve, oversee and be accountable for the implementation of all arrangements related to the ICT risk management framework.",
            subArticles: [
                { id: "dora-art-5-2", title: "Management Body Responsibility", description: "The management body shall bear the ultimate responsibility for managing the financial entity's ICT risk." },
                { id: "dora-art-5-3", title: "Strategy Alignment", description: "Financial entities shall ensure that their ICT risk management framework involves a digital resilience strategy." }
            ]
        },
        {
            id: "dora-art-6",
            numericId: "6",
            title: "ICT Risk Management Framework",
            description: "1. Financial entities shall have a sound, comprehensive and well-documented ICT risk management framework as part of their overall risk management system, which enables them to address ICT risk quickly, efficiently and comprehensively. 2. The ICT risk management framework shall include at least strategies, policies, procedures, ICT protocols and tools that are necessary to protect all information assets and ICT assets, including computer software, hardware, servers, as well as relevant physical components and infrastructure.",
            mappedControls: { "NIST 800-53": ["RA-1", "PM-9", "SA-1"], "ISO 27001": ["A.5.1", "A.8.2"] }
        },
        {
            id: "dora-art-8",
            numericId: "8",
            title: "Identification",
            description: "1. As part of the ICT risk management framework, financial entities shall identify, classify and adequately document all ICT supported business functions, roles and responsibilities, the information assets and ICT assets supporting those functions, and their roles and dependencies in relation to ICT risk. 2. Financial entities shall identify all sources of ICT risk on a continuous basis, in particular the risk exposure to and from other financial entities."
        },
        {
            id: "dora-art-17",
            numericId: "17",
            title: "ICT-related Incident Management Process",
            description: "1. Financial entities shall define, establish and implement an ICT-related incident management process to detect, manage and notify ICT-related incidents. 2. Financial entities shall record all ICT-related incidents and significant cyber threats. Financial entities shall establish appropriate procedures and processes to ensure a consistent and integrated monitoring, handling and follow-up of ICT-related incidents, to ensure that the root causes are identified, documented and addressed in order to prevent the occurrence of such incidents."
        }
    ]
};
