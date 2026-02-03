
export const PLANNING_PROMPTS = {
    ISO27001: (context: string) => `
    You are an expert ISO 27001 Lead Implementer. 
    Create a detailed implementation plan for ISO 27001:2022 for the following organization:
    ${context}

    The plan MUST follow these 4 Phases (PDCA):
    1. Plan (Clauses 4-6): Context, Leadership, Planning, Risk Assessment.
    2. Do (Clauses 7-8): Support, Operation, Controls Implementation.
    3. Check (Clause 9): Monitoring, Internal Audit, Management Review.
    4. Act (Clause 10): Improvement, Corrective Actions.

    For each phase, provide:
    - Key Steps/Tasks (Title and Description)
    - Deliverables
    - Estimated Duration
    - Specific Annex A Controls to focus on (if applicable)

    Use this structure for the output JSON:
    {
      "phases": [
        {
          "name": "Plan",
          "order": 1,
          "description": "Preparation and Risk Assessment",
          "tasks": [
            { "title": "...", "description": "...", "duration": "...", "deliverables": ["..."] }
          ]
        }
        ...
      ]
    }
  `,

    SOC2: (context: string) => `
    You are a SOC 2 expert auditor.
    Create a SOC 2 Type II readiness plan for the following organization:
    ${context}

    The plan MUST be structured by Trust Services Criteria (TSC) implementation maturity:
    1. Gap Analysis & Scoping (Maturity Level 1)
    2. Policy & Procedure Development (Maturity Level 2)
    3. Control Implementation (Security, Availability, etc.) (Maturity Level 3)
    4. Operational Effectiveness & Observation Period (Maturity Level 4)
    5. Audit Window (Maturity Level 5)

    Focus on the Security Criteria (Common Criteria) plus any others mentioned in context.
    
    Output JSON format similar to ISO 27001.
  `,

    GDPR: (context: string) => `
    You are a Data Privacy Officer (DPO) consultant.
    Create a GDPR compliance roadmap:
    ${context}

    Phases:
    1. Discovery & Data Mapping (Article 30 ROPA)
    2. Assessment (DPIA, Legitimate Interest)
    3. Implementation (Privacy Notices, Consent, DSR process)
    4. Governance (DPO, Breach Notification protocol)

    Output JSON format.
  `,
    NISTCSF: (context: string) => `
    You are a NIST CSF 2.0 expert.
    Create a Cybersecurity Framework (CSF) implementation plan for the following organization:
    ${context}

    The plan MUST follow the NIST CSF 2.0 Core Functions:
    1. Govern (GV): Establish and monitor organization's cybersecurity risk management strategy.
    2. Identify (ID): Help determine the current cybersecurity risk.
    3. Protect (PR): Use safeguards to prevent or reduce the likelihood and impact of events.
    4. Detect (DE): Provide activities which help find cybersecurity events.
    5. Respond (RS): Take action once a cybersecurity event is detected.
    6. Recover (RC): Restoration of activities or services.

    Output JSON format similar to ISO 27001.
  `,
    HARMONIZED: (frameworks: string[], context: string) => `
    You are a GRC Architect.
    Create a harmonized implementation plan for: ${frameworks.join(", ")}.
    Organization Context: ${context}

    Identify overlapping requirements and consolidate them into a unified efficiency plan.
    Highlight "Harmonized Tasks" where one action satisfies multiple frameworks.

    Output JSON format.
  `,
    HIPAA: (context: string) => `
    You are a HIPAA Compliance Officer.
    Create a HIPAA readiness and implementation plan for:
    ${context}

    The plan MUST follow the PDCA (Plan-Do-Check-Act) logic specifically defined for HIPAA:
    1. PLAN: Establish objectives, policies, and risk assessments (§164.308(a)(1)). Designate officers, develop Privacy Rule policies (§164.500–528), and contingency plans.
    2. DO: Implement safeguards (§164.308-312). Workforce training, physical access controls, technical safeguards (encryption, audit controls), and privacy operations.
    3. CHECK: Monitor, evaluate, and audit. Periodic technical/non-technical evaluations (§164.308(a)(8)), system activity reviews, and breach detection.
    4. ACT: Continuous improvement, remediation of gaps from audits, and policy updates based on incident root cause analysis.

    Output JSON format similar to ISO 27001.
  `,
    PCIDSS: (context: string) => `
    You are a PCI QSA (Qualified Security Assessor).
    Create a PCI DSS 4.0 implementation and ROC (Report on Compliance) readiness plan for:
    ${context}

    The plan MUST follow the PDCA (Plan-Do-Check-Act) logic specifically defined for PCI DSS 4.0:
    1. PLAN: Establish scope, asset inventory (Req 1), Targeted Risk Analysis (TRA), policies (Req 12), and secure configuration standards (Req 2).
    2. DO: Implement network security (Req 1), protect account data (Req 3-4), vulnerability management (Req 5-6), and access controls/MFA (Req 7-9).
    3. CHECK: Monitor and test (Req 10-11). Logging, quarterly ASV scans, annual pen testing, and periodic control effectiveness reviews.
    4. ACT: Remediate gaps, address vulnerabilities within SLAs, update policies/TRAs based on test results, and strengthen controls post-incident.

    Output JSON format similar to ISO 27001.
  `,
    DORA: (context: string) => `
    You are a DORA (Digital Operational Resilience Act) implementation expert for the financial sector.
    Create a DORA operational resilience and compliance plan for:
    ${context}

    The plan MUST follow the PDCA (Plan-Do-Check-Act) logic specifically defined for DORA:
    1. PLAN: Establish objectives, policies, governance (Art 5), ICT risk framework (Art 6), and third-party risk strategy (Art 28-30).
    2. DO: Implement controls, operationalize incident reporting (Art 17-23), execute resilience testing (Art 24-27), and manage third-party oversight (Art 28-44).
    3. CHECK: Monitor, measure, and audit (Art 6). Evaluation of testing results, incident root cause analysis, and third-party monitoring results.
    4. ACT: Take corrective actions and ensure continuous improvement (Art 6) of the framework.

    Output JSON format similar to ISO 27001.
  `,
};

