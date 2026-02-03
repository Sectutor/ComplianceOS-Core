import { Shield, Lock, FileText, Globe, Activity } from "lucide-react";

export type QuestionnaireSection = {
    id: string;
    title: string;
    description: string;
    questions: {
        id: string;
        text: string;
    }[];
};

export type StandardConfig = {
    id: string;
    name: string;
    description: string;
    steps: {
        scope: {
            title: string;
            subtitle: string;
            hints: {
                orgBoundaries: string;
                locations: string;
                technologies: string;
            };
            extraFields?: {
                type: "soc2_tsc" | "hipaa_entity_type" | "nist_tier" | "gdpr_role";
                label: string;
                options?: { value: string; label: string; description?: string }[];
            }[];
        };
        stakeholders: {
            title: string;
            subtitle: string;
            roles?: {
                id: string;
                label: string;
                description: string;
                icon?: string; // Standard icon name or path
            }[];
        };
        documentation?: {
            title: string;
            subtitle: string;
            items?: {
                id: string;
                label: string;
                description: string;
                icon?: string;
            }[];
        };
        // Add more step overrides as needed
    };
    questionnaire?: QuestionnaireSection[];
};

export const READINESS_STANDARDS: Record<string, StandardConfig> = {
    "ISO27001": {
        id: "ISO27001",
        name: "ISO 27001",
        description: "Information Security Management System",
        steps: {
            scope: {
                title: "Define ISMS Scope",
                subtitle: "Determine the boundaries of your Information Security Management System.",
                hints: {
                    orgBoundaries: "Which business units, subsidiaries, or departments are included in the ISMS?",
                    locations: "Physical locations where sensitive information is processed or stored.",
                    technologies: "Key IT assets, cloud services, and networks within the ISMS boundary."
                }
            },
            stakeholders: {
                title: "ISMS Roles & Responsibilities",
                subtitle: "Identify the Security Committee and key ISMS owners."
            }
        },
        questionnaire: [
            {
                id: "section1",
                title: "Section 1: Context of the Organization (Clause 4)",
                description: "This section evaluates understanding of internal/external issues, interested parties, and the scope of the ISMS.",
                questions: [
                    { id: "1.1", text: "Has the organization identified and documented internal and external issues that could affect the ISMS (e.g., business environment, technology trends, regulatory changes)?" },
                    { id: "1.2", text: "Has the organization identified interested parties (e.g., customers, regulators, suppliers) and their information security requirements?" },
                    { id: "1.3", text: "Is the scope of the ISMS clearly defined, documented, and considering interfaces/boundaries with external parties?" },
                    { id: "1.4", text: "Has the ISMS been established in alignment with the organization's context and scope?" }
                ]
            },
            {
                id: "section2",
                title: "Section 2: Leadership (Clause 5)",
                description: "This section checks top management's commitment and roles.",
                questions: [
                    { id: "2.1", text: "Has top management demonstrated leadership by establishing an information security policy?" },
                    { id: "2.2", text: "Is the policy communicated within the organization and available to interested parties?" },
                    { id: "2.3", text: "Have roles, responsibilities, and authorities for information security been assigned and communicated?" },
                    { id: "2.4", text: "Does top management ensure the ISMS is integrated into business processes and supports its objectives?" }
                ]
            },
            {
                id: "section3",
                title: "Section 3: Planning (Clause 6)",
                description: "This covers risk assessment, treatment, and objectives.",
                questions: [
                    { id: "3.1", text: "Has a process for information security risk assessment been defined and implemented?" },
                    { id: "3.2", text: "Have information security risks been identified, analyzed, and evaluated (e.g., using a risk register)?" },
                    { id: "3.3", text: "Is there a risk treatment plan, including selection of controls from Annex A or others?" },
                    { id: "3.4", text: "Have measurable information security objectives been established, documented, and aligned with the policy?" },
                    { id: "3.5", text: "Are changes to the ISMS planned and controlled?" }
                ]
            },
            {
                id: "section4",
                title: "Section 4: Support (Clause 7)",
                description: "This assesses resources, competence, awareness, communication, and documentation.",
                questions: [
                    { id: "4.1", text: "Are sufficient resources (e.g., personnel, budget, tools) provided for the ISMS?" },
                    { id: "4.2", text: "Have competencies for ISMS roles been determined, and is there evidence of training/qualifications?" },
                    { id: "4.3", text: "Is there an awareness program ensuring all personnel understand the policy, risks, and their contributions?" },
                    { id: "4.4", text: "Are internal and external communication processes defined for information security?" },
                    { id: "4.5", text: "Is ISMS documentation controlled (e.g., creation, review, access), including the Statement of Applicability (SoA)?" }
                ]
            },
            {
                id: "section5",
                title: "Section 5: Operation (Clause 8)",
                description: "This evaluates operational planning and control, including risk treatment.",
                questions: [
                    { id: "5.1", text: "Are operational processes planned and controlled to meet ISMS requirements?" },
                    { id: "5.2", text: "Has the risk treatment plan been implemented, with controls in place?" },
                    { id: "5.3", text: "Are outsourced processes (e.g., cloud services) controlled for information security?" }
                ]
            },
            {
                id: "section6",
                title: "Section 6: Performance Evaluation (Clause 9)",
                description: "This covers monitoring, measurement, analysis, internal audit, and management review.",
                questions: [
                    { id: "6.1", text: "Are processes in place to monitor, measure, analyze, and evaluate ISMS performance (e.g., KPIs, metrics)?" },
                    { id: "6.2", text: "Is an internal audit program established, with audits conducted at planned intervals?" },
                    { id: "6.3", text: "Does top management conduct regular reviews of the ISMS, with documented outputs?" }
                ]
            },
            {
                id: "section7",
                title: "Section 7: Improvement (Clause 10)",
                description: "This assesses nonconformity handling and continual improvement.",
                questions: [
                    { id: "7.1", text: "Are processes defined for managing nonconformities and corrective actions?" },
                    { id: "7.2", text: "Is the ISMS continually improved based on performance evaluation and changes?" }
                ]
            },
            {
                id: "section8.1",
                title: "Section 8.1: Organizational Controls (A.5)",
                description: "Annex A Organizational Controls.",
                questions: [
                    { id: "8.1.1", text: "Is there a set of information security policies approved by management and reviewed regularly?" },
                    { id: "8.1.2", text: "Are responsibilities for information security segregated (e.g., no conflicts of interest)?" },
                    { id: "8.1.3", text: "Are contacts with authorities and special interest groups maintained?" },
                    { id: "8.1.4", text: "Is information security addressed in project management?" },
                    { id: "8.1.5", text: "Are mobile device and teleworking policies in place?" }
                ]
            },
            {
                id: "section8.2",
                title: "Section 8.2: People Controls (A.6-A.8, partial)",
                description: "Annex A People Controls.",
                questions: [
                    { id: "8.2.1", text: "Are background checks performed during recruitment?" },
                    { id: "8.2.2", text: "Are terms of employment including confidentiality agreements?" },
                    { id: "8.2.3", text: "Is there ongoing information security awareness, education, and training?" },
                    { id: "8.2.4", text: "Is there a disciplinary process for security breaches?" },
                    { id: "8.2.5", text: "Are responsibilities defined for termination or change of employment?" },
                    { id: "8.2.6", text: "Are confidentiality or non-disclosure agreements in place where needed?" },
                    { id: "8.2.7", text: "Is remote working secured (e.g., VPN, secure connections)?" },
                    { id: "8.2.8", text: "Is there a process for reporting information security events?" }
                ]
            },
            {
                id: "section8.3",
                title: "Section 8.3: Physical Controls (A.7)",
                description: "Annex A Physical Controls.",
                questions: [
                    { id: "8.3.1", text: "Are physical perimeters secured (e.g., fences, locks)?" },
                    { id: "8.3.2", text: "Is physical entry controlled (e.g., badges, logs)?" },
                    { id: "8.3.3", text: "Are offices, rooms, and facilities protected?" },
                    { id: "8.3.4", text: "Is equipment protected from physical and environmental threats?" },
                    { id: "8.3.5", text: "Are utilities and cabling secured?" },
                    { id: "8.3.6", text: "Is equipment maintained regularly?" },
                    { id: "8.3.7", text: "Is removal of assets controlled?" },
                    { id: "8.3.8", text: "Is secure disposal or reuse of equipment ensured?" },
                    { id: "8.3.9", text: "Are unattended user equipment policies enforced (e.g., screen locks)?" },
                    { id: "8.3.10", text: "Is there a clear desk and clear screen policy?" }
                ]
            },
            {
                id: "section8.4",
                title: "Section 8.4: Technological Controls (A.8, partial)",
                description: "Annex A Technological Controls.",
                questions: [
                    { id: "8.4.1", text: "Is information classified based on sensitivity?" },
                    { id: "8.4.2", text: "Are media handling procedures in place (e.g., labeling, transport)?" },
                    { id: "8.4.3", text: "Are access controls implemented (e.g., user IDs, least privilege)?" },
                    { id: "8.4.4", text: "Is user registration and de-registration managed?" },
                    { id: "8.4.5", text: "Are user access rights reviewed regularly?" },
                    { id: "8.4.6", text: "Is privileged access restricted and monitored?" },
                    { id: "8.4.7", text: "Is access to source code controlled?" },
                    { id: "8.4.8", text: "Is authentication information managed securely (e.g., passwords)?" },
                    { id: "8.4.9", text: "Is cryptography used where necessary (e.g., encryption policies)?" },
                    { id: "8.4.10", text: "Are networks segregated and secured (e.g., firewalls, DMZs)?" },
                    { id: "8.4.11", text: "Is malware protection in place (e.g., antivirus)?" },
                    { id: "8.4.12", text: "Are vulnerabilities managed (e.g., scanning, patching)?" },
                    { id: "8.4.13", text: "Is logging and monitoring implemented for security events?" },
                    { id: "8.4.14", text: "Is clock synchronization ensured for logs?" },
                    { id: "8.4.15", text: "Are installation of software on operational systems controlled?" },
                    { id: "8.4.16", text: "Is information backup performed regularly and tested?" },
                    { id: "8.4.17", text: "Is event logging protected from tampering?" },
                    { id: "8.4.18", text: "Are administrator and operator logs reviewed?" },
                    { id: "8.4.19", text: "Are systems protected during testing?" },
                    { id: "8.4.20", text: "Is change management controlled?" },
                    { id: "8.4.21", text: "Is capacity managed to ensure availability?" },
                    { id: "8.4.22", text: "Are development, test, and production environments separated?" }
                ]
            },
            {
                id: "section8.5",
                title: "Section 8.5: Supplier Relationships (A.5, partial)",
                description: "Annex A Supplier Relationship Controls.",
                questions: [
                    { id: "8.5.1", text: "Are supplier agreements including security requirements?" },
                    { id: "8.5.2", text: "Is supplier service delivery monitored?" },
                    { id: "8.5.3", text: "Are changes to supplier services managed?" }
                ]
            },
            {
                id: "section8.6",
                title: "Section 8.6: Incident Management (A.16)",
                description: "Annex A Incident Management Controls.",
                questions: [
                    { id: "8.6.1", text: "Are responsibilities for incident management defined?" },
                    { id: "8.6.2", text: "Is there a process for reporting incidents and weaknesses?" },
                    { id: "8.6.3", text: "Are incidents assessed and responded to?" },
                    { id: "8.6.4", text: "Is evidence collected for incidents?" },
                    { id: "8.6.5", text: "Are lessons learned from incidents?" }
                ]
            },
            {
                id: "section8.7",
                title: "Section 8.7: Business Continuity (A.17)",
                description: "Annex A Business Continuity Controls.",
                questions: [
                    { id: "8.7.1", text: "Is information security continuity planned?" },
                    { id: "8.7.2", text: "Are redundancy measures implemented?" },
                    { id: "8.7.3", text: "Are continuity plans verified and reviewed?" }
                ]
            },
            {
                id: "section8.8",
                title: "Section 8.8: Compliance (A.18)",
                description: "Annex A Compliance Controls.",
                questions: [
                    { id: "8.8.1", text: "Are legal, regulatory, and contractual requirements identified?" },
                    { id: "8.8.2", text: "Is intellectual property protected?" },
                    { id: "8.8.3", text: "Are records protected?" },
                    { id: "8.8.4", text: "Is privacy and personal data protected?" },
                    { id: "8.8.5", text: "Are independent reviews of information security conducted?" },
                    { id: "8.8.6", text: "Is compliance with policies and standards checked?" },
                    { id: "8.8.7", text: "Are technical compliance reviews performed?" }
                ]
            }
        ]
    },
    "SOC2": {
        id: "SOC2",
        name: "SOC 2",
        description: "Service Organization Control",
        steps: {
            scope: {
                title: "Define Service Description",
                subtitle: "Outline the services provided to user entities and the systems supporting them.",
                hints: {
                    orgBoundaries: "Describe the 'System' (services provided) that will be audited.",
                    locations: "Locations hosting the infrastructure supporting the service.",
                    technologies: "Infrastructure, software, people, data, and procedures."
                },
                extraFields: [
                    {
                        type: "soc2_tsc",
                        label: "Trust Services Criteria",
                        options: [
                            { value: "security", label: "Security (Common Criteria)", description: "Required for all SOC 2 reports. Protection against unauthorized access." },
                            { value: "availability", label: "Availability", description: "System is available for operation and use as committed or agreed." },
                            { value: "confidentiality", label: "Confidentiality", description: "Information designated as confidential is protected." },
                            { value: "integrity", label: "Processing Integrity", description: "System processing is complete, valid, accurate, timely, and authorized." },
                            { value: "privacy", label: "Privacy", description: "Personal information is collected, used, retained, disclosed, and disposed of appropriately." }
                        ]
                    }
                ]
            },
            stakeholders: {
                title: "Control Owners",
                subtitle: "Who is responsible for the design and operation of controls?"
            }
        },
        questionnaire: [
            {
                id: "cc1",
                title: "Section 1: Control Environment (CC1.0)",
                description: "This section evaluates commitment to integrity, ethics, board oversight, and accountability.",
                questions: [
                    { id: "1.1", text: "Does the organization demonstrate a commitment to integrity and ethical values through policies and practices?" },
                    { id: "1.2", text: "Is there independent oversight from a board or equivalent body?" },
                    { id: "1.3", text: "Has management established structures, reporting lines, and authorities to achieve objectives?" },
                    { id: "1.4", text: "Does the organization hold individuals accountable for their internal control responsibilities?" },
                    { id: "1.5", text: "Are competencies for roles defined, and is there evidence of attracting, developing, and retaining competent personnel?" }
                ]
            },
            {
                id: "cc2",
                title: "Section 2: Communication and Information (CC2.0)",
                description: "This covers internal/external communication and quality of information.",
                questions: [
                    { id: "2.1", text: "Is relevant, quality information identified, captured, and used to support internal controls?" },
                    { id: "2.2", text: "Are internal communications effective in enabling personnel to carry out responsibilities?" },
                    { id: "2.3", text: "Are external communications with stakeholders (e.g., customers, regulators) effective and timely?" }
                ]
            },
            {
                id: "cc3",
                title: "Section 3: Risk Assessment (CC3.0)",
                description: "This assesses risk identification, analysis, and response.",
                questions: [
                    { id: "3.1", text: "Are objectives specified with sufficient clarity to enable risk identification?" },
                    { id: "3.2", text: "Does the organization identify risks to achieving objectives, including fraud risks?" },
                    { id: "3.3", text: "Are risks analyzed for potential impact on objectives?" },
                    { id: "3.4", text: "Does the organization assess and respond to changes that could affect the control system?" }
                ]
            },
            {
                id: "cc4",
                title: "Section 4: Monitoring Activities (CC4.0)",
                description: "This evaluates ongoing evaluations and deficiency remediation.",
                questions: [
                    { id: "4.1", text: "Are ongoing and/or separate evaluations conducted to ascertain control effectiveness?" },
                    { id: "4.2", text: "Are internal control deficiencies evaluated and communicated timely to responsible parties?" }
                ]
            },
            {
                id: "cc5",
                title: "Section 5: Control Activities (CC5.0)",
                description: "This covers selection, development, and deployment of controls.",
                questions: [
                    { id: "5.1", text: "Are control activities selected and developed to mitigate risks?" },
                    { id: "5.2", text: "Are general IT controls over technology deployed and effective?" },
                    { id: "5.3", text: "Are control activities implemented through policies and procedures?" }
                ]
            },
            {
                id: "cc6",
                title: "Section 6: Logical and Physical Access Controls (CC6.0)",
                description: "This focuses on access to systems and data.",
                questions: [
                    { id: "6.1", text: "Are logical access controls implemented to protect systems and data (e.g., authentication, authorization)?" },
                    { id: "6.2", text: "Is user access provisioned, modified, and revoked appropriately?" },
                    { id: "6.3", text: "Are privileged access rights restricted and monitored?" },
                    { id: "6.4", text: "Is physical access to facilities and assets controlled (e.g., badges, logs)?" },
                    { id: "6.5", text: "Are assets protected from environmental threats and unauthorized removal?" },
                    { id: "6.6", text: "Is data-at-rest and in-transit protected (e.g., encryption)?" },
                    { id: "6.7", text: "Are endpoints and removable media secured?" },
                    { id: "6.8", text: "Are networks configured to prevent and detect unauthorized access?" }
                ]
            },
            {
                id: "cc7",
                title: "Section 7: System Operations (CC7.0)",
                description: "This addresses operational management and incident response.",
                questions: [
                    { id: "7.1", text: "Are anomalies and potential security events detected and analyzed?" },
                    { id: "7.2", text: "Is there an incident response process, including assessment and mitigation?" },
                    { id: "7.3", text: "Is system continuity managed through backups, recovery plans, and testing?" },
                    { id: "7.4", text: "Are capacity and performance monitored to ensure availability?" },
                    { id: "7.5", text: "Are environmental protections and maintenance in place for infrastructure?" }
                ]
            },
            {
                id: "cc8",
                title: "Section 8: Change Management (CC8.0)",
                description: "This covers controlled changes to systems.",
                questions: [
                    { id: "8.1", text: "Are changes authorized, designed, developed, tested, and deployed in a controlled manner?" }
                ]
            },
            {
                id: "cc9",
                title: "Section 9: Risk Mitigation (CC9.0)",
                description: "This evaluates vendor and business partner risks.",
                questions: [
                    { id: "9.1", text: "Are risks from vendors and partners identified, assessed, and mitigated?" },
                    { id: "9.2", text: "Are vendor performance and compliance monitored?" }
                ]
            },
            {
                id: "a1",
                title: "Section 10: Additional Criteria for Availability (A1.0)",
                description: "Apply if Availability TSC is in scope.",
                questions: [
                    { id: "10.1", text: "Is current processing capacity monitored and projected?" },
                    { id: "10.2", text: "Are recovery plans in place and tested for system failures?" },
                    { id: "10.3", text: "Are environmental protections implemented for availability?" }
                ]
            },
            {
                id: "pi1",
                title: "Section 11: Additional Criteria for Processing Integrity (PI1.0)",
                description: "Apply if Processing Integrity TSC is in scope.",
                questions: [
                    { id: "11.1", text: "Are system inputs complete, accurate, and timely?" },
                    { id: "11.2", text: "Is data processed completely, accurately, and timely?" },
                    { id: "11.3", text: "Are system outputs complete, accurate, and distributed appropriately?" },
                    { id: "11.4", text: "Are modifications to data controlled to maintain integrity?" },
                    { id: "11.5", text: "Is system processing monitored for integrity?" }
                ]
            },
            {
                id: "c1",
                title: "Section 12: Additional Criteria for Confidentiality (C1.0)",
                description: "Apply if Confidentiality TSC is in scope.",
                questions: [
                    { id: "12.1", text: "Is confidential information identified and protected during its lifecycle?" },
                    { id: "12.2", text: "Is confidential information disposed of securely when no longer needed?" }
                ]
            },
            {
                id: "p1",
                title: "Section 13: Additional Criteria for Privacy (P1.0 - P8.0)",
                description: "Apply if Privacy TSC is in scope. This is more extensive; summarized here.",
                questions: [
                    { id: "13.1", text: "Is personal information collected with notice and consent? (P2.0)" },
                    { id: "13.2", text: "Are choices provided for collection, use, and disclosure of personal info? (P3.0)" },
                    { id: "13.3", text: "Is personal information used consistent with commitments? (P4.0)" },
                    { id: "13.4", text: "Is collection of personal information limited to what's necessary? (P5.0)" },
                    { id: "13.5", text: "Are quality and accuracy of personal information maintained? (P6.0)" },
                    { id: "13.6", text: "Is access to personal information provided for review/correction? (P7.0)" },
                    { id: "13.7", text: "Is personal information secured and its integrity protected? (P8.0)" }
                ]
            }
        ]
    },
    "HIPAA": {
        id: "HIPAA",
        name: "HIPAA",
        description: "Health Insurance Portability and Accountability Act",
        steps: {
            scope: {
                title: "ePHI Environment Scope",
                subtitle: "Identify where Electronic Protected Health Information (ePHI) resides.",
                hints: {
                    orgBoundaries: "Are you a Covered Entity or a Business Associate?",
                    locations: "Facilities where patient data is accessed or stored.",
                    technologies: "EHR systems, medical devices, workstations, and transmission networks."
                },
                extraFields: [
                    {
                        type: "hipaa_entity_type",
                        label: "Organization Type",
                        options: [
                            { value: "covered_entity", label: "Covered Entity", description: "Healthcare providers, plans, and clearinghouses." },
                            { value: "business_associate", label: "Business Associate", description: "Vendors handling PHI on behalf of a covered entity." }
                        ]
                    }
                ]
            },
            stakeholders: {
                title: "HIPAA Privacy & Security Officers",
                subtitle: "Designate your required Privacy Officer and Security Officer."
            },
            documentation: {
                title: "HIPAA Compliance Documentation",
                subtitle: "Identify core administrative, physical, and technical safeguards documentation.",
                items: [
                    {
                        id: "SRA",
                        label: "Security Risk Analysis (SRA)",
                        description: "Mandatory enterprise-wide assessment of ePHI risks (§164.308(a)(1))."
                    },
                    {
                        id: "NPP",
                        label: "Notice of Privacy Practices (NPP)",
                        description: "Public disclosure of how health information is used and shared."
                    },
                    {
                        id: "BAA_Register",
                        label: "Business Associate Agreements (BAAs)",
                        description: "Contracts with vendors handling PHI/ePHI."
                    },
                    {
                        id: "Risk_Management_Plan",
                        label: "Risk Management Plan",
                        description: "Formal plan to mitigate risks identified in the SRA."
                    },
                    {
                        id: "Sanctions_Policy",
                        label: "Workforce Sanctions Policy",
                        description: "Disciplinary procedures for HIPAA violations."
                    },
                    {
                        id: "Contingency_Plan",
                        label: "Contingency & DR Plan",
                        description: "Data backup and emergency recovery procedures (§164.308(a)(7))."
                    },
                    {
                        id: "Breach_Notification",
                        label: "Breach Notification Procedures",
                        description: "Workflow for identifying and reporting breaches of unsecured PHI."
                    }
                ]
            }
        },
        questionnaire: [
            {
                id: "hipaa_gen",
                title: "Section 1: General Organizational Requirements",
                description: "This section evaluates general HIPAA compliance readiness, including roles and training.",
                questions: [
                    { id: "1.1", text: "Has your organization determined if it is a Covered Entity (health plan, clearinghouse, provider transmitting ePHI) or Business Associate?" },
                    { id: "1.2", text: "Has a HIPAA Privacy Officer and Security Officer been designated with clear responsibilities?" },
                    { id: "1.3", text: "Are workforce members (employees, contractors) trained annually on HIPAA policies, PHI handling, and breach reporting?" },
                    { id: "1.4", text: "Is there a sanctions policy for workforce violations of HIPAA?" },
                    { id: "1.5", text: "Are Business Associate Agreements (BAAs) in place with all vendors handling PHI/ePHI, including required provisions?" }
                ]
            },
            {
                id: "hipaa_privacy",
                title: "Section 2: Privacy Rule Requirements (Uses and Disclosures of PHI)",
                description: "This covers the core Privacy Rule requirements for handling PHI.",
                questions: [
                    { id: "2.1", text: "Is PHI used/disclosed only for treatment, payment, healthcare operations (TPO), or other permitted purposes without authorization?" },
                    { id: "2.2", text: "Is the Minimum Necessary standard applied to all uses, disclosures, and requests for PHI?" },
                    { id: "2.3", text: "Is a Notice of Privacy Practices (NPP) provided to individuals, posted, and updated (including any 2026 changes for SUD records or other)?" },
                    { id: "2.4", text: "Are individuals' rights supported: access to PHI, amendment, accounting of disclosures, restrictions, confidential communications?" },
                    { id: "2.5", text: "Are authorizations obtained for non-permitted uses/disclosures (e.g., marketing, sale of PHI)?" },
                    { id: "2.6", text: "Are uses/disclosures for public health, research, law enforcement, etc., handled per permitted exceptions?" },
                    { id: "2.7", text: "Is PHI de-identified when possible for non-regulated uses?" }
                ]
            },
            {
                id: "hipaa_admin",
                title: "Section 3: Security Rule – Administrative Safeguards (§164.308)",
                description: "This assesses the administrative side of the Security Rule.",
                questions: [
                    { id: "3.1", text: "Has a comprehensive, documented Security Risk Analysis (SRA) been conducted (enterprise-wide, updated periodically, e.g., annually)?" },
                    { id: "3.2", text: "Is there a risk management process to address identified risks/vulnerabilities (e.g., prioritized remediation plan)?" },
                    { id: "3.3", text: "Are workforce security measures in place (e.g., clearance procedures, termination processes)?" },
                    { id: "3.4", text: "Is information access management implemented (e.g., access authorization, establishment/modification)?" },
                    { id: "3.5", text: "Is security awareness and training provided (e.g., reminders, malicious software protection, log-in monitoring, password management)?" },
                    { id: "3.6", text: "Are security incident procedures defined (response, reporting)?" },
                    { id: "3.7", text: "Is a contingency plan in place (data backup, disaster recovery, emergency mode, testing/revision)?" },
                    { id: "3.8", text: "Is periodic technical/operational evaluation of security measures performed?" }
                ]
            },
            {
                id: "hipaa_physical",
                title: "Section 4: Security Rule – Physical Safeguards (§164.310)",
                description: "This evaluates physical protections for systems and facilities.",
                questions: [
                    { id: "4.1", text: "Are facility access controls implemented (e.g., contingency operations, security plan, access validation, maintenance records)?" },
                    { id: "4.2", text: "Are workstation use policies enforced (e.g., appropriate locations for viewing PHI)?" },
                    { id: "4.3", text: "Is workstation security in place (e.g., physical protections against unauthorized access)?" },
                    { id: "4.4", text: "Are device/media controls implemented (disposal, re-use, accountability, backup/storage)?" }
                ]
            },
            {
                id: "hipaa_technical",
                title: "Section 5: Security Rule – Technical Safeguards (§164.312)",
                description: "This assesses technical controls for ePHI.",
                questions: [
                    { id: "5.1", text: "Are access controls in place (unique user ID, emergency access, automatic logoff, encryption/decryption where appropriate)?" },
                    { id: "5.2", text: "Is audit control implemented (logging/monitoring system activity)?" },
                    { id: "5.3", text: "Are integrity mechanisms for ePHI in place (e.g., authentication of records)?" },
                    { id: "5.4", text: "Is person/entity authentication required (e.g., passwords, MFA as best practice/proposed requirement)?" },
                    { id: "5.5", text: "Is transmission security ensured (integrity controls, encryption for data in transit)?" }
                ]
            },
            {
                id: "hipaa_breach",
                title: "Section 6: Breach Notification Rule (§164.400–414)",
                description: "This evaluates readiness for detecting and reporting breaches.",
                questions: [
                    { id: "6.1", text: "Is there a process to detect, respond to, and investigate potential breaches of unsecured PHI?" },
                    { id: "6.2", text: "Are breaches analyzed for risk of harm (including to determine if notification required)?" },
                    { id: "6.3", text: "Are notifications made to affected individuals, HHS (via portal if >500), and media (if applicable) within required timelines (60 days max)?" },
                    { id: "6.4", text: "Do Business Associates report breaches to the Covered Entity without unreasonable delay?" }
                ]
            },
            {
                id: "hipaa_2026",
                title: "Section 7: Additional/ Emerging Requirements (2026 Considerations)",
                description: "This covers new and updated requirements for 2026.",
                questions: [
                    { id: "7.1", text: "Are policies/procedures written, reviewed, tested, and updated regularly (per proposed Security Rule updates)?" },
                    { id: "7.2", text: "Is encryption at rest and in transit implemented for ePHI (addressable but strongly recommended)?" },
                    { id: "7.3", text: "Is multi-factor authentication (MFA) required for systems accessing ePHI?" },
                    { id: "7.4", text: "Are special considerations in place for sensitive data (e.g., reproductive health, SUD records under aligned Part 2 rules)?" },
                    { id: "7.5", text: "Is vendor/third-party risk monitored, including BAAs and periodic assessments?" }
                ]
            }
        ]
    },
    "GDPR": {
        id: "GDPR",
        name: "GDPR",
        description: "General Data Protection Regulation",
        steps: {
            scope: {
                title: "Data Processing Scope",
                subtitle: "Map the flow of personal data of EU residents.",
                hints: {
                    orgBoundaries: "Which entities process personal data of EU subjects?",
                    locations: "Data processing locations (within and outside EEA).",
                    technologies: "Systems used for collection, storage, and processing of personal data."
                },
                extraFields: [
                    {
                        type: "gdpr_role",
                        label: "Data Processing Role",
                        options: [
                            { value: "controller", label: "Data Controller", description: "Determines purposes and means of processing." },
                            { value: "processor", label: "Data Processor", description: "Processes data on behalf of a controller." },
                            { value: "joint", label: "Joint Controller", description: "Determines purpose/means jointly with others." }
                        ]
                    }
                ]
            },
            stakeholders: {
                title: "DPO & Representatives",
                subtitle: "Appoint a Data Protection Officer (if required) and EU Representative.",
                roles: [
                    {
                        id: "dpo",
                        label: "Data Protection Officer (DPO)",
                        description: "Mandatory for large-scale processing of special categories or public bodies."
                    },
                    {
                        id: "eu_rep",
                        label: "EU Representative",
                        description: "Required for non-EU entities targeting EU subjects (Art. 27)."
                    },
                    {
                        id: "uk_rep",
                        label: "UK Representative",
                        description: "Required for non-UK entities targeting UK subjects post-Brexit."
                    },
                    {
                        id: "security_lead",
                        label: "IT Security Lead",
                        description: "Responsible for implementing technical security measures (Art. 32)."
                    },
                    {
                        id: "legal_lead",
                        label: "Privacy/Legal Counsel",
                        description: "Manages privacy notices, DPAs, and Art. 30 records."
                    }
                ]
            },
            documentation: {
                title: "GDPR Compliance Documentation",
                subtitle: "Collect mandatory privacy artifacts required for Art. 30 and transparency.",
                items: [
                    {
                        id: "ROPA",
                        label: "Records of Processing Activities (ROPA)",
                        description: "Mandatory log of all data processing per Art. 30."
                    },
                    {
                        id: "Privacy Notice",
                        label: "External Privacy Notice",
                        description: "Public-facing document detailing data subject rights."
                    },
                    {
                        id: "Cookie Policy",
                        label: "Cookie Policy & Notice",
                        description: "Notice for tracking technologies and legal basis."
                    },
                    {
                        id: "DPIA Methodology",
                        label: "DPIA Methodology/Reports",
                        description: "Framework for assessing high-risk processing (Art. 35)."
                    },
                    {
                        id: "DPA Templates",
                        label: "DPA/Vendor Templates",
                        description: "Standard templates for Art. 28 processor agreements."
                    },
                    {
                        id: "Subject Rights Procedure",
                        label: "Subject Access Request (SAR) Procedure",
                        description: "Internal workflow for handling Art. 12-22 requests."
                    },
                    {
                        id: "Data Retention Policy",
                        label: "Data Retention Schedule",
                        description: "Specific timelines for data deletion per Art. 5(1)(e)."
                    }
                ]
            }
        },
        questionnaire: [
            {
                id: "gdpr_gen",
                title: "Section 1: General & Accountability Requirements",
                description: "This section evaluates general GDPR readiness, roles, and governance.",
                questions: [
                    { id: "1.1", text: "Has your organization determined its role (controller, joint controller, processor) and that of third parties for all personal data processing?" },
                    { id: "1.2", text: "Has a Data Protection Officer (DPO) been appointed if required (e.g., large-scale processing of special categories, public authority, systematic monitoring)? If not required, is privacy accountability assigned?" },
                    { id: "1.3", text: "Is there a documented privacy governance framework (policies, procedures, training program) with regular reviews?" },
                    { id: "1.4", text: "Are workforce members trained on GDPR obligations, data protection principles, and handling personal data (initial + annual refreshers)?" },
                    { id: "1.5", text: "Is there a process for maintaining and updating Records of Processing Activities (ROPA/Art. 30) – including purposes, categories of data/subjects, recipients, transfers, retention, security measures?" }
                ]
            },
            {
                id: "gdpr_principles",
                title: "Section 2: Data Protection Principles (Art. 5)",
                description: "This covers the core principles of data protection under GDPR.",
                questions: [
                    { id: "2.1", text: "Is personal data processed lawfully, fairly, and transparently?" },
                    { id: "2.2", text: "Is processing limited to specified, explicit, legitimate purposes (purpose limitation)?" },
                    { id: "2.3", text: "Is only adequate, relevant, and limited personal data collected (data minimisation)?" },
                    { id: "2.4", text: "Is personal data accurate and kept up to date where necessary?" },
                    { id: "2.5", text: "Is personal data retained only as long as necessary for the purposes (storage limitation), with defined retention schedules and deletion processes?" },
                    { id: "2.6", text: "Are appropriate technical and organisational measures implemented to ensure integrity and confidentiality (security principle), including pseudonymisation/encryption where appropriate?" },
                    { id: "2.7", text: "Is accountability demonstrated through documentation, audits, and evidence of compliance efforts?" }
                ]
            },
            {
                id: "gdpr_lawful",
                title: "Section 3: Lawful Basis, Consent & Transparency",
                description: "This evaluates identify and documenting lawful bases for processing.",
                questions: [
                    { id: "3.1", text: "Has a lawful basis (Art. 6) been identified and documented for each processing activity (e.g., consent, contract, legitimate interests)?" },
                    { id: "3.2", text: "If consent is relied upon, is it freely given, specific, informed, unambiguous, easy to withdraw, and granular (with proof of consent)?" },
                    { id: "3.3", text: "For special category data (Art. 9) or criminal convictions, is an additional condition met and documented?" },
                    { id: "3.4", text: "Are privacy notices provided at collection (or soon after), containing required information (identity, purposes, basis, rights, recipients, transfers, etc.) in clear, concise language?" },
                    { id: "3.5", text: "For legitimate interests basis, has a Legitimate Interests Assessment (LIA) been conducted and balancing test documented?" }
                ]
            },
            {
                id: "gdpr_rights",
                title: "Section 4: Data Subject Rights (Arts. 12–23)",
                description: "This addresses the handling of data subject requests.",
                questions: [
                    { id: "4.1", text: "Is there a process to handle data subject requests (access, rectification, erasure, restriction, portability, objection, automated decision-making) within one month (extendable)?" },
                    { id: "4.2", text: "Are verification mechanisms in place for requester identity, and are requests logged/tracked?" },
                    { id: "4.3", text: "For right to erasure (\"right to be forgotten\"), is there a process to identify and delete data (including backups, third parties)?" },
                    { id: "4.4", text: "Is automated individual decision-making (including profiling) restricted, with safeguards (human intervention, right to contest)?" }
                ]
            },
            {
                id: "gdpr_design",
                title: "Section 5: Data Protection by Design & Default + DPIA (Arts. 25, 35)",
                description: "This evaluates proactive privacy measures and impact assessments.",
                questions: [
                    { id: "5.1", text: "Is privacy by design and by default embedded in processes, products, and services (e.g., minimal data collection, default privacy settings)?" },
                    { id: "5.2", text: "Are Data Protection Impact Assessments (DPIAs) conducted for high-risk processing (systematic monitoring, large-scale special data, innovative tech, etc.)?" },
                    { id: "5.3", text: "Are prior consultations with supervisory authority conducted if residual high risk remains after DPIA?" }
                ]
            },
            {
                id: "gdpr_sec_breach",
                title: "Section 6: Security & Breach Notification (Arts. 32–34)",
                description: "This assesses technical/organisational security and breach handling.",
                questions: [
                    { id: "6.1", text: "Are appropriate technical/organisational measures implemented (risk-based: pseudonymisation, encryption, resilience, restore capability, testing)?" },
                    { id: "6.2", text: "Is there a process to detect, report, and document personal data breaches (72-hour notification to supervisory authority if risk to rights/freedoms, unless low risk)?" },
                    { id: "6.3", text: "Are data subjects notified of breaches when high risk exists (without undue delay)?" }
                ]
            },
            {
                id: "gdpr_third_party",
                title: "Section 7: Processor & Third-Party Management (Arts. 28–29)",
                description: "This evaluates management of processors and third parties.",
                questions: [
                    { id: "7.1", text: "Are Data Processing Agreements (DPAs) in place with all processors, containing mandatory clauses (instructions, security, sub-processing approval, audits, etc.)?" },
                    { id: "7.2", text: "Are processors selected based on GDPR compliance guarantees, with ongoing monitoring?" }
                ]
            },
            {
                id: "gdpr_transfers",
                title: "Section 8: International Data Transfers (Chapter V)",
                description: "This assesses safeguards for cross-border data transfers.",
                questions: [
                    { id: "8.1", text: "For transfers outside EEA (or adequate countries), are safeguards in place (e.g., adequacy decision, SCCs 2021, BCRs, TIA for US tools post-Schrems II)?" },
                    { id: "8.2", text: "Are supplementary measures documented for transfers to assess and mitigate risks (e.g., encryption, pseudonymisation)?" }
                ]
            },
            {
                id: "gdpr_accountability",
                title: "Section 9: Additional/ Accountability Tools",
                description: "This covers additional tools for demonstrating GDR compliance.",
                questions: [
                    { id: "9.1", text: "Are codes of conduct or certifications used where appropriate to demonstrate compliance?" },
                    { id: "9.2", text: "Is there a process for regular internal/ external audits or reviews of GDPR compliance?" },
                    { id: "9.3", text: "Are data flows mapped (including vendors, tools, cloud services) and risks from emerging tech (e.g., AI) assessed?" }
                ]
            }
        ]
    },
    "NISTCSF": {
        id: "NISTCSF",
        name: "NIST CSF",
        description: "NIST Cybersecurity Framework",
        steps: {
            scope: {
                title: "Organizational Profile Scope",
                subtitle: "Define the critical infrastructure and business objectives.",
                hints: {
                    orgBoundaries: "Critical services and assets to be protected.",
                    locations: "Physical and logical asset locations.",
                    technologies: "IT and OT (Operational Technology) systems."
                },
                extraFields: [
                    {
                        type: "nist_tier",
                        label: "Target Implementation Tier",
                        options: [
                            { value: "tier1", label: "Tier 1: Partial", description: "Ad-hoc risk management." },
                            { value: "tier2", label: "Tier 2: Risk Informed", description: "Approved but informal practices." },
                            { value: "tier3", label: "Tier 3: Repeatable", description: "Formal, updated policies." },
                            { value: "tier4", label: "Tier 4: Adaptive", description: "Continuous improvement and adaptation." }
                        ]
                    }
                ]
            },
            stakeholders: {
                title: "Risk Management Team",
                subtitle: "Identify owners for Identify, Protect, Detect, Respond, Recover functions."
            }
        },
        questionnaire: [
            {
                id: "nist_gv",
                title: "Section 1: GOVERN (GV)",
                description: "This section addresses organizational context, risk management strategy, policies, and oversight.",
                questions: [
                    { id: "1.1", text: "Does the organization's cybersecurity strategy align with its overall business goals and objectives?" },
                    { id: "1.2", text: "Is an executive or specific individual formally designated and accountable for managing cyber risk?" },
                    { id: "1.3", text: "Are cybersecurity policies and procedures formally documented, approved, and communicated?" },
                    { id: "1.4", text: "Are roles, responsibilities, and authorities for cybersecurity clearly defined and assigned?" },
                    { id: "1.5", text: "Is there a process for managing cybersecurity supply chain risks associated with third parties?" },
                    { id: "1.6", text: "Does the organization have a method to measure and report on the performance of its cybersecurity program?" }
                ]
            },
            {
                id: "nist_id",
                title: "Section 2: IDENTIFY (ID)",
                description: "This focuses on understanding assets, risks, and impact on business objectives.",
                questions: [
                    { id: "2.1", text: "Does the organization maintain an up-to-date inventory of all hardware, software, and data assets?" },
                    { id: "2.2", text: "Is the criticality of each asset documented based on its importance to business operations?" },
                    { id: "2.3", text: "Are potential threats and vulnerabilities associated with assets regularly identified and documented?" },
                    { id: "2.4", text: "Has the organization conducted a Business Impact Analysis (BIA) to identify critical systems?" },
                    { id: "2.5", text: "Are cybersecurity risk assessments conducted regularly using a consistent methodology?" }
                ]
            },
            {
                id: "nist_pr",
                title: "Section 3: PROTECT (PR)",
                description: "This outlines safeguards implemented to limit the impact of potential cybersecurity events.",
                questions: [
                    { id: "3.1", text: "Are robust access controls, including Multi-Factor Authentication (MFA), implemented for critical systems?" },
                    { id: "3.2", text: "Does the organization provide regular security awareness training to all personnel?" },
                    { id: "3.3", text: "Are data encryption and Data Loss Prevention (DLP) measures effectively deployed?" },
                    { id: "3.4", text: "Are all systems and software regularly patched to address known vulnerabilities?" },
                    { id: "3.5", text: "Are protective technologies like firewalls and EDR solutions utilized and monitored?" },
                    { id: "3.6", text: "Are backups performed regularly and stored securely (offsite/immutable)?" }
                ]
            },
            {
                id: "nist_de",
                title: "Section 4: DETECT (DE)",
                description: "This focuses on discovering possible cybersecurity attacks and compromises timely.",
                questions: [
                    { id: "4.1", text: "Are there established processes for the timely detection of anomalies and security events?" },
                    { id: "4.2", text: "Does the organization use continuous monitoring and automated detection tools?" },
                    { id: "4.3", text: "Are detection processes regularly tested and evaluated for effectiveness?" },
                    { id: "4.4", text: "Is information about detected events promptly communicated to the response team?" }
                ]
            },
            {
                id: "nist_rs",
                title: "Section 5: RESPOND (RS)",
                description: "This details actions taken once an incident is detected to contain its effects.",
                questions: [
                    { id: "5.1", text: "Does the organization have a documented and regularly updated Incident Response Plan (IRP)?" },
                    { id: "5.2", text: "Are incidents formally tracked, documented, and analyzed (root cause analysis)?" },
                    { id: "5.3", text: "Are lessons learned from past incidents incorporated into procedures and training?" },
                    { id: "5.4", text: "Are clear communication protocols in place for internal and external stakeholders during an incident?" }
                ]
            },
            {
                id: "nist_rc",
                title: "Section 6: RECOVER (RC)",
                description: "This supports restoration of assets and operations affected by a cybersecurity event.",
                questions: [
                    { id: "6.1", text: "Are recovery processes established to ensure timely restoration of affected systems?" },
                    { id: "6.2", text: "Are the integrity and reliability of backups verified before restoration efforts begin?" },
                    { id: "6.3", text: "Are clear criteria established for when operations are considered fully restored?" },
                    { id: "6.4", text: "Is there a plan for communicating recovery status to stakeholders?" }
                ]
            }
        ]
    }
};
