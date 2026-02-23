import { Regulation } from "./types";

export const hipaa: Regulation = {
    id: "hipaa",
    name: "HIPAA (Health Insurance Portability and Accountability Act)",
    description: "The Health Insurance Portability and Accountability Act (HIPAA) of 1996, augmented by the HITECH Act, establishes the absolute federal baseline for the protection of sensitive patient health information (PHI) within the United States. Structured into highly rigorous Privacy, Security, and Breach Notification Rules, HIPAA legally mandates that Covered Entities and their downstream Business Associates engineer comprehensive administrative protocols, physical barriers, and unbreakable technical cryptographic controls. The explicit goal is to prevent the unauthorized disclosure, algorithmic manipulation, and malicious acquisition of ePHI, while guaranteeing patients uninterrupted access to their own medical histories.",
    type: "Privacy",
    logo: "/frameworks/hipaa.svg",
    articles: [
        {
            id: "hipaa-164-308",
            numericId: "§ 164.308",
            title: "Security Rule: Administrative Safeguards",
            description: "The Administrative Safeguards constitute the managerial and operational blueprint of HIPAA compliance. Section 164.308 demands that organizations systematically formalize security processes, explicitly establishing policies continuously designed to proactively prevent, detect, instantly contain, and aggressively remediate cybersecurity violations affecting protected health information.",
            mappedControls: {
                "NIST 800-53": ["RA-1", "PS-1", "AT-2", "AU-3", "PM-1"],
                "ISO 27001": ["A.6.1.1", "A.7.2.2"]
            },
            subArticles: [
                { id: "164-308-a-1", title: "Security Management Process & Risk Analysis", description: "Organizations are legally mandated to conduct an exhaustive, mathematically sound, and thoroughly documented Risk Analysis targeting the vulnerabilities and cyber threats posed to the confidentiality, integrity, and availability (CIA triad) of their entire ePHI ecosystem. This includes subsequent Risk Management deployments to algorithmically reduce identified risks to acceptable levels.", mappedControls: { "NIST 800-53": ["RA-3", "RA-1"] } },
                { id: "164-308-a-4", title: "Information System Activity Review & Auditing", description: "Security Information and Event Management (SIEM) systems must be implemented and meticulously monitored. Organizations must routinely ingest, parse, and review raw system activity logs, access reports, and automated security incident tracking systems to detect anomalous internal behavior or external breaches.", mappedControls: { "NIST 800-53": ["AU-3", "AU-6"] } },
                { id: "164-308-a-5", title: "Security Awareness and Training Programs", description: "Human error remains the primary attack vector. HIPAA legally requires the execution of comprehensive, continuous, and verifiable security awareness training programs for the entirety of the active workforce, focusing specifically on phishing defense, password hygiene, and malicious software prevention.", mappedControls: { "NIST 800-53": ["AT-2"] } }
            ]
        },
        {
            id: "hipaa-164-310",
            numericId: "§ 164.310",
            title: "Security Rule: Physical Safeguards",
            description: "Acknowledging that data exfiltration frequently occurs physically, Section 164.310 requires stringent physical barrier constraints. These safeguards are legally mandated policies and mechanical procedures engineered to severely restrict anatomical access to electronic information systems, server rooms, and the structural facilities where sensitive hardware operates.",
            mappedControls: {
                "NIST 800-53": ["PE-2", "PE-3", "MP-4", "MP-6"],
                "ISO 27001": ["A.11.1.1", "A.11.2.9"]
            },
            subArticles: [
                { id: "164-310-a-1", title: "Facility Access Controls & Contingency", description: "Physical perimeters must be defended. Organizations must implement unbreachable facility security plans—utilizing surveillance, biometric locks, and security personnel—to safeguard server infrastructure from theft, environmental tampering, and unauthorized physical infiltration. Emergency mode structural operations must also be defined.", mappedControls: { "NIST 800-53": ["PE-3"] } },
                { id: "164-310-d-1", title: "Device and Media Lifecycle Controls", description: "The physical movement of data must be audited. Strict governance must dictate the acquisition, internal movement, and eventual cryptographic destruction/sanitization of hardware and electronic storage media containing ePHI, ensuring drives cannot be scavenged post-disposal.", mappedControls: { "NIST 800-53": ["MP-6"] } }
            ]
        },
        {
            id: "hipaa-164-312",
            numericId: "§ 164.312",
            title: "Security Rule: Technical Safeguards",
            description: "The core technical cyber-defense requirements. Section 164.312 legally obligates security engineering teams to deploy advanced automated safeguards, cryptographic parameters, and network architectures specifically designed to protect ePHI from unauthorized logical access, interception, and silent alteration.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "AU-3", "SI-4", "IA-8", "SC-8", "SC-28"],
                "ISO 27001": ["A.9.1.1", "A.10.1.1", "A.12.6.1"]
            },
            subArticles: [
                { id: "164-312-a-1", title: "Access Control & Unique User Identity", description: "Networks must embrace Zero-Trust models. Technical policies must strictly enforce Role-Based Access Control (RBAC), ensuring ePHI is utterly inaccessible to unauthorized software agents or personnel. Every individual system user must be assigned a mathematically unique identifier for forensic tracking and attribution.", mappedControls: { "NIST 800-53": ["AC-3", "IA-2"] } },
                { id: "164-312-b", title: "Cryptographic Audit Controls", description: "Invisible surveillance: Organizations must engineer hardware and software mechanisms that immutably record, log, and persistently examine high-risk activity within databases and applications traversing ePHI. These logs must be protected against tampering to preserve forensic integrity.", mappedControls: { "NIST 800-53": ["AU-3", "AU-9"] } },
                { id: "164-312-c-1", title: "Data Integrity & Authentication", description: "Deploy technical mechanisms (such as checksum hashing and digital signatures) to corroborate that electronic PHI has not been silently altered or destroyed in an unauthorized manner. Concurrent person-entity authentication systems (like Multi-Factor Authentication) are mandated.", mappedControls: { "NIST 800-53": ["SI-7", "IA-8"] } },
                { id: "164-312-e-1", title: "Transmission Security & Encryption", description: "It is legally abhorrent to transmit ePHI in plaintext. Security teams must deploy extremely robust cryptographic protocols (e.g., modern TLS 1.3 architecture, FIPS 140-2 validated encryption algorithms) to aggressively guard against man-in-the-middle interception while ePHI traverses the open internet or internal physical network boundaries.", mappedControls: { "NIST 800-53": ["SC-8", "SC-28"] } }
            ]
        },
        {
            id: "hipaa-164-400",
            numericId: "§ 164.400",
            title: "Breach Notification Rule Requirements",
            description: "The Breach Notification Rule eliminates obscurity. It strictly regulates the absolute mandatory corporate timeline and communication mechanisms utilized to inform the government, the public, and the directly affected victims immediately following the discovery of unauthorized acquisition, access, use, or disclosure of unsecured PHI.",
            mappedControls: {
                "NIST 800-53": ["IR-6", "IR-8"],
                "ISO 27001": ["A.16.1.1"]
            },
            subArticles: [
                { id: "164-404", title: "Statutory Notification to Individuals", description: "Victims cannot be kept in the dark. Covered entities must aggressively orchestrate the notification of affected individuals without unreasonable delay—and under severe legal penalty, absolutely no later than 60 calendar days post-discovery of the systemic ePHI breach." },
                { id: "164-408", title: "Federal Notification Constraints", description: "Breaches affecting 500 or more individuals must be immediately, concurrently reported to the Secretary of Health and Human Services (HHS) and prominent regional media outlets, triggering immediate federal OCR investigation parameters." }
            ]
        },
        {
            id: "hipaa-164-500",
            numericId: "§ 164.500",
            title: "Privacy Rule: Permitted Uses and Disclosures",
            description: "The Privacy Rule strikes the balance between facilitating high-quality healthcare and defending civil privacy. It defines what constitutes Individually Identifiable Health Information and strictly limits the exact, legally defensible scenarios under which this data can be utilized, monetized, or shared by Covered Entities and connected business networks.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5"],
                "ISO 27001": ["A.18.1.4"]
            },
            subArticles: [
                { id: "164-502", title: "The Minimum Necessary Standard", description: "Unless a specific exemption applies, the 'Minimum Necessary' legal standard dictates that personnel accessing PHI must inherently be restricted to retrieving only the exact subset of information absolutely critical to fulfilling their immediate clinical or operational function.", mappedControls: { "NIST 800-53": ["PT-2"] } },
                { id: "164-520", title: "Notice of Privacy Practices & Patient Rights", description: "The foundation of medical transparency. Patients hold the unalienable right to receive a crystal-clear public notice detailing how their PHI will be legally leveraged. Furthermore, patients maintain the sovereign right to demand access to, inspect, and extract literal copies of their Designated Record Set.", mappedControls: { "NIST 800-53": ["PT-5"] } }
            ]
        }
    ],
    questions: [
        {
            id: "q_hipaa_entity",
            text: "Organizational Designation: Has legal counsel definitively classified the operational boundary of the organization as either a direct HIPAA 'Covered Entity' (e.g., healthcare provider, clearinghouse) or a downstream 'Business Associate' liable for managing ePHI infrastructure?",
            type: "select",
            options: ["Covered Entity", "Business Associate", "Neither (Out of Scope)"],
            relatedArticles: ["hipaa-164-500"]
        },
        {
            id: "q_hipaa_baa",
            text: "Supply Chain Governance (BAAs): Are there legally binding, meticulously reviewed Business Associate Agreements (BAAs) fully executed with every single third-party vendor, cloud provider, and subcontractor that interacts with the organization's ePHI workflows?",
            type: "boolean",
            relatedArticles: ["hipaa-164-308", "hipaa-164-500"]
        },
        {
            id: "q_hipaa_ra",
            text: "Mandatory Risk Analysis: Can the Chief Information Security Officer (CISO) provide a documented, mathematically verified Security Risk Analysis—executed within the preceding 12 months—that fundamentally maps all ePHI persistence layers and network flow vulnerabilities?",
            type: "boolean",
            relatedArticles: ["hipaa-164-308-a-1"]
        },
        {
            id: "q_hipaa_encryption",
            text: "Cryptographic Defenses: Is the entirety of the ePHI ecosystem aggressively encrypted both computationally at-rest (database/disk) and in-transit (network traversal) exclusively utilizing robust, NIST-approved cryptographic architectures (such as FIPS 140-2 validated modules and modern TLS)?",
            type: "boolean",
            relatedArticles: ["hipaa-164-312-e-1"]
        },
        {
            id: "q_hipaa_audit",
            text: "SIEM & Forensic Auditing: Has engineering deployed an immutable logging architecture that persistently records all logical access attempts (successful and denied) against ePHI databases, and are these forensic access logs subjected to routine, automated security review?",
            type: "boolean",
            relatedArticles: ["hipaa-164-312-b"]
        }
    ]
};
