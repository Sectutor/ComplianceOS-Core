export type E8LevelDetail = {
  level: number;
  description: string;
  criteria: string[];
  nextSteps: string[];
  relatedModule?: string;
  relatedPath?: string;
  businessImpact?: string;
  standardLinks?: { name: string; url: string }[];
};

export type E8ControlContent = {
  id: string;
  name: string;
  fullDescription: string;
  levels: E8LevelDetail[];
};

export const ESSENTIAL_EIGHT_OFFICIAL_CONTENT: Record<string, E8ControlContent> = {
  "Application Control": {
    id: "Application Control",
    name: "Application Control",
    fullDescription:
      "Only approved applications may execute, to prevent untrusted or malicious code. Includes whitelisting, code signing enforcement, and control over script interpreters.",
    levels: [
      {
        level: 0,
        description: "No effective application allow-listing. Users can run arbitrary software.",
        criteria: [
          "Unrestricted execution of binaries and scripts",
          "No centralized policy for application trust",
        ],
        nextSteps: [
          "Inventory business-required applications",
          "Pilot allow-listing in a small cohort",
        ],
        standardLinks: [{ name: "Essential Eight", url: "https://www.cyber.gov.au/essential-eight" }],
      },
      {
        level: 1,
        description: "Basic allow-listing for key systems. Exceptions handled ad hoc.",
        criteria: [
          "Policy-based allow-list for high-risk endpoints",
          "Controls on script interpreters (e.g., PowerShell, macros) for non-admins",
        ],
        nextSteps: [
          "Expand allow-listing coverage",
          "Introduce code signing enforcement for enterprise binaries",
        ],
      },
      {
        level: 2,
        description: "Organization-wide allow-listing with signed binaries and controlled scripts.",
        criteria: [
          "Code signing enforced for enterprise apps",
          "Script execution restricted to approved, signed scripts",
        ],
        nextSteps: [
          "Automate exception workflows with audit logging",
          "Periodic review of approved lists",
        ],
      },
      {
        level: 3,
        description: "Continuous improvement with centralized policy, monitoring and exception governance.",
        criteria: [
          "Central policy with automated deployment",
          "Exception registry with expiry and review",
        ],
        nextSteps: [
          "Integrate telemetry with SIEM",
          "Quarterly validation of allow-list effectiveness",
        ],
      },
    ],
  },
  "Patch Applications": {
    id: "Patch Applications",
    name: "Patch Applications",
    fullDescription:
      "Rapidly patch and update applications to remediate known vulnerabilities. Includes asset discovery, vulnerability scanning, and time-bound patch SLAs.",
    levels: [
      {
        level: 0,
        description: "Limited visibility of application vulnerabilities; patching is reactive.",
        criteria: [
          "No automated asset discovery",
          "Infrequent or manual vulnerability scanning",
        ],
        nextSteps: [
          "Deploy automated asset discovery (≥ fortnightly)",
          "Introduce a vulnerability scanner with up-to-date database",
        ],
        standardLinks: [
          {
            name: "Essential Eight Maturity Model",
            url: "https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model",
          },
        ],
      },
      {
        level: 1,
        description: "Foundational scanning and patching cadence for common applications.",
        criteria: [
          "Weekly scanning for office productivity, browsers, email, PDF, security products",
          "Fortnightly scanning for other applications",
        ],
        nextSteps: [
          "Daily scanning for online services",
          "Define critical vs non-critical patch SLAs",
        ],
      },
      {
        level: 2,
        description: "Time-bound patch SLAs enforced, with priority based on exploitability.",
        criteria: [
          "Critical online service vulnerabilities patched within 48 hours or vendor mitigations applied",
          "Non-critical online service vulnerabilities patched within two weeks if no working exploits",
        ],
        nextSteps: [
          "Track SLA adherence and exceptions",
          "Automate rollout with staged rings",
        ],
      },
      {
        level: 3,
        description:
          "Comprehensive coverage and continuous scanning with maturity tracking across all applications.",
        criteria: [
          "48-hour SLA for critical office-app/browser/email/PDF/security product vulnerabilities",
          "Two-week SLA for non-critical office-app/browser/email/PDF/security product vulnerabilities",
          "Monthly patching for other applications",
        ],
        nextSteps: [
          "Integrate exploit intel to preemptively prioritize",
          "Quarterly audit of asset discovery and coverage",
        ],
      },
    ],
  },
  "Configure Macro Settings": {
    id: "Configure Macro Settings",
    name: "Configure Macro Settings",
    fullDescription:
      "Reduce risk from malicious macros by configuring restrictive defaults and signed macro policies.",
    levels: [
      {
        level: 0,
        description: "Macros allowed by default; weak controls on unsigned content.",
        criteria: ["No enterprise macro policy", "Users can enable macros freely"],
        nextSteps: ["Disable macros by default", "Block unsigned or internet-origin macros"],
      },
      {
        level: 1,
        description: "Default-disabled macros with limited exceptions.",
        criteria: ["Macros disabled by default", "Trusted locations and signed macros allowed"],
        nextSteps: ["Centralize policy deployment", "Audit macro usage"],
      },
      {
        level: 2,
        description: "Enterprise-wide signed macro enforcement.",
        criteria: ["Only signed macros allowed", "Exception workflow for business need"],
        nextSteps: ["Periodic review of signatures and issuers", "User training on macro risks"],
      },
      {
        level: 3,
        description: "Continuous improvement and monitoring of macro execution.",
        criteria: ["SIEM telemetry on macro events", "Exception expiry and review"],
        nextSteps: ["Quarterly attestation of macro policy adherence"],
      },
    ],
  },
  "User Application Hardening": {
    id: "User Application Hardening",
    name: "User Application Hardening",
    fullDescription:
      "Disable risky features and enforce secure configurations in user applications (browsers, email clients, PDF readers).",
    levels: [
      {
        level: 0,
        description: "Risky defaults enabled; limited policy enforcement.",
        criteria: ["Default-permit risky features", "No baseline hardening standard"],
        nextSteps: ["Define baseline config", "Disable high-risk features and plugins"],
      },
      {
        level: 1,
        description: "Baseline hardening applied to common apps.",
        criteria: ["Harden browsers and email clients", "Restrict plugins and helpers"],
        nextSteps: ["Automate policy deployment", "Document exception handling"],
      },
      {
        level: 2,
        description: "Organization-wide hardening with compliance checks.",
        criteria: ["SCAP/benchmark checks for compliance", "Periodic enforcement scans"],
        nextSteps: ["Central metrics dashboards", "Integrate with vulnerability management"],
      },
      {
        level: 3,
        description: "Continuous improvement with telemetry-driven adjustments.",
        criteria: ["SIEM telemetry on risky features", "Regular review against updated benchmarks"],
        nextSteps: ["Quarterly updates to hardening standards"],
      },
    ],
  },
  "Restrict Admin Privileges": {
    id: "Restrict Admin Privileges",
    name: "Restrict Admin Privileges",
    fullDescription:
      "Limit administrative privileges and use just-in-time elevation to reduce attack surface.",
    levels: [
      {
        level: 0,
        description: "Broad admin rights; shared accounts; weak approval.",
        criteria: ["Users retain standing admin privileges", "No formal approval or logging"],
        nextSteps: ["Remove standing admin rights", "Implement role-based access controls"],
      },
      {
        level: 1,
        description: "Approval-based admin actions with basic logging.",
        criteria: ["Admin actions require approval", "Logging of elevated sessions"],
        nextSteps: ["Implement JIT/PAM", "Tie elevation to tickets"],
      },
      {
        level: 2,
        description: "JIT elevation with MFA and session recording.",
        criteria: ["MFA required for elevation", "PAM with session capture"],
        nextSteps: ["Periodic review of admin roles", "Automated expiry of elevated access"],
      },
      {
        level: 3,
        description: "Continuous monitoring and attestation of admin access.",
        criteria: ["Behavior analytics on admin actions", "Quarterly access recertification"],
        nextSteps: ["Automated anomaly response hooks"],
      },
    ],
  },
  "Patch Operating Systems": {
    id: "Patch Operating Systems",
    name: "Patch Operating Systems",
    fullDescription:
      "Keep operating systems up to date, prioritizing critical vulnerabilities and exploit-based risk.",
    levels: [
      {
        level: 0,
        description: "Irregular OS patching; low visibility.",
        criteria: ["No centralized patching", "Unmanaged OS versions"],
        nextSteps: ["Establish baselines", "Deploy patch management tooling"],
      },
      {
        level: 1,
        description: "Regular OS patching for common platforms.",
        criteria: ["Monthly OS patches", "Emergency patch workflow exists"],
        nextSteps: ["Define SLAs for critical vulnerabilities", "Automate reporting"],
      },
      {
        level: 2,
        description: "Enforced SLAs and compliance measurement.",
        criteria: ["48-hour SLA for critical vulnerabilities in exposed systems", "Two-week SLA for non-critical patches"],
        nextSteps: ["Ring-based deployment", "Exception governance"],
      },
      {
        level: 3,
        description: "Continuous scanning and remediation with metrics.",
        criteria: ["Automated compliance dashboards", "Exploit intel informs prioritization"],
        nextSteps: ["Quarterly audits of patch coverage"],
      },
    ],
  },
  "Multi-factor Authentication": {
    id: "Multi-factor Authentication",
    name: "Multi-factor Authentication",
    fullDescription:
      "Require MFA for remote access, privileged actions, and high-risk systems to mitigate credential compromise.",
    levels: [
      {
        level: 0,
        description: "MFA is optional or inconsistently applied.",
        criteria: ["No enforced MFA policy", "Legacy protocols bypass MFA"],
        nextSteps: ["Enable MFA for remote access", "Identify and block bypass paths"],
      },
      {
        level: 1,
        description: "MFA for remote access and admin accounts.",
        criteria: ["MFA for admin roles", "MFA for VPN/SSO/external portals"],
        nextSteps: ["Expand MFA to sensitive applications", "Introduce phishing-resistant factors where possible"],
      },
      {
        level: 2,
        description: "Broad MFA coverage across critical applications.",
        criteria: ["MFA for all users on critical apps", "Conditional access policies"],
        nextSteps: ["Adopt phishing-resistant MFA for privileged roles", "Continuous monitoring of MFA health"],
      },
      {
        level: 3,
        description: "Phishing-resistant MFA and adaptive policies.",
        criteria: ["FIDO/WebAuthn for admins", "Risk-based prompts and device trust"],
        nextSteps: ["Quarterly posture reviews"],
      },
    ],
  },
  "Regular Backups": {
    id: "Regular Backups",
    name: "Regular Backups",
    fullDescription:
      "Perform regular, tested backups with offline/immutable copies to enable rapid recovery from incidents such as ransomware.",
    levels: [
      {
        level: 0,
        description: "Inconsistent backups; limited testing.",
        criteria: ["No formal backup cadence", "No offline or immutable copies"],
        nextSteps: ["Define backup policy", "Introduce offline/immutable storage"],
      },
      {
        level: 1,
        description: "Regular backups with basic testing.",
        criteria: ["Weekly backups for critical systems", "Monthly restore tests"],
        nextSteps: ["Automate backup verification", "Define RPO/RTO targets"],
      },
      {
        level: 2,
        description: "Resilient backups with recovery validation.",
        criteria: ["Immutable/offline backups for crown jewels", "Quarterly end-to-end recovery tests"],
        nextSteps: ["Documented runbooks and roles", "Drill exercises with stakeholders"],
      },
      {
        level: 3,
        description: "Mature backup program with metrics and continuous improvement.",
        criteria: ["Automated recovery validation", "Telemetry on backup success and drift"],
        nextSteps: ["Quarterly metrics review and tuning"],
      },
    ],
  },
  "Essential Logging and Monitoring": {
    id: "Essential Logging and Monitoring",
    name: "Essential Logging and Monitoring",
    fullDescription:
      "Collect and monitor security-relevant logs from endpoints, servers, applications, and identity providers to detect and respond to threats.",
    levels: [
      {
        level: 0,
        description: "Minimal logging; poor visibility.",
        criteria: ["No centralized log collection", "Inconsistent retention"],
        nextSteps: ["Deploy SIEM or central log platform", "Define retention and coverage"],
      },
      {
        level: 1,
        description: "Baseline logging and alerting for key systems.",
        criteria: ["Collect auth and admin activity logs", "Basic alerting for high-risk events"],
        nextSteps: ["Expand coverage to endpoints and apps", "Tune alerts to reduce noise"],
      },
      {
        level: 2,
        description: "Comprehensive coverage and detection content.",
        criteria: ["Correlated detections across identity, endpoint, and network", "Playbooks for common incidents"],
        nextSteps: ["Automate response hooks for critical detections", "Periodic control efficacy reviews"],
      },
      {
        level: 3,
        description: "Advanced analytics and continuous improvement.",
        criteria: ["Behavior analytics for privileged activity", "Threat intel integrated to detections"],
        nextSteps: ["Quarterly content tuning and purple-team exercises"],
      },
    ],
  },
};
