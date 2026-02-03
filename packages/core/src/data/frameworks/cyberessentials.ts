
// Cyber Essentials / Cyber Essentials Plus (Representative Controls)
// Based on the 5 technical control themes required by the UK Government scheme.

export const cyberEssentialsControls = [
    // 1. Firewalls
    { id: "CE-FW-1", name: "Boundary Firewalls", description: "Establish and maintain a firewall at the boundary of the network to protect internal systems from external threats.", category: "Firewalls" },
    { id: "CE-FW-2", name: "Software Firewalls", description: "Ensure software firewalls are active on all devices that leave the organizational boundary (e.g., laptops).", category: "Firewalls" },
    { id: "CE-FW-3", name: "Default Passwords", description: "Change all default administrative passwords on firewall devices to strong, unique passwords.", category: "Firewalls" },
    { id: "CE-FW-4", name: "Inbound Connections", description: "Block all unauthenticated inbound connections by default.", category: "Firewalls" },
    { id: "CE-FW-5", name: "Configuration Review", description: "Review and approve all firewall rules regularly.", category: "Firewalls" },

    // 2. Secure Configuration
    { id: "CE-SC-1", name: "Unnecessary Software", description: "Remove or disable unnecessary software and services from devices.", category: "Secure Configuration" },
    { id: "CE-SC-2", name: "Default Accounts", description: "Remove or disable unnecessary user accounts and change default passwords.", category: "Secure Configuration" },
    { id: "CE-SC-3", name: "Auto-Run", description: "Disable 'Auto-Run' and 'Auto-Play' features on all systems.", category: "Secure Configuration" },
    { id: "CE-SC-4", name: "Personal Firewalls", description: "Ensure personal firewalls are configured on all end-user devices.", category: "Secure Configuration" },
    { id: "CE-SC-5", name: "Unlock Security", description: "Devices must lock automatically after a short period of inactivity and require authentication to unlock.", category: "Secure Configuration" },

    // 3. User Access Control
    { id: "CE-AC-1", name: "Account Creation", description: "Have a formal process for creating and approving new user accounts.", category: "User Access Control" },
    { id: "CE-AC-2", name: "Least Privilege", description: "Grant users only the permissions they need to perform their role.", category: "User Access Control" },
    { id: "CE-AC-3", name: "Authentication", description: "Authenticate users with strong, unique passwords or multi-factor authentication (MFA).", category: "User Access Control" },
    { id: "CE-AC-4", name: "Administrative Access", description: "Restrict administrative access to a small number of authorized individuals.", category: "User Access Control" },
    { id: "CE-AC-5", name: "Account Removal", description: "Remove or disable user accounts immediately when no longer required (e.g., when an employee leaves).", category: "User Access Control" },

    // 4. Malware Protection
    { id: "CE-MP-1", name: "Anti-Malware Software", description: "Install and keep updated anti-malware software on all devices.", category: "Malware Protection" },
    { id: "CE-MP-2", name: "Signature Updates", description: "Configure anti-malware software to update signatures at least daily.", category: "Malware Protection" },
    { id: "CE-MP-3", name: "Scanning", description: "Configure anti-malware software to scan files automatically upon access or download.", category: "Malware Protection" },
    { id: "CE-MP-4", name: "Application Whitelisting", description: "For devices where anti-malware is not feasible, use application whitelisting to only allow approved applications to run.", category: "Malware Protection" },
    { id: "CE-MP-5", name: "Sandboxing", description: "Use sandboxing for applications that access the internet (e.g., web browsers, email clients).", category: "Malware Protection" },

    // 5. Security Update Management
    { id: "CE-SU-1", name: "Patching Policy", description: "Apply all high-risk or critical security updates within 14 days of release.", category: "Security Update Management" },
    { id: "CE-SU-2", name: "Licensed Software", description: "Ensure all software is licensed and supported by the vendor.", category: "Security Update Management" },
    { id: "CE-SU-3", name: "Unsupported Software", description: "Remove software that is no longer supported by the vendor (End of Life).", category: "Security Update Management" },
    { id: "CE-SU-4", name: "Automatic Updates", description: "Enable automatic updates for operating systems and applications where possible.", category: "Security Update Management" },
];

export default cyberEssentialsControls;
