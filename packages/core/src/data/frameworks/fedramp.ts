
// FedRAMP Baselines (Representative Selection)
// Based on NIST SP 800-53 Rev 5 controls.

const commonControls = [
    { id: "AC-1", name: "Access Control Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant access control policy.", category: "Access Control" },
    { id: "AC-2", name: "Account Management", description: "The organization identifies and selects types of information system accounts to support organizational missions/business functions.", category: "Access Control" },
    { id: "AC-3", name: "Access Enforcement", description: "The information system enforces approved authorizations for logical access to information and system resources.", category: "Access Control" },
    { id: "AT-1", name: "Awareness and Training Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant awareness and training policy.", category: "Awareness and Training" },
    { id: "AT-2", name: "Security Awareness Training", description: "The organization provides basic security awareness training to information system users.", category: "Awareness and Training" },
    { id: "AU-1", name: "Audit and Accountability Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant audit and accountability policy.", category: "Audit and Accountability" },
    { id: "AU-2", name: "Audit Events", description: "The organization determines that the information system is capable of auditing defined events.", category: "Audit and Accountability" },
    { id: "CM-1", name: "Configuration Management Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant configuration management policy.", category: "Configuration Management" },
    { id: "IA-1", name: "Identification and Authentication Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant identification and authentication policy.", category: "Identification and Authentication" },
    { id: "IA-2", name: "Identification and Authentication (Organizational Users)", description: "The information system uniquely identifies and authenticates organizational users.", category: "Identification and Authentication" },
    { id: "IR-1", name: "Incident Response Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant incident response policy.", category: "Incident Response" },
    { id: "IR-6", name: "Incident Reporting", description: "The organization requires personnel to report suspected security incidents.", category: "Incident Response" },
    { id: "RA-1", name: "Risk Assessment Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant risk assessment policy.", category: "Risk Assessment" },
    { id: "RA-3", name: "Risk Assessment", description: "The organization conducts an assessment of risk to organizational operations and assets.", category: "Risk Assessment" },
    { id: "SC-1", name: "System and Communications Protection Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant system and communications protection policy.", category: "System and Communications Protection" },
    { id: "SI-1", name: "System and Information Integrity Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant system and information integrity policy.", category: "System and Information Integrity" },
    { id: "SI-2", name: "Flaw Remediation", description: "The organization identifies, reports, and corrects information system flaws.", category: "System and Information Integrity" }
];

export const fedrampLowControls = [
    ...commonControls,
    // Low specific additions (representative)
    { id: "AC-7", name: "Unsuccessful Logon Attempts", description: "The information system enforces a limit of consecutive invalid logon attempts.", category: "Access Control" },
    { id: "MP-1", name: "Media Protection Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant media protection policy.", category: "Media Protection" },
    { id: "PE-1", name: "Physical and Environmental Protection Policy and Procedures", description: "The organization develops, documents, and disseminates a compliant physical and environmental protection policy.", category: "Physical and Environmental Protection" },
];

export const fedrampModerateControls = [
    ...fedrampLowControls,
    // Moderate additions
    { id: "AC-2(1)", name: "Automated System Account Management", description: "The organization employs automated mechanisms to support the management of information system accounts.", category: "Access Control" },
    { id: "AC-4", name: "Information Flow Enforcement", description: "The information system enforces approved authorizations for controlling the flow of information.", category: "Access Control" },
    { id: "AC-11", name: "Session Lock", description: "The information system prevents further access to the system by initiating a session lock.", category: "Access Control" },
    { id: "AC-17", name: "Remote Access", description: "The organization establishes and documents usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed.", category: "Access Control" },
    { id: "AU-3", name: "Content of Audit Records", description: "The information system generates audit records containing detailed information.", category: "Audit and Accountability" },
    { id: "AU-6", name: "Audit Review, Analysis, and Reporting", description: "The organization reviews and analyzes information system audit records for indications of inappropriate or unusual activity.", category: "Audit and Accountability" },
    { id: "CM-2", name: "Baseline Configuration", description: "The organization develops, documents, and maintains under configuration control, a current baseline configuration of the information system.", category: "Configuration Management" },
    { id: "CP-2", name: "Contingency Plan", description: "The organization develops a contingency plan for the information system.", category: "Contingency Planning" },
    { id: "IA-5", name: "Authenticator Management", description: "The organization manages information system authenticators.", category: "Identification and Authentication" },
    { id: "SC-7", name: "Boundary Protection", description: "The information system monitors and controls communications at the external boundary of the system.", category: "System and Communications Protection" },
    { id: "SC-13", name: "Cryptographic Protection", description: "The information system implements cryptographic modules in accordance with applicable federal laws.", category: "System and Communications Protection" },
    { id: "MA-2", name: "Controlled Maintenance", description: "The organization schedules, performs, documents, and reviews records of maintenance and repairs.", category: "Maintenance" }
];

export const fedrampHighControls = [
    ...fedrampModerateControls,
    // High specific additions (representative)
    { id: "AC-2(2)", name: "Removal of Temporary / Emergency Accounts", description: "The info system automatically removes or disables temporary and emergency accounts after a defined time period.", category: "Access Control" },
    { id: "AC-12", name: "Session Termination", description: "The information system automatically terminates a user session after a defined condition.", category: "Access Control" },
    { id: "AU-4", name: "Audit Storage Capacity", description: "The organization allocates audit record storage capacity in accordance with defined requirements.", category: "Audit and Accountability" },
    { id: "CP-6", name: "Alternate Storage Site", description: "The organization establishes an alternate storage site including necessary agreements.", category: "Contingency Planning" },
    { id: "CP-9", name: "Information System Backup", description: "The organization conducts backups of user-level information contained in the information system.", category: "Contingency Planning" },
    { id: "IR-4", name: "Incident Handling", description: "The organization implements an incident handling capability for incidents.", category: "Incident Response" },
    { id: "MA-4", name: "Nonlocal Maintenance", description: "The organization approves and monitors nonlocal maintenance and diagnostic activities.", category: "Maintenance" },
    { id: "PE-3", name: "Physical Access Control", description: "The organization enforces physical access authorizations at entry/exit points to the facility.", category: "Physical and Environmental Protection" },
    { id: "SC-8", name: "Transmission Confidentiality and Integrity", description: "The information system protects the confidentiality and integrity of transmitted information.", category: "System and Communications Protection" },
    { id: "SC-28", name: "Protection of Information at Rest", description: "The information system protects the confidentiality and integrity of information at rest.", category: "System and Communications Protection" },
    { id: "SI-4", name: "Information System Monitoring", description: "The organization monitors the information system to detect attacks and indicators of potential attacks.", category: "System and Information Integrity" }
];

export default fedrampModerateControls;
