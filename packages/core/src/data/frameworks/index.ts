import { Framework } from "./types";

export const frameworks: Framework[] = [
    {
        id: "iso-27001",
        name: "ISO 27001:2022",
        description: "The leading international standard for information security management systems (ISMS).",
        type: "Security",
        logo: "/frameworks/iso27001.svg"
    },
    {
        id: "iso-22301",
        name: "ISO 22301:2019",
        description: "International standard for Business Continuity Management Systems (BCMS).",
        type: "Business Continuity",
        logo: "/frameworks/iso27001.svg"
    },
    {
        id: "hitrust",
        name: "HITRUST-Aligned (Representative)",
        description: "Representative control set aligned with HITRUST domains (e1, i1, r2) for readiness and simulation. Not the official licensed CSF text.",
        type: "Security",
        logo: "/frameworks/hitrust.svg"
    },
    {
        id: "soc-2",
        name: "SOC 2 Type II",
        description: "Service Organization Control 2 - Trust Services Criteria for security, availability, processing integrity, confidentiality and privacy.",
        type: "Security",
        logo: "/frameworks/soc2.svg"
    },
    {
        id: "nist-csf",
        name: "NIST CSF 2.0",
        description: "National Institute of Standards and Technology Cybersecurity Framework. Voluntary guidance based on existing standards.",
        type: "Security",
        logo: "/frameworks/nist.svg"
    },
    {
        id: "nist-800-171",
        name: "NIST SP 800-171 r2",
        description: "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations.",
        type: "Security",
        logo: "/frameworks/nist.svg"
    },
    {
        id: "pci-dss-v4",
        name: "PCI DSS v4.0",
        description: "Payment Card Industry Data Security Standard v4.0.",
        type: "Security",
        logo: "/frameworks/pci.svg"
    },
    {
        id: "cis-controls",
        name: "CIS Controls v8",
        description: "Center for Internet Security Critical Security Controls. Prioritized set of actions to protect from cyber attacks.",
        type: "Security",
        logo: "/frameworks/cis.svg"
    },
    {
        id: "csa-ccm",
        name: "CSA CCM v4",
        description: "Cloud Security Alliance Cloud Controls Matrix. Fundamental security principles to guide cloud vendors and to assist prospective cloud customers.",
        type: "Security",
        logo: "/frameworks/csa.svg"
    },
    {
        id: "nist-800-53",
        name: "NIST SP 800-53 Rev 5",
        description: "Security and Privacy Controls for Information Systems and Organizations.",
        type: "Security",
        logo: "/frameworks/nist.svg"
    },
    {
        id: "fedramp-moderate",
        name: "FedRAMP Moderate",
        description: "Federal Risk and Authorization Management Program - Moderate Baseline (Representative).",
        type: "Security",
        logo: "/frameworks/fedramp.svg"
    },
    {
        id: "cyber-essentials",
        name: "Cyber Essentials / Plus",
        description: "UK Government-backed scheme focusing on 5 technical control themes.",
        type: "Security",
        logo: "/frameworks/cyber_essentials.svg"
    },
    {
        id: "nist-ai-rmf",
        name: "NIST AI RMF",
        description: "NIST AI Risk Management Framework (1.0) for trustworthy and responsible AI.",
        type: "AI & Data",
        logo: "/frameworks/nist.svg"
    },
    {
        id: "owasp-aisvs",
        name: "OWASP AISVS (AI Security)",
        description: "OWASP Artificial Intelligence Security Verification Standard (1.0). structured checklist to evaluate AI-driven applications.",
        type: "AI & Data",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp-asvs",
        name: "OWASP ASVS (App Security)",
        description: "OWASP Application Security Verification Standard (4.0.3). Basis for testing technical security controls.",
        type: "Security",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp_masvs",
        name: "OWASP MASVS (Mobile Security)",
        description: "OWASP Mobile Application Security Verification Standard (2.0). The industry standard for mobile app security.",
        type: "Security",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp_samm",
        name: "OWASP SAMM (Maturity Model)",
        description: "OWASP Software Assurance Maturity Model. An effective and measurable way for all types of organizations to analyze and improve their software security posture.",
        type: "Governance",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp_api_top10",
        name: "OWASP API Security Top 10",
        description: "The most critical API security risks. Focuses on strategies and solutions to understand and mitigate the unique vulnerabilities and security risks of APIs.",
        type: "Security",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp_top10",
        name: "OWASP Web Top 10",
        description: "The standard awareness document for developers and web application security (2025 Draft/Pre-release).",
        version: "2025",
        type: "Security",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "owasp_top10_2021",
        name: "OWASP Web Top 10 (2021)",
        description: "The standard awareness document for developers and web application security (2021).",
        version: "2021",
        type: "Security",
        logo: "/frameworks/owasp.svg"
    },
    {
        id: "essential-eight",
        name: "Australian Essential Eight",
        description: "Eight prioritized mitigation strategies for cyber resilience with maturity levels 0–3.",
        type: "Security",
        logo: "/frameworks/australia.svg"
    },
    {
        id: "owasp_ml_top10",
        name: "OWASP ML Security Top 10",
        description: "Vulnerabilities in machine learning models and systems through the ML lifecycle (0.3).",
        version: "2023",
        type: "AI & Data",
        logo: "/frameworks/owasp.svg"
    }
];

export const getFramework = (id: string) => frameworks.find(f => f.id === id);
