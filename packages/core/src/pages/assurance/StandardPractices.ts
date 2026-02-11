
export interface StandardPractice {
    id: string;
    framework: string;
    name: string;
    description: string;
    impact: string;
    guidance: string[];
    nextSteps: string[];
    relatedAuditCode: string; // Used to link to Audit Hub requests
}

export const TECHNICAL_STANDARD_CONTENT: Record<string, StandardPractice[]> = {
    "SCVS": [
        {
            id: "SCVS-V1",
            framework: "OWASP SCVS",
            name: "Build Pipeline Integrity",
            description: "Establishing a verifiable and protected software build process.",
            impact: "Prevents code injection during the build phase, protecting against SolarWinds-style attacks.",
            guidance: [
                "Ensure build servers are isolated and have no direct internet access during compilation.",
                "Implement build-time Software Bill of Materials (SBOM) generation using tools like Syft or CycloneDX.",
                "Digitally sign build artifacts (binaries, containers) immediately upon completion."
            ],
            nextSteps: [
                "Configure ephemeral build runners that are destroyed after each job.",
                "Enforce multi-party approval for changes to the build environment configuration.",
                "Verify signatures of all upstream dependencies before ingestion."
            ],
            relatedAuditCode: "SCVS-1.1"
        },
        {
            id: "SCVS-V2",
            framework: "OWASP SCVS",
            name: "Dependency Management",
            description: "Controlled ingestion and lifecycle management of third-party assets.",
            impact: "Reduces exposure to vulnerable or malicious open-source packages.",
            guidance: [
                "Establish a private artifact repository (Nexus, Artifactory) as the single source of truth.",
                "Enable automated vulnerability scanning (SCA) for all tracked dependencies.",
                "Pin dependencies to specific hashes (not just versions) to prevent supply chain poisoning."
            ],
            nextSteps: [
                "Implement a 'Break the Build' policy for dependencies with known Critical vulnerabilities.",
                "Perform quarterly reviews of the 'Allow List' for new dependencies.",
                "Monitor for 'typosquatting' and dependency confusion attacks."
            ],
            relatedAuditCode: "SCVS-2.1"
        }
    ],
    "OPENSSF": [
        {
            id: "OSPS-HY",
            framework: "OpenSSF",
            name: "Repository Hygiene",
            description: "Foundational security settings for project repositories.",
            impact: "Ensures baseline protection across all development assets, preventing trivial unauthorized changes.",
            guidance: [
                "Required 2-Factor Authentication (2FA) for all repository contributors.",
                "Enforce Branch Protection rules on all 'main' or production branches.",
                "Require signature verification (GPG/SSH) for all commits."
            ],
            nextSteps: [
                "Audit contributor list to ensure offboarded employees are removed.",
                "Automate secret scanning (e.g., GitHub Secret Scanning) to prevent credential leakage.",
                "Include a SECURITY.md file with a clear vulnerability disclosure policy."
            ],
            relatedAuditCode: "OSPS-AC-01"
        }
    ],
    "ASVS": [
        {
            id: "ASVS-V1",
            framework: "OWASP ASVS",
            name: "Architecture & Design",
            description: "High-level security requirements for application architecture.",
            impact: "Ensures the system is secure by design, reducing the need for expensive late-stage refactors.",
            guidance: [
                "Verify that all application components are identified and their trust boundaries defined.",
                "Implement a centralized authentication and authorization service.",
                "Ensure data is classified by sensitivity and encrypted appropriately at rest."
            ],
            nextSteps: [
                "Perform a formal Threat Model of the core application architecture.",
                "Review API designs for sensitive data exposure (OWASP API #3).",
                "Validate that security headers are enforced globally across the frontend."
            ],
            relatedAuditCode: "ASVS-1.1"
        }
    ],
    "MASVS": [
        {
            id: "MASVS-V1",
            framework: "OWASP MASVS",
            name: "Architecture, Design and Threat Modeling",
            description: "Security requirements for mobile application architecture and design.",
            impact: "Ensures mobile apps are built on a secure foundation, specialized for mobile-specific threats.",
            guidance: [
                "Verify that the mobile app has a clear security architecture and design.",
                "Implement secure data storage and communication practices.",
                "Ensure protection against reverse engineering and tampering."
            ],
            nextSteps: [
                "Conduct a mobile-specific threat model.",
                "Audit third-party SDKs used in the mobile app.",
                "Implement code obfuscation and integrity checks."
            ],
            relatedAuditCode: "MASVS-1.1"
        }
    ]
};
