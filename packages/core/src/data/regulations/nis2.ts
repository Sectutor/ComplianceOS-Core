import { Regulation } from "./types";

export const nis2: Regulation = {
    id: "nis2",
    name: "EU NIS2 Directive",
    description: "The Network and Information Security (NIS2) Directive is EU-wide legislation on cybersecurity. It provides legal measures to boost the overall level of cybersecurity in the EU.",
    type: "Security",
    logo: "/frameworks/eu_flag.svg",
    questions: [
        {
            id: "nis2-q1",
            text: "Does the management body actively approve and oversee cybersecurity risk-management measures and accept accountability for breaches?",
            type: "boolean",
            relatedArticles: ["nis2-art-20"],
            failureGuidance: "Establish a charter for the Board/Management that explicitly includes cybersecurity oversight duties. Schedule quarterly security reviews with leadership."
        },
        {
            id: "nis2-q2",
            text: "Do you maintain up-to-date policies on risk analysis and information system security?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-a"],
            failureGuidance: "Draft an Information Security Policy (ISP) and a Risk Assessment Methodology. Review and update these documents at least annually."
        },
        {
            id: "nis2-q3",
            text: "Is there a formal incident handling process in place to prevent, detect, and respond to cyber incidents?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-b"],
            failureGuidance: "Develop an Incident Response Plan (IRP) defining roles, communication channels, and classification of incidents. Test it with a tabletop exercise."
        },
        {
            id: "nis2-q4",
            text: "Do you have business continuity and disaster recovery plans that are regularly tested?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-c"],
            failureGuidance: "Create a Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP). Perform a backup restoration test to ensure data integrity."
        },
        {
            id: "nis2-q5",
            text: "Are supply chain security risks identified, involving assessments of direct suppliers and service providers?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-d"],
            failureGuidance: "Implement a Third-Party Risk Management (TPRM) program. Send security questionnaires to critical vendors and include security clauses in contracts."
        },
        {
            id: "nis2-q6",
            text: "Are security measures integrated into the acquisition, development, and maintenance of network systems (including vulnerability handling)?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-e"],
            failureGuidance: "Adopt a Vulnerability Management Policy. Scan systems regularly and patch critical vulnerabilities within 14 days. Use Secure Software Development Lifecycle (SSDLC) practices."
        },
        {
            id: "nis2-q7",
            text: "Do you conduct regular audits and assessments to measure the effectiveness of your security controls?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-f"],
            failureGuidance: "Schedule an independent yearly security audit or penetration test. Define KPIs (e.g., Mean Time to Detect) to measure security performance."
        },
        {
            id: "nis2-q8",
            text: "Is there a mandatory cybersecurity training program and basic cyber hygiene practice (e.g., strong passwords, updates) for all staff?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-g"],
            failureGuidance: "Launch a Security Awareness Training platform. Enforce a Password Policy requiring complexity or passkeys. Run phishing simulations."
        },
        {
            id: "nis2-q9",
            text: "Are cryptography and encryption used effectively to protect data at rest and in transit?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-h"],
            failureGuidance: "Enable full-disk encryption on all endpoints (BitLocker/FileVault). Ensure all web traffic uses TLS 1.2+. Encrypt sensitive databases."
        },
        {
            id: "nis2-q10",
            text: "Are human resources security procedures (background checks, access control) implemented for sensitive roles?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-i"],
            failureGuidance: "Update HR policies to include background checks for privileged roles. Automate access revocation immediately upon employee termination."
        },
        {
            id: "nis2-q11",
            text: "Is Multi-Factor Authentication (MFA) or continuous authentication enforced for all remote and privileged access?",
            type: "boolean",
            relatedArticles: ["nis2-art-21-2-j"],
            failureGuidance: "Enforce MFA on all remote access points (VPN, Cloud Email, SaaS). Require Phishing-Resistant MFA for administrators."
        },
        {
            id: "nis2-q12",
            text: "Do you have a procedure to notify the competent authority/CSIRT of significant incidents without undue delay?",
            type: "boolean",
            relatedArticles: ["nis2-art-23"],
            failureGuidance: "Identify your competent authority (CSIRT). Create a notification template to ensure you can report significant incidents within the 24-hour deadline."
        }
    ],
    articles: [
        {
            id: "nis2-art-20",
            numericId: "20",
            title: "Governance",
            description: "1. Member States shall ensure that the management bodies of essential and important entities approve the cybersecurity risk-management measures taken by those entities and oversee its implementation and can be held liable for infringements by the entities of that Article.",
            mappedControls: { "NIST CSF": ["GV.GO-01", "GV.RM-01"] }
        },
        {
            id: "nis2-art-21-intro",
            numericId: "21.1",
            title: "Cybersecurity risk-management duty",
            description: "Essential and important entities shall take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems.",
            mappedControls: { "NIST CSF": ["GV.RM-02"] }
        },
        // The "10 Major Points" explicitly broken out as actionable items
        {
            id: "nis2-art-21-2-a",
            numericId: "21.2(a)",
            title: "Policies on risk analysis and information system security",
            description: "Entities must implement and maintain documented policies on risk analysis and information system security. This includes: 1) A methodology for identifying and assessing cybersecurity risks. 2) Regular review and updates of security policies. 3) Approval of policies by management bodies.",
            mappedControls: { "NIST 800-53": ["RA-1", "PL-2", "CA-1"], "ISO 27001": ["A.5.1.1", "A.8.2"] }
        },
        {
            id: "nis2-art-21-2-b",
            numericId: "21.2(b)",
            title: "Incident handling",
            description: "Entities must have an incident handling process to prevent, detect, and respond to incidents. Requirements enable: 1) Detection of cyber threats and incidents. 2) Reporting channels for security events. 3) A defined response plan to mitigate impact. 4) Post-incident analysis to learn and improve defenses.",
            mappedControls: { "NIST 800-53": ["IR-1", "IR-4", "IR-6"], "ISO 27001": ["A.16.1"] }
        },
        {
            id: "nis2-art-21-2-c",
            numericId: "21.2(c)",
            title: "Business continuity and crisis management",
            description: "Entities must ensure business continuity and crisis management capabilities. This requires: 1) Regular backups of data and critical systems. 2) Disaster recovery plans that are tested periodically. 3) Crisis management procedures to ensure operational resilience during severe disruptions.",
            mappedControls: { "NIST 800-53": ["CP-1", "CP-2", "CP-9"], "ISO 27001": ["A.17.1"] }
        },
        {
            id: "nis2-art-21-2-d",
            numericId: "21.2(d)",
            title: "Supply chain security",
            description: "Entities must manage security risks in their supply chain. This involves: 1) Assessing the security practices of direct suppliers and service providers. 2) Addressing security in contractual arrangements. 3) Considering the broader ecosystem risks and dependencies.",
            mappedControls: { "NIST 800-53": ["SR-1", "SR-3"], "ISO 27001": ["A.15.1", "A.15.2"] }
        },
        {
            id: "nis2-art-21-2-e",
            numericId: "21.2(e)",
            title: "Security in network and information systems acquisition",
            description: "Security must be integrated into the acquisition, development, and maintenance of network and information systems. Requirements include: 1) Handling and disclosing vulnerabilities. 2) Secure coding and development practices. 3) Security testing before system deployment.",
            mappedControls: { "NIST 800-53": ["SA-3", "SA-8", "SI-2"] }
        },
        {
            id: "nis2-art-21-2-f",
            numericId: "21.2(f)",
            title: "Policies and procedures to assess effectiveness",
            description: "Entities must establish policies and procedures to regularly assess the effectiveness of cybersecurity risk-management measures. This includes: 1) Conducting regular security audits and assessments. 2) Metrics to measure control performance. 3) Management reviews of the effectiveness of the security program.",
            mappedControls: { "NIST 800-53": ["CA-2", "CA-7"] }
        },
        {
            id: "nis2-art-21-2-g",
            numericId: "21.2(g)",
            title: "Basic cyber hygiene and training",
            description: "Entities must implement basic cyber hygiene practices and cybersecurity training. This involves: 1) Mandatory cybersecurity training for staff. 2) Promoting a security culture. 3) Implementing hygiene basics like patch management, password policies, and software updates.",
            mappedControls: { "NIST 800-53": ["AT-2", "AT-3", "SI-2"] }
        },
        {
            id: "nis2-art-21-2-h",
            numericId: "21.2(h)",
            title: "Cryptography and encryption",
            description: "Entities must have policies and procedures regarding the use of cryptography. This includes: 1) Implementing encryption for data at rest and in transit where appropriate. 2) Managing cryptographic keys securely. 3) Justifying cases where encryption is not used.",
            mappedControls: { "NIST 800-53": ["SC-13", "SC-28"] }
        },
        {
            id: "nis2-art-21-2-i",
            numericId: "21.2(i)",
            title: "Human resources security",
            description: "Entities must ensure human resources security, access control policies, and asset management. Requirements include: 1) Background checks for sensitive roles. 2) Secure onboarding and offboarding procedures. 3) Strict access control policies based on least privilege and asset management lifecycles.",
            mappedControls: { "NIST 800-53": ["PS-1", "AC-1", "CM-8"] }
        },
        {
            id: "nis2-art-21-2-j",
            numericId: "21.2(j)",
            title: "Multi-factor authentication",
            description: "Entities must use multi-factor authentication (MFA) or continuous authentication solutions. This applies to: 1) Remote access to systems. 2) Privileged accounts. 3) Secured voice, video, and text communications where appropriate.",
            mappedControls: { "NIST 800-53": ["IA-2", "AC-17"] }
        },
        {
            id: "nis2-art-23",
            numericId: "23",
            title: "Reporting obligations",
            description: "Essential and important entities shall notify, without undue delay, the CSIRT or, where applicable, the competent authority of any significant incident.",
            mappedControls: { "NIST 800-53": ["IR-6"] }
        }
    ]
};
