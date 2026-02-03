
// HITRUST CSF (e1, i1, r2) Representative Controls
// Note: This is a representative set of controls modeled after the HITRUST CSF structure.
// actual HITRUST CSF content is proprietary. This list covers the 19 standard domains.

export const hitrustControls = [
    // -------------------------------------------------------------------------
    // Domain 01: Information Protection Program
    // -------------------------------------------------------------------------
    { id: "01.01", name: "Information Security Management Program", description: "The organization shall establish, implement, maintain, and continually improve an information security management program.", category: "Information Protection Program" },
    { id: "01.02", name: "Security Policy", description: "A set of policies for information security shall be defined, approved by management, published, and communicated to employees and relevant external parties.", category: "Information Protection Program" },
    { id: "01.03", name: "Review of the Policies", description: "The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy, and effectiveness.", category: "Information Protection Program" },
    { id: "01.04", name: "Leadership and Commitment", description: "Top management shall demonstrate leadership and commitment with respect to the information security management system.", category: "Information Protection Program" },
    { id: "01.05", name: "Information Security Roles and Responsibilities", description: "All information security responsibilities shall be defined and allocated.", category: "Information Protection Program" },
    { id: "01.06", name: "Segregation of Duties", description: "Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization's assets.", category: "Information Protection Program" },
    { id: "01.07", name: "Contact with Authorities", description: "Appropriate contacts with relevant authorities shall be maintained.", category: "Information Protection Program" },
    { id: "01.08", name: "Contact with Special Interest Groups", description: "Appropriate contacts with special interest groups or other specialist security forums and professional associations shall be maintained.", category: "Information Protection Program" },
    { id: "01.09", name: "Information Security in Project Management", description: "Information security shall be addressed in project management, regardless of the type of the project.", category: "Information Protection Program" },

    // -------------------------------------------------------------------------
    // Domain 02: Endpoint Protection
    // -------------------------------------------------------------------------
    { id: "02.01", name: "Endpoint Security Standard", description: "Formal endpoint protection standards shall be documented and implemented for all workstations, servers, and other endpoints.", category: "Endpoint Protection" },
    { id: "02.02", name: "Malware Protection", description: "Detection, prevention, and recovery controls to protect against malware shall be implemented, combined with appropriate user awareness.", category: "Endpoint Protection" },
    { id: "02.03", name: "Endpoint Technical Vulnerability Management", description: "Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion, the organization's exposure to such vulnerabilities evaluated, and appropriate measures taken to address the associated risk.", category: "Endpoint Protection" },
    { id: "02.04", name: "Software Installation Restrictions", description: "Rules governing the installation of software by users shall be established and implemented.", category: "Endpoint Protection" },
    { id: "02.05", name: "Controls Against Malicious Code", description: "Detection, prevention, and recovery controls to protect against malicious code shall be implemented.", category: "Endpoint Protection" },
    { id: "02.06", name: "Mobile Code", description: "Where the use of mobile code is authorized, the configuration shall ensure that the authorized user has defined and configured the authorized mobile code to operate according to clearly defined security policy.", category: "Endpoint Protection" },
    { id: "02.07", name: "Review of User Access Rights", description: "Asset owners shall review users' access rights at regular intervals.", category: "Endpoint Protection" },
    { id: "02.08", name: "Unattended User Equipment", description: "Users shall ensure that unattended equipment has appropriate protection.", category: "Endpoint Protection" },
    { id: "02.09", name: "Clear Desk and Clear Screen Policy", description: "A clear desk policy for papers and removable storage media and a clear screen policy for information processing facilities shall be adopted.", category: "Endpoint Protection" },

    // -------------------------------------------------------------------------
    // Domain 03: Portable Media Security
    // -------------------------------------------------------------------------
    { id: "03.01", name: "Removable Media Management", description: "Procedures for the management of removable media shall be implemented.", category: "Portable Media Security" },
    { id: "03.02", name: "Disposal of Media", description: "Media shall be disposed of securely when no longer required, using formal procedures.", category: "Portable Media Security" },
    { id: "03.03", name: "Physical Media Transfer", description: "Media containing information shall be protected against unauthorized access, misuse, or corruption during transportation.", category: "Portable Media Security" },
    { id: "03.04", name: "Encryption of Portable Media", description: "Portable media containing sensitive information shall be encrypted.", category: "Portable Media Security" },
    { id: "03.05", name: "Media Handling", description: "Procedures for the management of removable media shall be established.", category: "Portable Media Security" },

    // -------------------------------------------------------------------------
    // Domain 04: Mobile Device Security
    // -------------------------------------------------------------------------
    { id: "04.01", name: "Mobile Device Policy", description: "A policy and supporting security measures shall be adopted to manage the risks introduced by using mobile devices.", category: "Mobile Device Security" },
    { id: "04.02", name: "Mobile Device Management (MDM)", description: "Mobile devices accessing corporate data shall be managed via MDM.", category: "Mobile Device Security" },
    { id: "04.03", name: "Remote Wipe", description: "The organization shall have the capability to remotely wipe data from compromised or lost mobile devices.", category: "Mobile Device Security" },
    { id: "04.04", name: "Containerization", description: "Corporate data on mobile devices shall be segregated from personal data.", category: "Mobile Device Security" },
    { id: "04.05", name: "Mobile Device Encryption", description: "All mobile devices storing sensitive data must retain full-disk encryption.", category: "Mobile Device Security" },

    // -------------------------------------------------------------------------
    // Domain 05: Wireless Security
    // -------------------------------------------------------------------------
    { id: "05.01", name: "Wireless Network Security", description: "Security measures shall be implemented to protect wireless networks.", category: "Wireless Security" },
    { id: "05.02", name: "Wireless Encryption", description: "Wireless networks shall use strong encryption (e.g., WPA2/3 Enterprise).", category: "Wireless Security" },
    { id: "05.03", name: "Wireless Access Control", description: "Access to wireless networks shall be restricted to authorized devices and users.", category: "Wireless Security" },
    { id: "05.04", name: "Guest Wireless Access", description: "Guest wireless networks shall be segmented from the internal corporate network.", category: "Wireless Security" },
    { id: "05.05", name: "Wireless Intrusion Detection", description: "The organization shall monitor for unauthorized wireless access points.", category: "Wireless Security" },

    // -------------------------------------------------------------------------
    // Domain 06: Configuration Management
    // -------------------------------------------------------------------------
    { id: "06.01", name: "Baseline Configurations", description: "Baseline configurations shall be established and maintained for all system components.", category: "Configuration Management" },
    { id: "06.02", name: "Configuration Change Control", description: "Changes to configurations shall be managed through a formal change control process.", category: "Configuration Management" },
    { id: "06.03", name: "Security of System Documentation", description: "System documentation shall be protected against unauthorized access.", category: "Configuration Management" },
    { id: "06.04", name: "Least Functionality", description: "Systems shall be configured to provide only essential capabilities.", category: "Configuration Management" },
    { id: "06.05", name: "Hardening Procedures", description: "Systems shall be hardened according to industry best practices (e.g., CIS Benchmarks).", category: "Configuration Management" },

    // -------------------------------------------------------------------------
    // Domain 07: Vulnerability Management
    // -------------------------------------------------------------------------
    { id: "07.01", name: "Vulnerability Scanning", description: "Vulnerability scans shall be performed at regular intervals.", category: "Vulnerability Management" },
    { id: "07.02", name: "Patch Management", description: "Security patches shall be applied within established timeframes based on severity.", category: "Vulnerability Management" },
    { id: "07.03", name: "Penetration Testing", description: "Penetration testing shall be conducted periodically to identify security weaknesses.", category: "Vulnerability Management" },
    { id: "07.04", name: "Vulnerability Remediation", description: "Identified vulnerabilities shall be remediated in a timely manner.", category: "Vulnerability Management" },
    { id: "07.05", name: "Threat Intelligence", description: "The organization shall gather and analyze threat intelligence to inform vulnerability management.", category: "Vulnerability Management" },

    // -------------------------------------------------------------------------
    // Domain 08: Network Protection
    // -------------------------------------------------------------------------
    { id: "08.01", name: "Network Segmentation", description: "Network segmentation shall be used to isolate sensitive systems and data.", category: "Network Protection" },
    { id: "08.02", name: "Firewall Configuration", description: "Firewall rules shall be reviewed regularly and follow the principle of least privilege.", category: "Network Protection" },
    { id: "08.03", name: "Network Controls", description: "Networks shall be managed and controlled to protect information in systems and applications.", category: "Network Protection" },
    { id: "08.04", name: "Security of Network Services", description: "Security mechanisms, service levels, and management requirements of all network services shall be identified and included in network services agreements.", category: "Network Protection" },
    { id: "08.05", name: "Perimeter Security", description: "Transboundary data flow shall be monitored and controlled.", category: "Network Protection" },
    { id: "08.06", name: "DDoS Protection", description: "Measures shall be in place to mitigate Distributed Denial of Service (DDoS) attacks.", category: "Network Protection" },
    { id: "08.07", name: "Intrusion Detection/Prevention", description: "IDS/IPS systems shall be deployed to monitor network traffic for malicious activity.", category: "Network Protection" },

    // -------------------------------------------------------------------------
    // Domain 09: Transmission Protection
    // -------------------------------------------------------------------------
    { id: "09.01", name: "Information Transfer Policies and Procedures", description: "Formal transfer policies, procedures, and controls shall be in place to protect the transfer of information through the use of all types of communication facilities.", category: "Transmission Protection" },
    { id: "09.02", name: "Agreements on Information Transfer", description: "Agreements shall address the secure transfer of business information between the organization and external parties.", category: "Transmission Protection" },
    { id: "09.03", name: "Electronic Messaging", description: "Information involved in electronic messaging shall be appropriately protected.", category: "Transmission Protection" },
    { id: "09.04", name: "Confidentiality or Non-Disclosure Agreements", description: "Requirements for confidentiality or non-disclosure agreements reflecting the organization's needs for the protection of information shall be identified, regularly reviewed, and documented.", category: "Transmission Protection" },
    { id: "09.05", name: "Encryption in Transit", description: "Sensitive data transmitted over public networks shall be encrypted (e.g., TLS 1.2+).", category: "Transmission Protection" },

    // -------------------------------------------------------------------------
    // Domain 10: Password Management
    // -------------------------------------------------------------------------
    { id: "10.01", name: "Password Management System", description: "Passwords shall be managed through a formal password management system.", category: "Password Management" },
    { id: "10.02", name: "User Password Management", description: "Users shall be required to follow good security practices in the selection and use of passwords.", category: "Password Management" },
    { id: "10.03", name: "Password Complexity", description: "Passwords shall meet complexity requirements (length, character types).", category: "Password Management" },
    { id: "10.04", name: "Multi-Factor Authentication", description: "Multi-factor authentication shall be required for remote access and administrative accounts.", category: "Password Management" },
    { id: "10.05", name: "Password Expiration", description: "Passwords shall be changed at regular intervals or based on risk.", category: "Password Management" },
    { id: "10.06", name: "Password History", description: "A password history shall be maintained to prevent the reuse of recent passwords.", category: "Password Management" },
    { id: "10.07", name: "Account Lockout", description: "User accounts shall be locked out after a defined number of failed login attempts.", category: "Password Management" },

    // -------------------------------------------------------------------------
    // Domain 11: Access Control
    // -------------------------------------------------------------------------
    { id: "11.01", name: "Access Control Policy", description: "An access control policy shall be established, documented, and reviewed based on business and security requirements.", category: "Access Control" },
    { id: "11.02", name: "Access to Networks and Network Services", description: "Users shall only be provided with access to the network and network services that they have been specifically authorized to use.", category: "Access Control" },
    { id: "11.03", name: "User Registration and De-registration", description: "A formal user registration and de-registration process shall be implemented to enable assignment of access rights.", category: "Access Control" },
    { id: "11.04", name: "User Access Provisioning", description: "Formal procedures for granting and revoking access shall be established.", category: "Access Control" },
    { id: "11.05", name: "Management of Privileged Access Rights", description: "The allocation and use of privileged access rights shall be restricted and controlled.", category: "Access Control" },
    { id: "11.06", name: "Review of User Access Rights", description: "Asset owners shall review users' access rights at regular intervals.", category: "Access Control" },
    { id: "11.07", name: "Removal or Adjustment of Access Rights", description: "The access rights of all employees and external party users to information and information processing facilities shall be removed upon termination of their employment, contract or agreement, or adjusted upon change.", category: "Access Control" },
    { id: "11.08", name: "Use of Secret Authentication Information", description: "Users shall be required to follow good security practices in the use of secret authentication information.", category: "Access Control" },
    { id: "11.09", name: "Information Access Restriction", description: "Access to information and application system functions shall be restricted in accordance with the access control policy.", category: "Access Control" },
    { id: "11.10", name: "Secure Log-on Procedures", description: "Access to systems shall be controlled by a secure log-on procedure.", category: "Access Control" },

    // -------------------------------------------------------------------------
    // Domain 12: Audit Logging & Monitoring
    // -------------------------------------------------------------------------
    { id: "12.01", name: "Event Logging", description: "Event logs recording user activities, exceptions, faults, and information security events shall be produced, kept, and regularly reviewed.", category: "Audit Logging & Monitoring" },
    { id: "12.02", name: "Protection of Log Information", description: "Logging facilities and log information shall be protected against tampering and unauthorized access.", category: "Audit Logging & Monitoring" },
    { id: "12.03", name: "Administrator and Operator Logs", description: "System administrator and system operator activities shall be logged and the logs protected and regularly reviewed.", category: "Audit Logging & Monitoring" },
    { id: "12.04", name: "Clock Synchronization", description: "The clocks of all relevant information processing systems within an organization or security domain shall be synchronized to a single reference time source.", category: "Audit Logging & Monitoring" },
    { id: "12.05", name: "Monitoring System Use", description: "Procedures for monitoring use of information processing facilities shall be established and the results of the monitoring activities reviewed regularly.", category: "Audit Logging & Monitoring" },
    { id: "12.06", name: "Log Retention", description: "Audit logs shall be retained for a minimum period as required by policy and regulation (e.g., 1 year).", category: "Audit Logging & Monitoring" },
    { id: "12.07", name: "SIEM", description: "A Security Information and Event Management (SIEM) system or equivalent shall be used to aggregate and analyze logs.", category: "Audit Logging & Monitoring" },

    // -------------------------------------------------------------------------
    // Domain 13: Education, Training & Awareness
    // -------------------------------------------------------------------------
    { id: "13.01", name: "Information Security Awareness, Education and Training", description: "All employees of the organization and, where relevant, contractors shall receive appropriate awareness education and training and regular updates in organizational policies and procedures.", category: "Education, Training & Awareness" },
    { id: "13.02", name: "Phishing Simulations", description: "The organization shall conduct regular mock phishing exercises to test user awareness.", category: "Education, Training & Awareness" },
    { id: "13.03", name: "Role-Based Training", description: "Personnel with specific security responsibilities shall receive specialized training.", category: "Education, Training & Awareness" },
    { id: "13.04", name: "Acceptable Use Policy", description: "Employees shall acknowledge the Acceptable Use Policy prior to access.", category: "Education, Training & Awareness" },

    // -------------------------------------------------------------------------
    // Domain 14: Third Party Security
    // -------------------------------------------------------------------------
    { id: "14.01", name: "Identification of Risks Related to External Parties", description: "The risks to the organization's information and information processing facilities from business processes involving external parties shall be identified and appropriate controls implemented before granting access.", category: "Third Party Security" },
    { id: "14.02", name: "Addressing Security when Dealing with Customers", description: "All identified security requirements shall be addressed using a defined process, with documented results.", category: "Third Party Security" },
    { id: "14.03", name: "Addressing Security in Third Party Agreements", description: "Requirements for confidentiality, integrity, availability, and legal compliance shall be included in agreements with third parties.", category: "Third Party Security" },
    { id: "14.04", name: "Supply Chain Security", description: "Agreements with suppliers shall include requirements to address the information security risks associated with information and communications technology services and product supply chain.", category: "Third Party Security" },
    { id: "14.05", name: "Monitoring and Review of Third Party Services", description: "Organizations shall regularly monitor, review, and audit third party service delivery.", category: "Third Party Security" },
    { id: "14.06", name: "Managing Changes to Third Party Services", description: "Changes to the provision of services by third parties, including maintaining and improving existing information security policies, procedures and controls, shall be managed.", category: "Third Party Security" },

    // -------------------------------------------------------------------------
    // Domain 15: Incident Management
    // -------------------------------------------------------------------------
    { id: "15.01", name: "Responsibilities and Procedures", description: "Management responsibilities and procedures shall be established to ensure a quick, effective, and orderly response to information security incidents.", category: "Incident Management" },
    { id: "15.02", name: "Reporting Information Security Events", description: "Information security events shall be reported through appropriate management channels as quickly as possible.", category: "Incident Management" },
    { id: "15.03", name: "Reporting Security Weaknesses", description: "Employees and contractors using the organization's information systems and services shall be required to note and report any observed or suspected information security weaknesses in systems or services.", category: "Incident Management" },
    { id: "15.04", name: "Assessment of and Decision on Information Security Events", description: "Information security events shall be assessed and it shall be decided if they are to be classified as information security incidents.", category: "Incident Management" },
    { id: "15.05", name: "Response to Information Security Incidents", description: "Information security incidents shall be responded to in accordance with the documented procedures.", category: "Incident Management" },
    { id: "15.06", name: "Learning from Information Security Incidents", description: "Knowledge gained from analyzing and resolving information security incidents shall be used to reduce the likelihood or impact of future incidents.", category: "Incident Management" },
    { id: "15.07", name: "Collection of Evidence", description: " The organization shall define and apply procedures for the identification, collection, acquisition and preservation of information which can serve as evidence.", category: "Incident Management" },

    // -------------------------------------------------------------------------
    // Domain 16: Business Continuity & Disaster Recovery
    // -------------------------------------------------------------------------
    { id: "16.01", name: "Planning Information Security Continuity", description: "The organization shall determine its requirements for information security and the continuity of information security management in adverse situations.", category: "Business Continuity & Disaster Recovery" },
    { id: "16.02", name: "Implementing Information Security Continuity", description: "The organization shall establish, document, implement and maintain processes, procedures and controls to ensure the required level of information security continuity during an adverse situation.", category: "Business Continuity & Disaster Recovery" },
    { id: "16.03", name: "Verify, Review and Evaluate Information Security Continuity", description: "The organization shall verify the established and implemented information security continuity controls at regular intervals in order to ensure that they are valid and effective during adverse situations.", category: "Business Continuity & Disaster Recovery" },
    { id: "16.04", name: "Availability of Information Processing Facilities", description: "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.", category: "Business Continuity & Disaster Recovery" },
    { id: "16.05", name: "Testing of Plans", description: "Business continuity and disaster recovery plans shall be tested at least annually.", category: "Business Continuity & Disaster Recovery" },

    // -------------------------------------------------------------------------
    // Domain 17: Risk Management
    // -------------------------------------------------------------------------
    { id: "17.01", name: "Information Security Risk Assessment", description: "The organization shall define and apply an information security risk assessment process that is consistent with the criteria established in the risk management context.", category: "Risk Management" },
    { id: "17.02", name: "Information Security Risk Treatment", description: "The organization shall define and apply an information security risk treatment process to select and implement measures for modifying risk.", category: "Risk Management" },
    { id: "17.03", name: "Risk Ownership", description: "Risk owners shall be identified for all identified risks.", category: "Risk Management" },
    { id: "17.04", name: "Risk Monitoring", description: "Risks shall be monitored and reviewed regularly.", category: "Risk Management" },
    { id: "17.05", name: "Risk Register", description: "A risk register shall be maintained to track identified risks and treatment plans.", category: "Risk Management" },

    // -------------------------------------------------------------------------
    // Domain 18: Physical & Environmental Security
    // -------------------------------------------------------------------------
    { id: "18.01", name: "Physical Security Perimeter", description: "Security perimeters shall be defined and used to protect areas that contain either sensitive or critical information and information processing facilities.", category: "Physical & Environmental Security" },
    { id: "18.02", name: "Physical Entry Controls", description: "Secure areas shall be protected by appropriate entry controls to ensure that only authorized personnel are allowed access.", category: "Physical & Environmental Security" },
    { id: "18.03", name: "Securing Offices, Rooms and Facilities", description: "Physical security for offices, rooms and facilities shall be designed and applied.", category: "Physical & Environmental Security" },
    { id: "18.04", name: "Protecting Against External and Environmental Threats", description: "Physical protection against natural disasters, malicious attack or accidents shall be designed and applied.", category: "Physical & Environmental Security" },
    { id: "18.05", name: "Working in Secure Areas", description: "Procedures for working in secure areas shall be designed and applied.", category: "Physical & Environmental Security" },
    { id: "18.06", name: "Delivery and Loading Areas", description: "Access points such as delivery and loading areas and other points where unauthorized persons could enter the premises shall be controlled and, if possible, isolated from information processing facilities to avoid unauthorized access.", category: "Physical & Environmental Security" },
    { id: "18.07", name: "Equipment Siting and Protection", description: "Equipment shall be sited and protected to reduce the risks from environmental threats and hazards, and opportunities for unauthorized access.", category: "Physical & Environmental Security" },
    { id: "18.08", name: "Supporting Utilities", description: "Equipment shall be protected from power failures and other disruptions caused by failures in supporting utilities.", category: "Physical & Environmental Security" },
    { id: "18.09", name: "Cabling Security", description: "Power and telecommunications cabling carrying data or supporting information services shall be protected from interception, interference or damage.", category: "Physical & Environmental Security" },
    { id: "18.10", name: "Equipment Maintenance", description: "Equipment shall be correctly maintained to ensure its continued availability and integrity.", category: "Physical & Environmental Security" },
    { id: "18.11", name: "Removal of Assets", description: "Equipment, information or software shall not be taken off-site without prior authorization.", category: "Physical & Environmental Security" },
    { id: "18.12", name: "Security of Equipment and Assets Off-Premises", description: "Security shall be applied to off-site assets taking into account the different risks of working outside the organization's premises.", category: "Physical & Environmental Security" },
    { id: "18.13", name: "Secure Disposal or Re-use of Equipment", description: "All items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.", category: "Physical & Environmental Security" },

    // -------------------------------------------------------------------------
    // Domain 19: Data Protection & Privacy
    // -------------------------------------------------------------------------
    { id: "19.01", name: "Identification of Personally Identifiable Information (PII)", description: "The organization shall identify all PII processed and stored.", category: "Data Protection & Privacy" },
    { id: "19.02", name: "Privacy Policy", description: "A privacy policy shall be maintained and communicated to data subjects.", category: "Data Protection & Privacy" },
    { id: "19.03", name: "Consent and Choice", description: "The organization shall obtain consent for PII collection where required.", category: "Data Protection & Privacy" },
    { id: "19.04", name: "Data Minimization", description: "The organization shall only collect PII that is necessary for the specified purpose.", category: "Data Protection & Privacy" },
    { id: "19.05", name: "Data Retention", description: "PII shall be retained only for as long as necessary.", category: "Data Protection & Privacy" },
    { id: "19.06", name: "Data Subject Rights", description: "Mechanisms shall be in place to respond to data subject requests (access, rectification, deletion).", category: "Data Protection & Privacy" },
    { id: "19.07", name: "Cross-Border Data Transfer", description: "Data transfers across borders shall comply with applicable laws (e.g., GDPR, CCPA).", category: "Data Protection & Privacy" },
    { id: "19.08", name: "HIPAA Compliance", description: "Healthcare organizations shall ensure compliance with HIPAA Privacy and Security Rules.", category: "Data Protection & Privacy" }
];

export default hitrustControls;
