export interface SAMMLevelDetail {
    level: number;
    description: string;
    criteria: string[];
    nextSteps: string[];
}

export interface SAMMPracticeDetail {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    businessImpact: string;
    relatedModule?: string;
    relatedPath?: string;
    standardLinks?: { name: string, url: string }[];
    levels: SAMMLevelDetail[];
}

export const SAMM_OFFICIAL_CONTENT: Record<string, SAMMPracticeDetail> = {
    "SM": {
        id: "SM",
        name: "Strategy & Metrics",
        shortDescription: "Establish and maintain a strategy for software security.",
        fullDescription: "Strategy & Metrics involves identifying the organization's risk appetite and establishing measurable security goals. This practice ensures that software security is managed as a strategic business function, with clear objectives and continuous improvement through data-driven insights.",
        businessImpact: "Aligns security spending with business risk. Reduces wasted effort on irrelevant security activities and provides clear ROI to stakeholders.",
        relatedModule: "Governance Dashboard",
        relatedPath: "/governance",
        levels: [
            {
                level: 0,
                description: "Practice not implemented.",
                criteria: [
                    "No formal software security strategy exists.",
                    "Security activities are reactive and ad-hoc.",
                    "No security metrics are tracked."
                ],
                nextSteps: [
                    "Identify organizational risk tolerance and high-level security drivers.",
                    "Draft an initial software security roadmap with clear 12-month goals.",
                    "Select small pilot projects to start tracking basic vulnerability counts."
                ]
            },
            {
                level: 1,
                description: "Initial understanding and ad hoc implementation.",
                criteria: [
                    "Basic security objectives are identified but not consistently measured.",
                    "Roadmap exists but lacks executive endorsement.",
                    "Metrics are focused on basic compliance (e.g., number of scans)."
                ],
                nextSteps: [
                    "Formalize the security strategy and obtain executive sign-off.",
                    "Define Key Performance Indicators (KPIs) linked to business risk.",
                    "Establish a recurring review cycle for the security roadmap."
                ]
            },
            {
                level: 2,
                description: "Structured and efficient practice across the organization.",
                criteria: [
                    "Unified strategy for application security is published and followed.",
                    "Roadmap is integrated with organizational growth objectives.",
                    "Basic metrics are used to influence tactical decisions."
                ],
                nextSteps: [
                    "Automate the collection of security metrics across all business units.",
                    "Correlate security metrics with asset value and business impact.",
                    "Publicly promote the security strategy to build a security culture."
                ]
            },
            {
                level: 3,
                description: "Optimized and continuously improving practice.",
                criteria: [
                    "Security strategy is a core part of organizational strategy.",
                    "Metrics are used to justify budget and strategic direction.",
                    "Continuous feedback loop from metrics to strategy refinement."
                ],
                nextSteps: [
                    "Benchmark your security program against industry peers.",
                    "Implement advanced predictive analytics for threat forecasting.",
                    "Continuously refine metrics to focus on ROI and risk reduction."
                ]
            }
        ]
    },
    "PC": {
        id: "PC",
        name: "Policy & Compliance",
        shortDescription: "Manage compliance with internal policies and external regulations.",
        fullDescription: "Policy & Compliance focuses on adhering to external legal and regulatory requirements (like GDPR, SOC 2, ISO 27001) while establishing internal security standards. It bridges the gap between legal requirements and technical implementation.",
        businessImpact: "Minimizes legal liability and avoid multi-million dollar fines for non-compliance. Streamlines audit preparation and builds trust with regulated customers.",
        relatedModule: "Policies Hub",
        relatedPath: "/policies",
        levels: [
            {
                level: 0,
                description: "Practice not implemented.",
                criteria: [
                    "No documented security policies.",
                    "Compliance is managed only when an audit is imminent.",
                    "Lack of awareness regarding relevant regulations."
                ],
                nextSteps: [
                    "Catalog all relevant regulations (GDPR, PCI-DSS, etc.) affecting the business.",
                    "Download and customize standard security policy templates.",
                    "Designate a compliance lead for the application security domain."
                ]
            },
            {
                level: 1,
                description: "Initial understanding and ad hoc implementation.",
                criteria: [
                    "Security baseline representing policies and standards is documented.",
                    "Third-party compliance requirements are identified.",
                    "Policies exist but are seldom updated or enforced."
                ],
                nextSteps: [
                    "Establish application-specific security baselines for high-risk systems.",
                    "Map existing technical controls to regulatory requirements.",
                    "Distribute policies to all development teams and require acknowledgment."
                ]
            },
            {
                level: 2,
                description: "Structured and efficient practice across the organization.",
                criteria: [
                    "Security requirements are standardized for all applications.",
                    "A library of test guidance exists to verify regulatory compliance.",
                    "Compliance is checked at major milestones in the SDLC."
                ],
                nextSteps: [
                    "Implement automated policy-as-code checks in CI/CD pipelines.",
                    "Develop standardized test scripts for recurring compliance checks.",
                    "Conduct annual reviews to reduce compliance scope and cost."
                ]
            },
            {
                level: 3,
                description: "Optimized and continuously improving practice.",
                criteria: [
                    "Adherence to policies is measured and reported in real-time.",
                    "Compliance reports are generated automatically for auditors.",
                    "Policies are dynamically updated based on emerging threat intelligence."
                ],
                nextSteps: [
                    "Integrate real-time compliance dashboards for executive visibility.",
                    "Automate the mapping between multiple frameworks to eliminate duplicate effort.",
                    "Enable continuous auditing capabilities across the entire cloud estate."
                ]
            }
        ]
    },
    "EG": {
        id: "EG",
        name: "Education & Guidance",
        shortDescription: "Build security knowledge and skills across the organization.",
        fullDescription: "Education & Guidance ensures that all personnel involved in the software lifecycle are equipped with the knowledge needed to build secure software. It encompasses training, awareness programs, and technical guidance.",
        businessImpact: "Turns every developer into a security asset. Reduces the volume of critical vulnerabilities by as much as 50% through 'Security by Design' education.",
        relatedModule: "Learning Zone",
        relatedPath: "/learning",
        levels: [
            {
                level: 0,
                description: "Practice not implemented.",
                criteria: [
                    "No security training for developers or staff.",
                    "Security guidance is only provided during critical failures.",
                    "No central repository for security best practices."
                ],
                nextSteps: [
                    "Identify core security training needs for developers.",
                    "Create a 'security basics' onboarding document for new hires.",
                    "Set up a dedicated internal wiki for security resources."
                ]
            },
            {
                level: 1,
                description: "Initial understanding and ad hoc implementation.",
                criteria: [
                    "Some staff have attended generic security training.",
                    "Ad-hoc security awareness sessions are held occasionally.",
                    "Basic security guidance is available for common vulnerabilities (OWASP Top 10)."
                ],
                nextSteps: [
                    "Formalize a security training curriculum for different roles (Dev, Ops, QA).",
                    "Establish a 'Security Champions' pilot program.",
                    "Implement automated 'lunch and learns' on modern appsec topics."
                ]
            },
            {
                level: 2,
                description: "Structured and efficient practice across the organization.",
                criteria: [
                    "Security training is mandatory for all members of the development team.",
                    "Security Champions program is active across most product teams.",
                    "Role-specific training is customized to the organization's tech stack."
                ],
                nextSteps: [
                    "Develop internal 'Capture the Flag' (CTF) events to gamify learning.",
                    "Establish a formal process for developers to request technical security guidance.",
                    "Measure the effectiveness of training through reduction in coding defects."
                ]
            },
            {
                level: 3,
                description: "Optimized and continuously improving practice.",
                criteria: [
                    "Training is tailored to specific project needs and emerging threats.",
                    "Security Champions are respected mentors who lead external research.",
                    "A culture of security excellence where security is a shared pride."
                ],
                nextSteps: [
                    "Contribute technical security guidance back to the open-source community.",
                    "Implement advanced certifications for internal security experts.",
                    "Use AI to provide contextual security training within the IDE."
                ]
            }
        ]
    },
    "TA": {
        id: "TA",
        name: "Threat Assessment",
        shortDescription: "Identify and understand software-related threats.",
        fullDescription: "Threat Assessment focuses on identifying project-level risks based on software functionality and its runtime environment. This proactive approach helps in prioritizing security efforts where they matter most.",
        businessImpact: "Prevents high-impact breaches by identifying attack vectors before they are exploited, reducing emergency patch costs and protecting brand reputation.",
        relatedModule: "Risk Register",
        relatedPath: "/risks",
        standardLinks: [
            { name: "OWASP Threat Modeling Project", url: "https://owasp.org/www-project-threat-modeling/" }
        ],
        levels: [
            {
                level: 0,
                description: "No formal threat assessment.",
                criteria: ["Threats are only considered after an incident.", "No application risk profiles exist.", "Development teams are unaware of their specific threat landscape."],
                nextSteps: ["Perform a high-level risk classification for all existing applications.", "Train leads on basic 'brainstorming' threat modeling techniques.", "Create a simple inventory of external-facing touchpoints (APIs, UIs)."]
            },
            {
                level: 1,
                description: "Best-effort identification of high-level threats.",
                criteria: ["High-level application risk profiles are documented for major projects.", "Ad-hoc threat modeling is performed for new features.", "Basic understanding of attack surface is established."],
                nextSteps: ["Standardize the application risk profiling process across the org.", "Adopt a formal threat modeling methodology (e.g., STRIDE).", "Tools: Implement a lightweight threat modeling tool to assist developers."]
            },
            {
                level: 2,
                description: "Standardized enterprise-wide threat analysis.",
                criteria: ["Risk profiles are maintained for all software assets.", "Structured threat modeling is integrated into the design phase of all projects.", "Threat data is used to prioritize security testing."],
                nextSteps: ["Automate the link between threat models and security test cases.", "Perform cross-application threat analysis to find systemic patterns.", "Establish a central threat library for the organization."]
            },
            {
                level: 3,
                description: "Proactive and continuously improved threat coverage.",
                criteria: ["Threat models are dynamically updated based on live threat intelligence.", "Risk profiles include third-party and supply chain threats.", "Threat assessments drive the entire security strategy."],
                nextSteps: ["Implement 'Threat Modeling as Code' to keep models in sync with deployments.", "Correlate production monitoring with threat model assumptions.", "Engage in industry threat-sharing communities (e.g., ISACs)."]
            }
        ]
    },
    "SR": {
        id: "SR",
        name: "Security Requirements",
        shortDescription: "Specify security requirements for software development.",
        fullDescription: "Security Requirements involves explicitly defining the security behavior and constraints of the software. It moves beyond generic 'be secure' statements to specific, testable requirements.",
        businessImpact: "Saves up to 60% of rework costs by catching security needs during the requirements phase rather than fixing them in production or late-stage testing.",
        relatedModule: "Policies Hub",
        relatedPath: "/policies",
        standardLinks: [
            { name: "OWASP ASVS", url: "https://owasp.org/www-project-application-security-verification-standard/" }
        ],
        levels: [
            {
                level: 0,
                description: "Security requirements are implicit or generic.",
                criteria: ["Requirements focus only on functionality.", "Security is treated as a 'non-functional' afterthought.", "Vendor/Partner security requirements are ignored."],
                nextSteps: ["Include basic security clauses in project initiation documents.", "Identify standard security requirements (AuthN, AuthZ, Logging).", "Establish a 'Definition of Ready' that includes basic security checks."]
            },
            {
                level: 1,
                description: "Explicit security considerations during requirements.",
                criteria: ["Security requirements are documented for most new projects.", "Standard security requirements are selected from a central list.", "Basic abuse cases are identified."],
                nextSteps: ["Develop a library of reusable security requirements and user stories.", "Integrate security requirements into the project management tool (e.g., Jira).", "Formalize security requirements for third-party components/suppliers."]
            },
            {
                level: 2,
                description: "Granular requirements derived from business logic.",
                criteria: ["Specific security requirements are tailored to business logic and data sensitivity.", "Security requirements include detailed data protection and privacy rules.", "Suppliers are audited against security requirements."],
                nextSteps: ["Automate the generation of security requirements based on application risk level.", "Implement automated verification of requirements during QA.", "Conduct 'Abuse Case' workshops for all high-risk business processes."]
            },
            {
                level: 3,
                description: "Mandated and comprehensive security requirements.",
                criteria: ["Every project has a complete, validated set of security requirements.", "Requirements cover the entire lifecycle, including decommissioning.", "Continuous auditing ensures requirements stay relevant."],
                nextSteps: ["Enable 'Policy-as-Code' to enforce requirements in production environments.", "Use feedback from incidents to automatically update the requirement library.", "Achieve 100% requirements-driven security verification coverage."]
            }
        ]
    },
    "SA": {
        id: "SA",
        name: "Security Architecture",
        shortDescription: "Design security into software and its environment.",
        fullDescription: "Security Architecture focuses on the secure design of components, services, and technology stacks. It aims to build security in by default through architectural patterns and hardened foundations.",
        businessImpact: "Reduces systemic risk by at least 40% through secure-by-default patterns, making individual developer mistakes less likely to lead to catastrophic failure.",
        relatedModule: "Risk Register",
        relatedPath: "/risks",
        standardLinks: [
            { name: "OWASP ASVS (V1)", url: "https://owasp.org/www-project-application-security-verification-standard/" }
        ],
        levels: [
            {
                level: 0,
                description: "Security is not considered in architectural design.",
                criteria: ["Architectures are built based on performance and 'getting it to work'.", "No security design principles are applied.", "Tech stack is chosen without security evaluation."],
                nextSteps: ["Adopt a basic set of security design principles (e.g., Least Privilege).", "Catalog all technology stacks and identify known 'weak' components.", "Start performing security reviews of high-level architectural diagrams."]
            },
            {
                level: 1,
                description: "Incorporate proactive security guidance into design.",
                criteria: ["Security principles are applied to high-level designs.", "The technology stack is reviewed for major security risks.", "Basic security services (e.g., identity providers) are identified."],
                nextSteps: ["Establish a set of 'Golden Images' or secure baseline templates.", "Define standard security patterns for common architectural problems.", "Create a 'Safe Tech' list for developers to choose from."]
            },
            {
                level: 2,
                description: "Guide software design towards known secure services.",
                criteria: ["Secure-by-default design patterns are mandatory for new services.", "Centralized security services are used throughout the org.", "Architecture reviews include 'Deep Dive' components analysis."],
                nextSteps: ["Establish a formal Architecture Review Board with security representation.", "Implement automated architecture drift detection.", "Modularize security functions into reusable libraries or sidecars."]
            },
            {
                level: 3,
                description: "Formally controlled and validated utilization of secure components.",
                criteria: ["Reference architectures are used for all development.", "The use of non-standard technology is formally exceptioned.", "Continuous evaluation of architecture effectiveness is performed."],
                nextSteps: ["Integrate security architecture validation into the CI/CD pipeline.", "Achieve zero-trust architecture across all internal and external services.", "Contribute back to industry-standard secure architecture patterns."]
            }
        ]
    },
    "SB": {
        id: "SB",
        name: "Secure Build",
        shortDescription: "Ensure the security and integrity of the build process.",
        fullDescription: "Secure Build focuses on creating a reliable and reproducible build process that ensures the integrity of the software. It involves managing dependencies and automating security checks during the build as part of the CI/CD pipeline.",
        businessImpact: "Protects the software supply chain. Prevents attackers from injecting malicious code into your product, which could lead to massive downstream liability and loss of customer trust.",
        relatedModule: "Supply Chain (SCVS)",
        relatedPath: "/assurance/scvs",
        standardLinks: [
            { name: "OpenSSF OSPS (Supply Chain Hygiene)", url: "https://openssf.org/projects/osps-baseline/" },
            { name: "OWASP SCVS (Supply Chain Technical)", url: "https://scvs.owasp.org/" }
        ],
        levels: [
            {
                level: 0,
                description: "Build process is manual or insecure.",
                criteria: ["Builds are performed on developer machines.", "No formal dependency management.", "Secrets (APIs, keys) are stored in source code."],
                nextSteps: ["Migrate all builds to a centralized build server.", "Start using a package manager with a lockfile for all dependencies.", "Scan code for secrets and move them to environment variables."]
            },
            {
                level: 1,
                description: "Centralized and basic automated build process.",
                criteria: ["All builds occur on an automated build server.", "Dependencies are defined and scanned for known vulnerabilities.", "Basic build integrity is maintained via source control."],
                nextSteps: ["Implement 'Fail-on-High' vulnerability policies in the build pipeline.", "Automate the signing of build artifacts.", "Establish a private artifact repository for internal dependencies."]
            },
            {
                level: 2,
                description: "Hardened build process with integrated security tools.",
                criteria: ["The build pipeline is isolated and hardened.", "Software Composition Analysis (SCA) is mandatory for all builds.", "Build artifacts are digitally signed and verified."],
                nextSteps: ["Implement build-time 'bill of materials' (SBOM) generation.", "Achieve reproducible builds (same source leads to same binary).", "Restrict build server access to the absolute minimum required."]
            },
            {
                level: 3,
                description: "Optimized and highly secure build ecosystem.",
                criteria: ["Builds occur in ephemeral, per-build environments.", "Dependency pinning and hashing are strictly enforced.", "The build process itself is continuously monitored for tampering."],
                nextSteps: ["Enforce 'Attestations' for all build steps in the supply chain.", "Implement 100% automated dependency updates with security verification.", "Achieve a 'Hermetic Build' environment (no network access during build)."]
            }
        ]
    },
    "SD": {
        id: "SD",
        name: "Secure Deployment",
        shortDescription: "Ensure the security of software deployment.",
        fullDescription: "Secure Deployment ensures that software is deployed to production in a secure manner, with proper configuration management and automated security verification in the deployment pipeline.",
        businessImpact: "Eliminates 'configuration drift'—the #1 cause of cloud breaches. Ensures that security controls designed in Dev are actually active in Prod.",
        relatedModule: "Supply Chain (SCVS)",
        relatedPath: "/assurance/scvs",
        standardLinks: [
            { name: "OpenSSF OSPS (Supply Chain Hygiene)", url: "https://openssf.org/projects/osps-baseline/" },
            { name: "OWASP SCVS (Supply Chain Technical)", url: "https://scvs.owasp.org/" }
        ],
        levels: [
            {
                level: 0,
                description: "Deployments are manual and ad-hoc.",
                criteria: ["Manual file transfers to production servers.", "No automated configuration validation.", "Production access is broad and shared."],
                nextSteps: ["Adopt an automated deployment tool (e.g., Jenkins, GitHub Actions).", "Document a basic deployment checklist.", "Implement basic centralized logging for deployment events."]
            },
            {
                level: 1,
                description: "Automated deployment with basic security checks.",
                criteria: ["Deployment is scripted and automated.", "Basic configuration secrets are managed via a vault.", "Deployment logs are recorded and accessible."],
                nextSteps: ["Implement 'Infrastructure as Code' (IaC) for all environment changes.", "Use automated smoke tests to verify security configuration after deploy.", "Restrict production access to authorized personnel only."]
            },
            {
                level: 2,
                description: "Standardized secure deployment pipeline.",
                criteria: ["Deployments are 100% automated via CI/CD.", "Security configuration is validated against baselines before deployment.", "The principle of least privilege is applied to deployment accounts."],
                nextSteps: ["Implement 'Canary' or 'Blue/Green' deployments with security monitoring.", "Automate the revocation of temporary deployment credentials.", "Scan IaC templates for security misconfigurations (e.g., open S3 buckets)."]
            },
            { level: 3, description: "Highly automated and continuously verified deployment.", criteria: ["Deployments are triggered and verified automatically by policy.", "Immutable infrastructure is used (no manual changes in Prod).", "Real-time drift detection automatically reverts non-compliant changes."], nextSteps: ["Achieve 100% automated security gates in the deployment pipeline.", "Implement 'GitOps' to ensure the environment exactly matches source control.", "Use AI to detect anomalous deployment patterns."] }
        ]
    },
    "DM": {
        id: "DM",
        name: "Defect Management",
        shortDescription: "Manage security defects effectively.",
        fullDescription: "Defect Management focuses on tracking, prioritizing, and remediating security vulnerabilities identified through various testing and monitoring activities.",
        businessImpact: "Improves remediation speed by up to 3x, ensuring that critical vulnerabilities are closed before attackers can find them. Provides clear visibility into security ROI.",
        levels: [
            {
                level: 0,
                description: "Security defects are handled ad-hoc.",
                criteria: ["Vulnerabilities are tracked in spreadsheets or email.", "No formal prioritization logic.", "Remediation is best-effort and often delayed."],
                nextSteps: ["Consolidate all security findings into a single tracking system (e.g., Jira).", "Define a basic severity scale (Critical, High, Medium, Low).", "Establish initial SLAs for fixing 'Critical' vulnerabilities (e.g., 7 days)."]
            },
            {
                level: 1,
                description: "Formal tracking and prioritization of security defects.",
                criteria: ["Defects are tracked in a centralized system.", "Prioritization is based on risk and business impact.", "Monthly reports on remediation status are provided to management."],
                nextSteps: ["Implement automated vulnerability ingestion from scanners.", "Publicize security fix SLAs and track compliance against them.", "Conduct basic 'Root Cause Analysis' for critical recurring defects."]
            },
            {
                level: 2,
                description: "Structured defect management with feedback loops.",
                criteria: ["Remediation SLAs are strictly enforced and tracked.", "Root Cause Analysis (RCA) is performed for all high-severity defects.", "Defect trends are used to improve developer training and policies."],
                nextSteps: ["Establish a 'Security Debt' budget and management process.", "Automate the assignment of defects to the relevant dev teams.", "Implement a 'Vulnerability Rewards' (Bug Bounty) program."]
            },
            {
                level: 3,
                description: "Optimized and proactive defect reduction.",
                criteria: ["Defect management is fully integrated into the SDLC.", "Proactive defect removal prevents vulnerabilities from reaching production.", "Continuous improvement driven by advanced defect analytics."],
                nextSteps: ["Use AI to predict high-risk code areas based on historical defect data.", "Achieve 100% SLA compliance across the entire organization.", "Integrate defect data into real-time business risk dashboards."]
            }
        ]
    },
    "AR": {
        id: "AR",
        name: "Architecture Review",
        shortDescription: "Verify the security of software architecture.",
        fullDescription: "Architecture Review (also known as Architecture Assessment) ensures that the application design and its underlying infrastructure meet security requirements and adequately mitigate identified threats.",
        businessImpact: "Identifies systemic design flaws that automated tools miss. Prevents the deployment of inherently insecure architectures that would be prohibitively expensive to fix later.",
        levels: [
            {
                level: 0,
                description: "No formal architecture reviews.",
                criteria: ["Architecture is reviewed only for performance/scale.", "Security is assumed to be handled by the cloud provider.", "No documented security architecture checklist."],
                nextSteps: ["Perform a high-level review of the top 3 most critical applications.", "Establish a basic 'Security Architecture Checklist' for reviewers.", "Identify the key technology components in the current architecture."]
            },
            { level: 1, description: "Ad-hoc or best-effort architecture reviews.", criteria: ["Critical projects undergo a high-level security architecture review.", "Reviews focus on baseline mitigations for known risks.", "Major architectural components are identified and documented."], nextSteps: ["Formalize the architecture review process for all 'High Risk' projects.", "Train a small group of architects as 'Security Champions' for reviews.", "Use a standardized template for architecture review findings."] },
            { level: 2, description: "Structured and complete architecture reviews.", criteria: ["Architecture reviews are mandatory for all significant changes.", "All security mechanisms are validated for effectiveness.", "Review results are tracked and remediation is verified."], nextSteps: ["Automate the discovery of architectural components for review.", "Establish a central library of approved security architectural patterns.", "Feed review results into the organizational design principles."] },
            { level: 3, description: "Continuous and optimized architecture assessment.", criteria: ["Architecture is continuously monitored for compliance with security patterns.", "Reviews leverage advanced modeling and simulation.", "Feedback loops improve the organization's reference architectures."], nextSteps: ["Implement automated 'Architecture-as-Code' validation.", "Use data from production incidents to refine architecture review criteria.", "Achieve real-time visibility into the security posture of the entire architecture."] }
        ]
    },
    "ER": {
        id: "ER",
        name: "Requirements Driven Verification",
        shortDescription: "Verify software against security requirements.",
        fullDescription: "Requirements Driven Verification (or Requirements-driven Testing) ensures that the implemented security controls operate as expected and satisfy the defined security requirements.",
        businessImpact: "Ensures 'Security ROI' by confirming that the specific controls you paid for are actually working. Prevents 'Security Theatre' where controls exist but are ineffective.",
        relatedModule: "Audit Hub",
        relatedPath: "/audit-hub",
        standardLinks: [
            { name: "OWASP ASVS (Web Requirements)", url: "https://owasp.org/www-project-application-security-verification-standard/" },
            { name: "OWASP MASVS (Mobile Requirements)", url: "https://owasp.org/www-project-mobile-app-security/" },
            { name: "OWASP SCVS (Supply Chain Requirements)", url: "https://scvs.owasp.org/" },
            { name: "OWASP AISVS (AI Security Requirements)", url: "https://owasp.org/www-project-ai-security-verification-standard/" }
        ],
        levels: [
            {
                level: 0,
                description: "Security requirements are not verified.",
                criteria: ["Verification focuses only on functional correctness.", "No dedicated security test cases exist.", "Testing is mostly manual and ad-hoc."],
                nextSteps: ["Identify one critical security requirement and create a test case for it.", "Review standard functional tests to see if they can include security checks.", "Start documenting manual security test results."]
            },
            { level: 1, description: "Testing for standard security controls.", criteria: ["Standard security controls (AuthN, AuthZ) are tested.", "Basic security test cases are documented for most projects.", "Security fuzzing is used on an ad-hoc basis."], nextSteps: ["Derive test cases directly from security requirements for all new features.", "Implement basic automated security unit tests for core functions.", "Establish a baseline set of security regression tests."] },
            { level: 2, description: "Structured verification based on requirements.", criteria: ["Security test cases are derived from all documented security requirements.", "Misuse and abuse cases are systematically tested.", "Automated regression testing includes security controls."], nextSteps: ["Automate security test execution as part of the CI/CD pipeline.", "Perform 'Business Logic' abuse testing on all high-risk modules.", "Conduct periodic 'Security Stress Testing' for critical services."] },
            { level: 3, description: "Optimized and regressions-focused verification.", criteria: ["Security unit tests are mandatory for all code changes.", "Denial of Service (DoS) and stress testing are performed regularly.", "Continuous verification of security requirements in production."], nextSteps: ["Implement 'Testing as Code' for 100% of security requirements.", "Use AI to generate complex abuse cases based on historic incident data.", "Integrate verification results into real-time compliance dashboards."] }
        ]
    },
    "ST": {
        id: "ST",
        name: "Security Testing",
        shortDescription: "Perform security testing throughout the lifecycle.",
        fullDescription: "Security Testing involves uncovering technical implementation weaknesses and business logic flaws through a combination of automated (SAST, DAST) and manual (Pen-testing) approaches.",
        businessImpact: "Uncovers 90%+ of implementation-level vulnerabilities before they are shipped. Dramatically reduces the risk of successful exploitation in production.",
        relatedModule: "Audit Hub",
        relatedPath: "/audit-hub",
        standardLinks: [
            { name: "OWASP WSTG (Web Testing Guide)", url: "https://owasp.org/www-project-web-security-testing-guide/" },
            { name: "OWASP MASTG (Mobile Testing Guide)", url: "https://owasp.org/www-project-mobile-app-security/" }
        ],
        levels: [
            {
                level: 0,
                description: "Security testing is rare or late-stage only.",
                criteria: ["Testing is performing only once per year for compliance.", "No automated security scanning tools are used.", "Developers don't see security test results."],
                nextSteps: ["Run a basic automated vulnerability scan (DAST) on your main app.", "Integrate a Static Analysis (SAST) tool into the dev workflow.", "Perform a manual 'point-in-time' penetration test."]
            },
            { level: 1, description: "Automated baseline security testing.", criteria: ["Automated testing tools (SAST/DAST) are used on all projects.", "Security testing is performed before every major release.", "Manual testing is conducted for high-risk components."], nextSteps: ["Integrate automated security scanning into the CI/CD build process.", "Establish a 'Minimum Security Baseline' for automated scan results.", "Train developers to interpret and fix automated scan findings."] },
            { level: 2, description: "Comprehensive and integrated security testing.", criteria: ["Application-specific testing automation is fully implemented.", "Manual penetration testing complements automated scans.", "Security testing results are integrated into a central dashboard."], nextSteps: ["Implement 'Interactivce ST' (IAST) for real-time feedback during dev.", "Establish a 'Continuous Red Teaming' or 'Bug Bounty' program.", "Perform deep manual testing for all complex business logic changes."] },
            { level: 3, description: "Embedded and continuously improving testing.", criteria: ["Security testing is a native part of the development process.", "Testing focus is shifted to advanced and project-specific attack vectors.", "Feedback from production monitoring is used to refine test cases."], nextSteps: ["Achieve 100% 'Shift Left'—90% of defects found before commit.", "Use AI for automated 'Fuzzing' and complex payload generation.", "Automate the entire security testing lifecycle from discovery to fix."] }
        ]
    },
    "IM": {
        id: "IM",
        name: "Incident Management",
        shortDescription: "Respond to and manage security incidents.",
        fullDescription: "Incident Management addresses activities aimed at improving an organization's detection of and response to security incidents affecting their software products and services.",
        businessImpact: "Reduces the duration and impact of a breach (MTTD/MTTR). Minimizes legal liability and customer churn following a security event.",
        relatedModule: "Cyber Hub",
        relatedPath: "/cyber",
        levels: [
            {
                level: 0,
                description: "No formal incident response process.",
                criteria: ["Incidents are handled ad-hoc by IT.", "No dedicated security monitoring.", "Incident post-mortems are not documented."],
                nextSteps: ["Identify a dedicated 'Incident Response' lead.", "Establish a basic high-level incident response plan.", "Ensure basic logging is enabled for all production systems."]
            },
            { level: 1, description: "Best-effort incident detection and handling.", criteria: ["A high-level incident response strategy is documented.", "Log data is available for investigations.", "Basic contact points for security incidents are established."], nextSteps: ["Define specific 'Playbooks' for common incident types (e.g., Data Leak).", "Implement automated log evaluation for suspicious patterns.", "Establish a formal incident reporting channel for users."] },
            { level: 2, description: "Formal incident management process.", criteria: ["A formal incident management process is in place and periodically tested.", "Root Cause Analysis (RCA) is performed for all incidents.", "Log evaluation is automated and includes application-level events."], nextSteps: ["Conduct annual incident response 'Tabletop' exercises.", "Integrate incident data with the software defect management process.", "Implement real-time alerting for critical security events."] },
            { level: 3, description: "Proactive and mature incident management.", criteria: ["Incident detection is reliable and timely (near real-time).", "Proactive 'Red Team' exercises at least annually.", "Continuous improvement of response playbooks based on exercises."], nextSteps: ["Automate common incident response actions (e.g., account locking).", "Enable AI-driven anomaly detection for incident forecasting.", "Achieve industry-leading MTTR benchmarks for security events."] }
        ]
    },
    "EM": {
        id: "EM",
        name: "Environment Management",
        shortDescription: "Manage the security of the operating environment.",
        fullDescription: "Environment Management focuses on ensuring the security of the operational environment where applications reside, including server hardening and patch management.",
        businessImpact: "Prevents exploitation of known vulnerabilities in the OS and framework. Ensures that 'the house' the application lives in is secure.",
        levels: [
            {
                level: 0,
                description: "Environment security is ad-hoc.",
                criteria: ["Manual patching of servers.", "No environment hardening baselines.", "Shared credentials used for environment access."],
                nextSteps: ["Identify all components in the production environment.", "Establish an initial hardening baseline for servers/containers.", "Schedule a recurring 'Patch Tuesday' for all critical components."]
            },
            { level: 1, description: "Best-effort patching and hardening.", criteria: ["Environment components are patched on a prioritized best-effort basis.", "Hardening is performed manually using a checklist.", "Basic environment configuration is monitored."], nextSteps: ["Automate the patching process for 80% of server components.", "Use a configuration management tool to enforce hardening baselines.", "Implement centralized logging for all environment-level events."] },
            { level: 2, description: "Formal environment management with baselines.", criteria: ["Formal hardening baselines and guidelines are available for all tech.", "Patching covers the full stack and follows an SLA.", "Automated configuration validation is performed regularly."], nextSteps: ["Implement 'Scanning as Code' for all production infrastructure.", "Automate the detection and remediation of configuration drift.", "Achieve 'Least Privilege' at the infrastructure layer (e.g., via IAM)."] },
            { level: 3, description: "Optimized and enforced environmental security.", criteria: ["Non-conformities with hardening baselines are handled automatically.", "Consolidated update process with real-time reporting.", "Continuous improvement of environment security based on data."], nextSteps: ["Achieve 100% 'Immutable Infrastructure' for the production environment.", "Use AI to optimize patch schedules based on threat and vulnerability data.", "Enable real-time environment-wide security health monitoring."] }
        ]
    },
    "OM": {
        id: "OM",
        name: "Operational Management",
        shortDescription: "Maintain security during software operations.",
        fullDescription: "Operational Management ensures that security is maintained throughout operational support functions, including data protection and legacy system management.",
        businessImpact: "Protects sensitive customer data from internal and external abuse. Ensures that end-of-life software doesn't become a 'backdoor' for attackers.",
        levels: [
            {
                level: 0,
                description: "Operational security is not formalized.",
                criteria: ["Data protection is based on developer assumptions.", "Legacy systems are kept 'forever' just in case.", "No decommissioning process for applications."],
                nextSteps: ["Identify all applications and their 'Criticality' level.", "Create a 'Data Map' to locate where sensitive information is stored.", "Establish a basic 'System Decommissioning' checklist."]
            },
            { level: 1, description: "Foundational operational security practices.", criteria: ["Basic data protection practices are in place.", "Legacy apps are decommissioned as they are identified.", "Customer data is managed with basic privacy considerations."], nextSteps: ["Develop a formal 'Data Catalog' and protection policy.", "Establish repeatable decommissioning processes.", "Implement basic data masking for non-production environments."] },
            { level: 2, description: "Managed and responsive operational processes.", criteria: ["A data catalog and protection policy are active across the org.", "Repeatable decommissioning/legacy migration roadmaps exist.", "GDPR/Privacy considerations are integrated into all operations."], nextSteps: ["Automate the detection of policy non-compliance in data storage.", "Perform regular audits of the data catalog and decommissioning status.", "Implement advanced data loss prevention (DLP) across all apps."] },
            { level: 3, description: "Active monitoring and optimized operations.", criteria: ["Data policy compliance is monitored and audited in real-time.", "Proactive management of migration roadmaps for EOL dependencies.", "Continuous improvement of operational security based on metrics."], nextSteps: ["Achieve 100% automated PII discovery and protection.", "Eliminate all unsupported legacy dependencies across the enterprise.", "Use AI to optimize data management and identify 'dark data' risks."] }
        ]
    }
};

export const GET_SAMM_DETAILS = (id: string): SAMMPracticeDetail | undefined => {
    return SAMM_OFFICIAL_CONTENT[id];
};
