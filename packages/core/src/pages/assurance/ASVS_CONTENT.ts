export const ASVS_CATEGORIES = [
    {
        code: "V1",
        name: "Architecture, Design and Threat Modeling",
        description: "Verify the secure software development lifecycle, architecture, and threat modeling.",
        order: 1
    },
    {
        code: "V2",
        name: "Authentication Verification Requirements",
        description: "Verify the security of authentication mechanisms.",
        order: 2
    },
    {
        code: "V3",
        name: "Session Management Verification Requirements",
        description: "Verify the security of session management.",
        order: 3
    },
    {
        code: "V4",
        name: "Access Control Verification Requirements",
        description: "Verify the enforcement of access controls.",
        order: 4
    },
    {
        code: "V5",
        name: "Validation, Sanitization and Encoding Verification Requirements",
        description: "Verify input validation and output encoding to prevent injection attacks.",
        order: 5
    },
    {
        code: "V6",
        name: "Stored Cryptography Verification Requirements",
        description: "Verify the secure storage of cryptographic keys and data.",
        order: 6
    },
    {
        code: "V7",
        name: "Error Handling and Logging Verification Requirements",
        description: "Verify secure error handling and logging practices.",
        order: 7
    },
    {
        code: "V8",
        name: "Data Protection Verification Requirements",
        description: "Verify the protection of sensitive data.",
        order: 8
    },
    {
        code: "V9",
        name: "Communications Verification Requirements",
        description: "Verify the security of data in transit.",
        order: 9
    },
    {
        code: "V10",
        name: "Malicious Code Verification Requirements",
        description: "Verify defenses against malicious code.",
        order: 10
    },
    {
        code: "V11",
        name: "Business Logic Verification Requirements",
        description: "Verify the security of business logic.",
        order: 11
    },
    {
        code: "V12",
        name: "File and Resources Verification Requirements",
        description: "Verify the secure handling of files and resources.",
        order: 12
    },
    {
        code: "V13",
        name: "API and Web Service Verification Requirements",
        description: "Verify the security of APIs and web services.",
        order: 13
    },
    {
        code: "V14",
        name: "Configuration Verification Requirements",
        description: "Verify the secure configuration of the application.",
        order: 14
    }
];

export const ASVS_REQUIREMENTS_SAMPLE = [
    {
        categoryCode: "V1",
        chapterId: "1.1",
        chapterName: "Secure Software Development Lifecycle",
        requirementId: "1.1.1",
        description: "Verify the use of a secure software development lifecycle that addresses security in all stages of development.",
        level1: true,
        level2: true,
        level3: true,
        cwe: "CWE-1120",
        nist: "NIST-800-63"
    },
    {
        categoryCode: "V1",
        chapterId: "1.1",
        chapterName: "Secure Software Development Lifecycle",
        requirementId: "1.1.2",
        description: "Verify that threat modeling is performed for every major feature or change.",
        level1: false,
        level2: true,
        level3: true,
        cwe: "CWE-1025",
        nist: ""
    },
    {
        categoryCode: "V1",
        chapterId: "1.1",
        chapterName: "Secure Software Development Lifecycle",
        requirementId: "1.1.3",
        description: "Verify that all developers are trained in secure coding practices.",
        level1: true,
        level2: true,
        level3: true,
        cwe: "CWE-1038",
        nist: ""
    },
    {
        categoryCode: "V2",
        chapterId: "2.1",
        chapterName: "Password Security",
        requirementId: "2.1.1",
        description: "Verify that user set passwords are at least 12 characters in length.",
        level1: true,
        level2: true,
        level3: true,
        cwe: "CWE-521",
        nist: "NIST-800-63B"
    },
    {
        categoryCode: "V2",
        chapterId: "2.1",
        chapterName: "Password Security",
        requirementId: "2.1.2",
        description: "Verify that passwords of at least 64 characters are permitted, and that there are no other password composition rules (number, symbol, upper/lower case etc.).",
        level1: true,
        level2: true,
        level3: true,
        cwe: "CWE-521",
        nist: "NIST-800-63B"
    }
];
