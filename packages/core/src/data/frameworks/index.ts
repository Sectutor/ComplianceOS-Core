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
    }
];

export const getFramework = (id: string) => frameworks.find(f => f.id === id);