export const SYSTEM_TEMPLATES = {
    ISO27001: {
        phases: [
            {
                name: "Plan",
                order: 1,
                description: "Focus on preparation, gap analysis, and planning (Clauses 4-6).",
                tasks: [
                    {
                        title: "Gain Management Support and Form a Team",
                        description: "Secure executive buy-in. Appoint project leader and cross-functional team.",
                        deliverables: ["Executive commitment letter", "Team charter", "Project plan"],
                        estimatedHours: 40
                    },
                    {
                        title: "Understand Standard and Perform Gap Analysis",
                        description: "Review ISO 27001:2022 structure. Assess current policies against Annex A controls.",
                        deliverables: ["Gap analysis report", "Context documentation"],
                        estimatedHours: 80
                    },
                    {
                        title: "Define ISMS Scope and Risk Methodology",
                        description: "Outline assets and locations. Choose qualitative/quantitative risk assessment method.",
                        deliverables: ["Scope statement", "Risk assessment methodology"],
                        estimatedHours: 40
                    },
                    {
                        title: "Conduct Initial Risk Assessment",
                        description: "Identify assets, threats, vulnerabilities. Evaluate risks.",
                        deliverables: ["Risk register", "Risk treatment options"],
                        estimatedHours: 100
                    }
                ]
            },
            {
                name: "Do",
                order: 2,
                description: "Implement the ISMS per Clauses 7-8 (support and operation).",
                tasks: [
                    {
                        title: "Develop Policies and Procedures",
                        description: "Create ISP, Access Control Policy. Implement Annex A controls.",
                        deliverables: ["ISP", "SoA", "Risk Treatment Plan"],
                        estimatedHours: 120
                    },
                    {
                        title: "Implement Controls and Processes",
                        description: "Deploy organizational, people, physical, and technological measures.",
                        deliverables: ["Implemented controls", "Operational procedures"],
                        estimatedHours: 160
                    },
                    {
                        title: "Launch Awareness and Training Programs",
                        description: "Train all staff on security principles.",
                        deliverables: ["Training materials", "Attendance records"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Check",
                order: 3,
                description: "Evaluate effectiveness per Clause 9.",
                tasks: [
                    {
                        title: "Conduct Internal Audit",
                        description: "Plan and perform audit to check compliance.",
                        deliverables: ["Audit plan", "Audit report"],
                        estimatedHours: 80
                    },
                    {
                        title: "Perform Management Review",
                        description: "Review ISMS performance with leadership.",
                        deliverables: ["Management review minutes"],
                        estimatedHours: 20
                    }
                ]
            },
            {
                name: "Act",
                order: 4,
                description: "Improve and certify per Clause 10.",
                tasks: [
                    {
                        title: "Address Non-Conformities",
                        description: "Analyze root causes and implement corrective actions.",
                        deliverables: ["Corrective action plans"],
                        estimatedHours: 40
                    },
                    {
                        title: "Prepare for Certification Audit",
                        description: "Select certification body, conduct pre-audit checks.",
                        deliverables: ["Audit-ready documentation"],
                        estimatedHours: 60
                    },
                    {
                        title: "Achieve Certification",
                        description: "Undergo external audit and address findings.",
                        deliverables: ["ISO 27001 certificate"],
                        estimatedHours: 40
                    }
                ]
            }
        ]
    },
    NISTCSF: {
        phases: [
            {
                name: "Govern",
                order: 1,
                description: "Establish and monitor the organization's cybersecurity risk management strategy, expectations, and policy.",
                tasks: [
                    {
                        title: "Establish Cybersecurity Governance Structure",
                        description: "Define roles, responsibilities, and authorities for cybersecurity risk management.",
                        deliverables: ["Governance Charter", "Roles & Responsibilities Matrix"],
                        estimatedHours: 40
                    },
                    {
                        title: "Develop Cybersecurity Strategy & Policy",
                        description: "Create a core cybersecurity strategy aligned with organizational goals.",
                        deliverables: ["Cybersecurity Strategy Document", "Master Policy Document"],
                        estimatedHours: 60
                    }
                ]
            },
            {
                name: "Identify",
                order: 2,
                description: "Determine the current cybersecurity risk to the organization's physical and software assets.",
                tasks: [
                    {
                        title: "Asset Inventory & Scoping",
                        description: "Identify systems, people, assets, data, and capabilities that enable the organization to achieve business purposes.",
                        deliverables: ["Data Flow Diagrams", "Asset Register"],
                        estimatedHours: 80
                    },
                    {
                        title: "Cybersecurity Risk Assessment",
                        description: "Identify and prioritize risks to assets and business functions.",
                        deliverables: ["Risk Assessment Report", "Prioritized Mitigation List"],
                        estimatedHours: 100
                    }
                ]
            },
            {
                name: "Protect",
                order: 3,
                description: "Develop and implement appropriate safeguards to ensure delivery of critical services.",
                tasks: [
                    {
                        title: "Identity Management & Access Control",
                        description: "Establish physical and logical access controls to protected assets.",
                        deliverables: ["IAM Policy", "Access Matrix"],
                        estimatedHours: 120
                    },
                    {
                        title: "Data Security Controls",
                        description: "Implement encryption, data loss prevention, and integrity protection measures.",
                        deliverables: ["Encryption Standards", "DLP Configuration"],
                        estimatedHours: 160
                    }
                ]
            },
            {
                name: "Detect",
                order: 4,
                description: "Develop and implement appropriate activities to identify the occurrence of a cybersecurity event.",
                tasks: [
                    {
                        title: "Continuous Security Monitoring",
                        description: "Monitor information assets and networks for security events.",
                        deliverables: ["SIEM Configuration", "Monitoring Logs"],
                        estimatedHours: 80
                    },
                    {
                        title: "Detection Process Verification",
                        description: "Test and evaluate detection processes to ensure timely alerts.",
                        deliverables: ["Alert Accuracy Report"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Respond",
                order: 5,
                description: "Develop and implement appropriate activities to take action regarding a detected cybersecurity incident.",
                tasks: [
                    {
                        title: "Incident Response Planning",
                        description: "Ensure response processes are tested and personnel are trained.",
                        deliverables: ["IRP Plan", "Tabletop Exercise Results"],
                        estimatedHours: 60
                    },
                    {
                        title: "Containment & Mitigation Strategy",
                        description: "Implement procedures to contain and mitigate the impact of events.",
                        deliverables: ["Containment Playbooks"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Recover",
                order: 6,
                description: "Develop and implement appropriate activities to maintain plans for resilience and to restore any capabilities or services that were impaired due to a cybersecurity incident.",
                tasks: [
                    {
                        title: "Resilience & Recovery Planning",
                        description: "Maintain recovery processes and procedures to ensure restoration of systems.",
                        deliverables: ["BCP/DR Plan", "Recovery Time Objectives (RTO) documentation"],
                        estimatedHours: 60
                    }
                ]
            }
        ]
    },
    HIPAA: {
        phases: [
            {
                name: "Plan",
                order: 1,
                description: "Establish objectives, policies, risk assessments, and the compliance framework to protect PHI.",
                tasks: [
                    {
                        title: "Security Risk Analysis & Management (§164.308(a)(1))",
                        description: "Conduct accurate & thorough assessments of potential risks and vulnerabilities to ePHI.",
                        deliverables: ["Risk Assessment Report", "Security Management Plan"],
                        estimatedHours: 60
                    },
                    {
                        title: "Designate HIPAA Officers & Planning",
                        description: "Appoint Security and Privacy Officers. Develop workforce training and contingency plans.",
                        deliverables: ["Officer Appointment Letters", "Training Strategy"],
                        estimatedHours: 40
                    },
                    {
                        title: "Develop HIPAA Privacy & Security Policies (§164.316)",
                        description: "Create Notice of Privacy Practices, policies for uses/disclosures, and patient rights.",
                        deliverables: ["Privacy & Security Policy Repository", "Notice of Privacy Practices (NPP)"],
                        estimatedHours: 80
                    },
                    {
                        title: "Business Associate Agreements (BAAs) Strategy",
                        description: "Define policies for identifying and managing Business Associates (BAs) and exit strategies.",
                        deliverables: ["BAA Templates", "Vendor Inventory"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Do",
                order: 2,
                description: "Implement the safeguards, processes, and controls defined in the Plan phase.",
                tasks: [
                    {
                        title: "Deploy Administrative Safeguards (§164.308)",
                        description: "Execute workforce training, sanctions policy, and information system activity review.",
                        deliverables: ["Training Completion Records", "Sanction Policy"],
                        estimatedHours: 80
                    },
                    {
                        title: "Implement Physical & Technical Safeguards (§164.310-312)",
                        description: "Deploy access controls, workstation security, audit controls, and encryption (transit/rest).",
                        deliverables: ["Access Matrix", "Encryption Configuration Audit"],
                        estimatedHours: 120
                    },
                    {
                        title: "Operationalize Privacy Rule Operations (§164.500+)",
                        description: "Handle patient requests (access, amendment) and accounting of disclosures.",
                        deliverables: ["Patient Request Log", "Disclosure Accounting Records"],
                        estimatedHours: 60
                    },
                    {
                        title: "Execute Breach Investigation & Notification (§164.400)",
                        description: "Operationalize breach investigation, mitigation, and notification protocols.",
                        deliverables: ["Breach Response Workflow", "Incident Logs"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Check",
                order: 3,
                description: "Monitor, evaluate, audit, and test the effectiveness of implemented safeguards.",
                tasks: [
                    {
                        title: "Periodic Technical & Non-Technical Evaluations (§164.308(a)(8))",
                        description: "Perform evaluations in response to environmental or operational changes (annual review).",
                        deliverables: ["Evaluation Summary Report", "Compliance Gap List"],
                        estimatedHours: 60
                    },
                    {
                        title: "System Activity Review & Audit Controls (§164.312(b))",
                        description: "Regularly review audit logs from systems containing ePHI to detect anomalies.",
                        deliverables: ["Audit Log Review Reports", "Anomaly Detection Logs"],
                        estimatedHours: 40
                    },
                    {
                        title: "Internal Compliance Audits & Workforce Sanctions Review",
                        description: "Review workforce compliance with policies and enforce sanctions where necessary.",
                        deliverables: ["Internal Audit Findings", "Sanction Action Records"],
                        estimatedHours: 40
                    },
                    {
                        title: "KPI & Privacy Metrics Tracking",
                        description: "Monitor training completion rates, access violations, and breach trends.",
                        deliverables: ["Compliance Performance Dashboard"],
                        estimatedHours: 20
                    }
                ]
            },
            {
                name: "Act",
                order: 4,
                description: "Take corrective actions and ensure continuous improvement of the HIPAA framework.",
                tasks: [
                    {
                        title: "Corrective Action Planning (CAP) & Remediation",
                        description: "Remediate weaknesses and gaps identified during technical evaluations and audits.",
                        deliverables: ["Remediation Roadmap", "Corrective Action Log"],
                        estimatedHours: 60
                    },
                    {
                        title: "Update Risk Management & Policies",
                        description: "Refine policies, procedures, and risk assessments based on audit findings and new threats.",
                        deliverables: ["Updated Risk Assessment", "Policy Revision History"],
                        estimatedHours: 40
                    },
                    {
                        title: "Refine Breach Response & Training Programmes",
                        description: "Optimize response playbooks and training curriculum based on lessons learned from PIRs.",
                        deliverables: ["Optimized Training Curriculum", "Updated PIR Process"],
                        estimatedHours: 20
                    }
                ]
            }
        ]
    },
    PCIDSS: {
        phases: [
            {
                name: "Plan",
                order: 1,
                description: "Establish objectives, scope, risk assessments, and policies to protect account data.",
                tasks: [
                    {
                        title: "CDE Scoping & Asset Inventory (Requirement 1)",
                        description: "Define the Cardholder Data Environment (CDE), connected systems, and perform annual scope confirmation.",
                        deliverables: ["CDE Scope Map", "System Inventory"],
                        estimatedHours: 40
                    },
                    {
                        title: "Targeted Risk Analysis (TRA - v4.0 Requirement)",
                        description: "Perform risk-based analyses for frequency of controls such as vulnerability scans and penetration testing.",
                        deliverables: ["TRA Report", "Control Frequency Schedule"],
                        estimatedHours: 60
                    },
                    {
                        title: "Develop PCI Security Policies & Procedures (Req 12)",
                        description: "Create and disseminate security policies addressing all 12 requirements; assign explicit roles and responsibilities.",
                        deliverables: ["Master Security Policy", "Roles & Responsibilities Matrix"],
                        estimatedHours: 80
                    },
                    {
                        title: "Define Secure Configuration Standards (Req 2)",
                        description: "Establish hardening standards and policies for removing vendor-default settings and secure protocols.",
                        deliverables: ["System Hardening Standards", "Baseline Configuration Documents"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Do",
                order: 2,
                description: "Implement and operate the security controls, processes, and measures defined in the framework.",
                tasks: [
                    {
                        title: "Implement Network Security & Segmentation (Req 1)",
                        description: "Deploy firewalls and network security controls (NSCs) to isolate the CDE from untrusted networks.",
                        deliverables: ["Firewall Ruleset", "Network Segregation Verification"],
                        estimatedHours: 80
                    },
                    {
                        title: "Protect Stored & Transmitted Account Data (Req 3-4)",
                        description: "Implement encryption (TLS), masking, and tokenization for both stored data and data in transit.",
                        deliverables: ["Encryption Audit Report", "Data Protection Logs"],
                        estimatedHours: 120
                    },
                    {
                        title: "Vulnerability Management & Secure Development (Req 5-6)",
                        description: "Deploy anti-malware, secure software development practices, and apply security patches regularly.",
                        deliverables: ["Patching Logs", "Secure Coding Guidelines"],
                        estimatedHours: 100
                    },
                    {
                        title: "Strong Access Control & MFA Implementation (Req 7-9)",
                        description: "Restrict access based on least privilege, enforce unique IDs, and implement MFA for all access to the CDE.",
                        deliverables: ["Access Control Matrix", "MFA Confirmation Reports"],
                        estimatedHours: 60
                    }
                ]
            },
            {
                name: "Check",
                order: 3,
                description: "Monitor, measure, test, and evaluate the effectiveness of the implemented PCI controls.",
                tasks: [
                    {
                        title: "Logging, Monitoring & Daily Reviews (Req 10)",
                        description: "Implement comprehensive logging and automated alerts; perform daily reviews of critical security logs.",
                        deliverables: ["Log Management Strategy", "Daily Review Records"],
                        estimatedHours: 80
                    },
                    {
                        title: "Vulnerability Scans & Penetration Testing (Req 11)",
                        description: "Perform quarterly ASV scans (external) and internal scans; conduct annual penetration testing.",
                        deliverables: ["ASV Scan Reports", "Internal Pen Test Results"],
                        estimatedHours: 100
                    },
                    {
                        title: "Periodic Reviews & TRA Updates",
                        description: "Re-perform targeted risk analyses after major changes and review overall control effectiveness.",
                        deliverables: ["Updated TRA Documentation", "Control Effectiveness Review"],
                        estimatedHours: 40
                    },
                    {
                        title: "Internal Audit & SAQ/ROC Preparation",
                        description: "Conduct self-assessments or internal audits to prepare for formal compliance reporting.",
                        deliverables: ["Completed SAQ/Draft ROC", "Compliance Evidence Collection"],
                        estimatedHours: 60
                    }
                ]
            },
            {
                name: "Act",
                order: 4,
                description: "Take corrective actions, remediate gaps, and continuously improve the security program.",
                tasks: [
                    {
                        title: "Vulnerability Remediation & Feedback Loop",
                        description: "Address vulnerabilities within defined SLAs and remediate penetration testing findings.",
                        deliverables: ["Remediation Roadmap", "Vulnerability Fix Confirmation"],
                        estimatedHours: 60
                    },
                    {
                        title: "Strengthen Controls Post-Incident (Lessons Learned)",
                        description: "Enhance monitors and controls based on post-incident reviews or identified security weaknesses.",
                        deliverables: ["Updated IRP Playbooks", "Lessons Learned Summary"],
                        estimatedHours: 40
                    },
                    {
                        title: "Continuous Governance & Program Refinement",
                        description: "Update policies, training, and governance processes based on findings from the Check phase.",
                        deliverables: ["Framework Optimization Plan", "Policy Version Records"],
                        estimatedHours: 20
                    }
                ]
            }
        ]
    },
    DORA: {
        phases: [
            {
                name: "Plan",
                order: 1,
                description: "Establish objectives, policies, governance, and framework for ICT risk and resilience.",
                tasks: [
                    {
                        title: "Governance & Accountability Framework (Art. 5)",
                        description: "Define management body oversight, roles, responsibilities, and accountability for the ICT risk management framework.",
                        deliverables: ["ICT Governance Charter", "Role Designation Documents"],
                        estimatedHours: 40
                    },
                    {
                        title: "ICT Risk Management Strategy (Art. 6)",
                        description: "Establish a comprehensive, documented framework for identifying, assessing, and mitigating ICT risks proportional to the entity.",
                        deliverables: ["ICT Risk Framework Document", "Policy Repository"],
                        estimatedHours: 80
                    },
                    {
                        title: "Risk Identification & Assessment Methodology",
                        description: "Perform Business Impact Analysis (BIA) and risk classification for all critical business functions.",
                        deliverables: ["BIA Report", "Risk Classification Standards"],
                        estimatedHours: 60
                    },
                    {
                        title: "ICT Third-party Risk Strategy (Art. 28-30)",
                        description: "Define policies for identifying critical providers, risk assessments, and exit/contingency strategies.",
                        deliverables: ["Third-party Risk Policy", "Provider Criticality Matrix"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Do",
                order: 2,
                description: "Implement and operate the ICT controls, processes, and measures defined in the framework.",
                tasks: [
                    {
                        title: "Incident Classification & SLA Reporting (Art. 17-23)",
                        description: "Operationalize incident classification and reporting workflows for authorities (e.g., ≤4 hours initial notify).",
                        deliverables: ["Incident Response Workflow", "SLA Reporting Log"],
                        estimatedHours: 60
                    },
                    {
                        title: "Digital Operational Resilience Testing (Art. 24-27)",
                        description: "Execute the resilience testing programme, including vulnerability assessments and TLPT (if required).",
                        deliverables: ["Testing Results Summary", "Vulnerability Scan Logs"],
                        estimatedHours: 100
                    },
                    {
                        title: "ICT Third-party Oversight active (Art. 28-44)",
                        description: "Implement due diligence, mandatory contract clauses, and the Register of Information on all providers.",
                        deliverables: ["Master Register of Providers", "DORA-Compliant Clauses"],
                        estimatedHours: 80
                    },
                    {
                        title: "Operational Backup & Business Continuity",
                        description: "Deploy and test backup/recovery procedures and ICT business continuity plans for critical systems.",
                        deliverables: ["Recovery Verification Reports", "DR Test Summary"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Check",
                order: 3,
                description: "Monitor, audit, and evaluate the effectiveness of implemented ICT risk measures.",
                tasks: [
                    {
                        title: "Independent Internal Audit of ICT Framework (Art. 6)",
                        description: "Perform a comprehensive independent review of the ICT risk management framework’s effectiveness.",
                        deliverables: ["Audit Report", "Compliance Findings Log"],
                        estimatedHours: 80
                    },
                    {
                        title: "Resilience Testing Results Evaluation (Art. 25)",
                        description: "Analyze outcomes of basic and advanced (TLPT) testing to identify resilience gaps.",
                        deliverables: ["Gap Analysis Report", "TLPT Evaluation Summary"],
                        estimatedHours: 40
                    },
                    {
                        title: "Incident Root Cause & Lessons Learned",
                        description: "Perform post-incident reviews (PIRs) for major ICT-related incidents to extract improvements.",
                        deliverables: ["PIR Logs", "Lessons Learned Report"],
                        estimatedHours: 20
                    },
                    {
                        title: "Ongoing Third-party Monitoring & Provider Audit",
                        description: "Monitor third-party performance indicators and conduct periodic audits of critical ICT providers.",
                        deliverables: ["Provider Performance Scorecard"],
                        estimatedHours: 40
                    }
                ]
            },
            {
                name: "Act",
                order: 4,
                description: "Take corrective actions and ensure continuous improvement based on monitoring results.",
                tasks: [
                    {
                        title: "Continuous ICT Framework Improvement (Art. 6)",
                        description: "Refine and update the ICT risk management framework based on audit, test, and incident results.",
                        deliverables: ["Framework Update Log", "Optimized Risk Controls"],
                        estimatedHours: 60
                    },
                    {
                        title: "Remediation of Identified Weaknesses & Gaps",
                        description: "Assign and track corrective actions stemming from audits, tests, and PIR findings.",
                        deliverables: ["Remediation Roadmap", "Corrective Action Log"],
                        estimatedHours: 40
                    },
                    {
                        title: "Update Contracts & Third-party Strategy",
                        description: "Adjust provider relationships, exit strategies, and contractual clauses based on oversight findings.",
                        deliverables: ["Updated Provider Strategy"],
                        estimatedHours: 20
                    }
                ]
            }
        ]
    }
};
