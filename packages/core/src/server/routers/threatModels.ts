
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { threatModels, threatModelComponents, riskScenarios, devProjects, riskTreatments, threatModelDataFlows, riskAssessments, frameworkRequirements } from "../../schema";
import { eq, and, desc, or } from "drizzle-orm";
import { logActivity } from "../../lib/audit";

import { calculateResidualScore, scoreToRiskLevel } from "../../lib/riskCalculations";

// Basic STRIDE mapping logic
const STRIDE_MAPPING: Record<string, any[]> = {
    'Web Client': [
        {
            title: 'Cross-Site Scripting (XSS)',
            category: 'Tampering',
            description: 'Malicious scripts injected into trusted websites.',
            explanation: 'XSS allows attackers to execute scripts in the victim\'s browser, potentially stealing cookies, tokens, or redirecting users.',
            mitigations: ['Output encoding', 'Content Security Policy (CSP)', 'OWASP Top 10: A03:2021']
        },
        {
            title: 'Sensitive Data in Local Storage',
            category: 'Information Disclosure',
            description: 'storing sensitive secrets (tokens, PII) in localStorage/sessionStorage.',
            explanation: 'LocalStorage is accessible by any script running on the page (including XSS payloads). Storing sensitive data here makes it trivial to steal.',
            mitigations: ['Use HttpOnly Cookies', 'Encrypted local storage', 'Do not store sensitive data on client']
        },
        {
            title: 'Client-Side Logic Bypass',
            category: 'Tampering',
            description: 'Attacker modifies client-side code to bypass validation or business logic.',
            explanation: 'Client-side controls can be easily bypassed by using tools like Burp Suite or modifying the JS. Relying solely on client-side validation is a security flaw.',
            mitigations: ['Server-side validation', 'Obfuscation (limited)', 'Integrity checks']
        },
        {
            title: 'DOM-based XSS',
            category: 'Tampering',
            description: 'Vulnerability in client-side code modifying the DOM environment.',
            explanation: 'Occurs when the application contains client-side JavaScript that processes data from an untrusted source in an unsafe way, usually writing data to the DOM.',
            mitigations: ['Avoid dangerous sinks (innerHTML)', 'Sanitize input', 'Use frameworks correctly']
        },
        {
            title: 'Clickjacking',
            category: 'Tampering',
            description: 'Attacker tricks user into clicking on invisible overlays.',
            explanation: 'Attackers can iframe your site and overlay invisible buttons, tricking users into performing actions (like "Delete Account") without their knowledge.',
            mitigations: ['X-Frame-Options: DENY', 'CSP: frame-ancestors']
        },
        {
            title: 'Cross-Site Request Forgery (CSRF)',
            category: 'Elevation of Privilege',
            description: 'Unauthorized commands transmitted from a user that the web application trusts.',
            explanation: 'Forces an end user to execute unwanted actions on a web application in which they are currently authenticated. Attacks state-changing requests, not theft of data.',
            mitigations: ['Anti-CSRF Tokens', 'SameSite Cookie Attribute', 'OWASP Top 10: A01:2021']
        },
    ],
    'API': [
        {
            title: 'Broken Object Level Authorization',
            category: 'Information Disclosure',
            description: 'API does not correctly validate user permissions involves accessing resources.',
            explanation: 'Attackers can manipulate the ID of an object they are requesting to access data belonging to other users. This is the #1 API security vulnerability.',
            mitigations: ['Implement authorization checks for every object access', 'ASVS V4: Access Control']
        },
        {
            title: 'Injection Attacks (SQL/NoSQL)',
            category: 'Tampering',
            description: 'Untrusted data is sent to an interpreter as part of a command or query.',
            explanation: 'If input is not sanitized, an attacker can execute arbitrary database commands, potentially dumping the entire database or deleting data.',
            mitigations: ['Parameterized queries', 'Stored procedures', 'OWASP Top 10: A03:2021']
        },
        {
            title: 'Denial of Service (DoS)',
            category: 'Denial of Service',
            description: 'API resources exhausted by massive traffic.',
            explanation: 'Without rate limiting, an attacker can flood the API with requests, making it unavailable for legitimate users.',
            mitigations: ['Rate limiting', 'Auto-scaling', 'Resource quotas']
        },
    ],
    'Database': [
        {
            title: 'SQL Injection',
            category: 'Tampering',
            description: 'Insertion of malicious SQL statements.',
            explanation: 'SQL Injection occurs when untrusted data is inserted into a database query. This can allow attackers to view, modify, or delete data they shouldn\'t have access to.',
            mitigations: ['Use ORM/Query Builders', 'Parameterized queries', 'Principle of Least Privilege for DB user']
        },
        {
            title: 'Weak Encryption at Rest',
            category: 'Information Disclosure',
            description: 'Sensitive data stored without adequate encryption.',
            explanation: 'If the physical media or database files are stolen, unencrypted data is immediately readable. Encryption at rest protects against physical theft and some forms of unauthorized access.',
            mitigations: ['AES-256 Encryption', 'Client-side encryption', 'ASVS V6: Stored Data Cryptography']
        },
    ],
    'External Service': [
        {
            title: 'Insecure Direct Object References',
            category: 'Information Disclosure',
            description: 'Reference to internal implementation object context.',
            explanation: 'Exposing internal object references (like database IDs) can allow attackers to guess valid IDs and access unauthorized data.',
            mitigations: ['Indirect Reference Maps', 'OWASP Top 10: A04:2021']
        },
        {
            title: 'Man-in-the-Middle',
            category: 'Tampering',
            description: 'Communication intercepted between services.',
            explanation: 'Without encryption (TLS) and certificate validation, an attacker on the network can intercept and modify traffic between services.',
            mitigations: ['Enforce Mutual TLS', 'Certificate Pinning', 'ASVS V9: Communications']
        }
    ],
    'Authentication Service': [
        {
            title: 'Spoofing Identity',
            category: 'Spoofing',
            description: 'Attacker successfully identifies as another user.',
            explanation: 'Weak authentication mechanisms allow attackers to impersonate legitimate users, gaining full access to their account and data.',
            mitigations: ['Multi-Factor Authentication (MFA)', 'Secure Identity Providers (Auth0, Clerk)', 'ASVS V2: Authentication']
        },
        {
            title: 'Brute Force Attack',
            category: 'Repudiation',
            description: 'Systematic checking of all possible keys or passwords.',
            explanation: 'Attackers use automated tools to guess passwords. Without lockout policies, they will eventually succeed if the password is weak.',
            mitigations: ['Account Lockout / Throttling', 'CAPTCHA', 'Monitor for failed logins']
        }
    ],
    'Process': [
        {
            title: 'Elevation of Privilege',
            category: 'Elevation of Privilege',
            description: 'Process accepts input that modifies control flow or executes arbitrary code.',
            explanation: 'Buffer overflows or logic flaws can allow an attacker to execute code with the permissions of the process (often Root/Administrator).',
            mitigations: ['Input Validation', 'Least Privilege Execution', 'Sandboxing']
        },
        {
            title: 'Denial of Service',
            category: 'Denial of Service',
            description: 'Process resource exhaustion via malformed requests.',
            explanation: 'Sending complex payloads (like XML bombs or regex) can consume 100% CPU/RAM, crashing the service.',
            mitigations: ['Rate Limiting', 'Resource Quotas', 'Timeouts']
        }
    ],
    'Store': [
        {
            title: 'Insecure Data Storage',
            category: 'Information Disclosure',
            description: 'Data store does not use encryption at rest',
            explanation: 'Any physical access to the hard drive or backup tapes reveals the data. Compliance frameworks (GDPR, HIPAA) mandate encryption.',
            mitigations: ['Encrypt Disk/Volume', 'Field Level Encryption']
        },
        {
            title: 'Integrity Violation',
            category: 'Tampering',
            description: 'Unauthorized modification of stored data.',
            explanation: 'If file permissions are weak, an attacker can modify logs to cover their tracks or change configuration files to create backdoors.',
            mitigations: ['File Integrity Monitoring (FIM)', 'Write-Ahead Logging', 'Strict ACLs']
        }
    ],
    'Actor': [
        {
            title: 'Spoofing User',
            category: 'Spoofing',
            description: 'Malicious actor impersonating a legitimate user.',
            explanation: 'Social engineering or credential theft allows an attacker to bypass technical controls by "becoming" a trusted user.',
            mitigations: ['Strong Authentication', 'Device Fingerprinting']
        }
    ],
    // --- NEW ROBUST MAPPINGS ---
    'LLM Model': [
        {
            title: 'Prompt Injection / Jailbreaking',
            category: 'Tampering',
            description: 'Attacker manipulates inputs to bypass safety filters or execute unauthorized actions.',
            explanation: 'Attackers can use "DAN" (Do Anything Now) prompts or other engineering techniques to trick the LLM into generating hate speech, malware, or revealing system instructions.',
            mitigations: ['Input Sanitization', 'LLM Guardrails / Firewalls', 'Human in the Loop']
        },
        {
            title: 'Training Data Extraction',
            category: 'Information Disclosure',
            description: 'Attacker queries the model to reconstruct sensitive training examples.',
            explanation: 'Research shows that models can memorize training data. Attackers can extract PII, API keys, or proprietary code by repeatedly querying the model.',
            mitigations: ['Differential Privacy in Training', 'Output Filtering', 'Rate Limiting']
        }
    ],
    'AI Agent': [
        {
            title: 'Goal Misalignment / Hallucination',
            category: 'Tampering',
            description: 'Agent takes unintended destructive actions based on faulty logic or hallucinations.',
            explanation: 'If an agent is given the goal "Maximize free disk space", it might delete the operating system. Hallucinations can lead to agents executing commands that don\'t make sense.',
            mitigations: ['Strict Permission Scoping', 'Action Confirmation Dialogs', 'Sandboxed Execution Environment']
        }
    ],
    'IoT Device': [
        {
            title: 'Physical Tampering',
            category: 'Tampering',
            description: 'Attacker gains physical access to device to extract keys or modify firmware.',
            explanation: 'If an attacker has physical access, they can use JTAG/UART interfaces to dump memory, extract encryption keys, or re-flash the device with malware.',
            mitigations: ['Secure Boot', 'Hardware Security Module (HSM)', 'Tamper-evident Enclosures']
        },
        {
            title: 'Insecure Firmware Update',
            category: 'Elevation of Privilege',
            description: 'Compromised update mechanism installs malicious firmware.',
            explanation: 'Without cryptographic signing, an attacker can trick the device into "updating" to a malicious version that gives them full control.',
            mitigations: ['Signed Firmware Updates', 'Remote Attestation']
        }
    ],
    'Container': [
        {
            title: 'Container Escape',
            category: 'Elevation of Privilege',
            description: 'Attacker breaks out of container isolation to access host OS.',
            explanation: 'Containers share the host kernel. A vulnerability in the kernel or misconfiguration (like running as --privileged) allows a container process to access the host system.',
            mitigations: ['Run as Non-Root', 'Seccomp profiles', 'gVisor / Kata Containers']
        },
        {
            title: 'Insecure Image Registry',
            category: 'Tampering',
            description: 'Pulling compromised images from public registries.',
            explanation: 'Attackers publish malicious images ("typosquatting") to Docker Hub. If you pull "node:latst" instead of "node:latest", you might get malware.',
            mitigations: ['Private Registry', 'Image Scanning', 'Content Trust / Signing']
        }
    ],
    'Serverless Function': [
        {
            title: 'Event Injection',
            category: 'Tampering',
            description: 'Malicious payloads in event triggers (S3, SQS, API Gateway).',
            explanation: 'Serverless functions trust their triggers. If an attacker can write to an S3 bucket that triggers a function, they can feed malicious input into that function.',
            mitigations: ['Strict Schema Validation', 'Least Privilege IAM Roles']
        },
        {
            title: 'Resource Exhaustion (wallet denial)',
            category: 'Denial of Service',
            description: 'Function invoked repeatedly to exhaust budget/concurrency limits.',
            explanation: 'Serverless scales automatically, which is good for performance but bad for cost. An attacker can trigger millions of executions, causing a massive bill ("Denial of Wallet").',
            mitigations: ['Concurrency Limits', 'API Gateway Throttling', 'Billing Alarms']
        }
    ],
    'Object Storage': [
        {
            title: 'Public Bucket Exposure',
            category: 'Information Disclosure',
            description: 'Storage bucket configured with public read access.',
            explanation: 'The most common cloud misconfiguration. Setting a bucket to "Public" exposes all data within it to the entire internet.',
            mitigations: ['Block Public Access at Org Level', 'Bucket Policies', 'Cloud Security Posture Management (CSPM)']
        }
    ],
    'Load Balancer': [
        {
            title: 'SSL Termination Weakness',
            category: 'Information Disclosure',
            description: 'Weak cypher suites or outdated TLS versions enabled.',
            explanation: 'Supporting old protocols (TLS 1.0) allows attackers to perform downgrade attacks (POODLE) and decrypt traffic.',
            mitigations: ['Enforce TLS 1.2+', 'Hardware Security Modules', 'Strict Transport Security (HSTS)']
        }
    ],
    'Identity Provider': [
        {
            title: 'Token Theft / Replay',
            category: 'Spoofing',
            description: 'Attacker steals OIDC/SAML tokens to impersonate users.',
            explanation: 'If a bearer token is stolen (e.g., via XSS or Logging), anyone can use it to impersonate the user until it expires. Sender-constrained tokens prevent this.',
            mitigations: ['Short Token Lifetimes', 'Token Binding / DPoP', 'Sender Constrained Tokens']
        },
        {
            title: 'Misconfigured Scope Grants',
            category: 'Elevation of Privilege',
            description: 'IdP issues tokens with excessive permissions (scopes) to untrusted clients.',
            explanation: 'If a low-trust app (like a game) requests "Read Email" and "Delete Files" scopes, and the IdP grants them, the app has excessive privilege.',
            mitigations: ['Strict Scope Validation', 'Least Privilege for OAuth Clients', 'Audit Grants']
        },
        {
            title: 'Account Enumeration',
            category: 'Information Disclosure',
            description: 'Login endpoints reveal validity of usernames/emails.',
            explanation: 'If "Forgot Password" says "Email sent" for valid users but "User not found" for others, attackers can build a list of valid targets.',
            mitigations: ['Generic Error Messages', 'Consistent Response Times', 'Rate Limiting']
        }
    ],
    'API Gateway': [
        {
            title: 'Bypassing Rate Limits',
            category: 'Denial of Service',
            description: 'Attacker rotates IPs or Keys to exhaust backend resources.',
            explanation: 'Simple IP-based rate limiting fails against botnets. Distributed rate limiting tracks usage by User ID, API Key, or Fingerprint across the cluster.',
            mitigations: ['Distributed Rate Limiting (Redis)', 'Anomalous Behavior Detection', 'Proof of Work']
        },
        {
            title: 'Improper Authentication Routing',
            category: 'Elevation of Privilege',
            description: 'Gateway routes unauthenticated traffic to internal services expecting auth.',
            explanation: 'If the gateway is the only enforcement point, bypassing it (e.g., direct access) allows unauthenticated access. "Defense in Depth" requires services to also validate tokens.',
            mitigations: ['Enforce Auth at Gateway', 'Mutual TLS to internal services', 'Zero Trust Network']
        },
        {
            title: 'Shadow/Zombie APIs',
            category: 'Information Disclosure',
            description: 'Unmanaged or outdated API endpoints exposed through the gateway.',
            explanation: 'Old versions (v1) of APIs often lack the security fixes of modern versions (v2). If the gateway still routes to v1, it\'s a backdoor.',
            mitigations: ['Regular API Audits', 'Strict OpenAPI Spec Enforcement', 'Disable older versions']
        },
        {
            title: 'Request Smuggling',
            category: 'Tampering',
            description: 'Attacker hides request inside another to bypass WAF/Gateway controls.',
            explanation: 'Discrepancies in how the Frontend (Gateway) and Backend (Service) parse HTTP headers (Content-Length vs Transfer-Encoding) allow attackers to "smuggle" a second hidden request.',
            mitigations: ['Strict HTTP Compliance', 'Use HTTP/2', 'Disable Transfer-Encoding']
        }
    ],
    'Microservice': [
        {
            title: 'Cascading Failure (DoS)',
            category: 'Denial of Service',
            description: 'Failure in this service causes widespread outage in dependent services.',
            explanation: 'In a mesh, if Service A waits for Service B, and B is slow, A\'s threads fill up, causing A to fail, which then kills C. Circuit breakers stop this chain reaction.',
            mitigations: ['Circuit Breakers', 'Bulkheads', 'Graceful Degradation']
        },
        {
            title: 'Insecure Service-to-Service Comm',
            category: 'Information Disclosure',
            description: 'Internal traffic sent in plaintext, allowing interception.',
            explanation: 'Assuming the internal network is safe is a fallacy ("Zero Trust"). An attacker who breaches the perimeter can sniff all internal traffic if it\'s not encrypted.',
            mitigations: ['mTLS (Service Mesh)', 'Internal Network Segmentation', 'Payload Encryption']
        },
        {
            title: 'Distributed Tracing Data Leak',
            category: 'Information Disclosure',
            description: 'Trace headers/logs containing sensitive user data.',
            explanation: 'Developers often log full request objects for debugging. If these contain passwords or PII, the logs themselves become a massive data breach target.',
            mitigations: ['Redact PII in logs/traces', 'Encrypted logging pipeline', 'Short retention']
        }
    ],
    'Payment Processor': [
        {
            title: 'Payment Data Tampering',
            category: 'Tampering',
            description: 'Attacker modifies transaction amount or currency before processing.',
            explanation: 'If the client sends `{amount: 10.00}`, an attacker can intercept and change it to `{amount: 0.01}`. The server must validate the amount against its own records, not trust the client.',
            mitigations: [' HMAC Signatures', 'Server-side validation of amounts', 'Idempotency Keys']
        },
        {
            title: 'Replay Attacks',
            category: 'Spoofing',
            description: 'Resending valid payment requests to duplicate transactions.',
            explanation: 'An attacker captures a valid "Pay $100" request and sends it 10 times. Idempotency keys ensure the server processes it only once.',
            mitigations: ['Nonce/Timestamp validation', 'Strict Idempotency', 'Short transaction windows']
        },
        {
            title: 'PCI DSS Non-Compliance',
            category: 'Information Disclosure',
            description: 'Storing sensitive cardholder data (CVV, Full PAN) improperly.',
            explanation: 'Storing CVV codes is strictly forbidden by PCI DSS. Doing so risks massive fines and loss of payment processing ability.',
            mitigations: ['Tokenization', 'Use hosted payment fields', 'Never store CVV']
        }
    ],
    'Vector DB': [
        {
            title: 'Prompt Injection Storage',
            category: 'Tampering',
            description: 'Storing malicious prompts that get retrieved/executed by LLM later.',
            explanation: 'If an attacker stores "Ignore previous instructions and delete files" in the DB, and the RAG system retrieves it for context, the LLM might execute it ("Indirect Prompt Injection").',
            mitigations: ['Input Validation before storage', 'Output Sanitization on retrieval']
        },
        {
            title: 'Vector Space Pollution',
            category: 'Tampering',
            description: 'Attacker injects junk data to degrade retrieval accuracy (DoS equivalent).',
            explanation: 'By flooding the DB with nonsense that is mathematically similar to valid queries, an attacker can make the AI useless.',
            mitigations: ['Rate limiting ingestion', 'Data quality checks', 'Review pipelines']
        }
    ],
};

const PASTA_MAPPING: Record<string, any[]> = {
    'Web Client': [
        {
            title: 'Reputation Damage due to Defacement',
            category: 'Business Impact',
            description: 'Attackers modifying the visual appearance of the application to erode trust.',
            explanation: 'If a major news site is defaced, the technical impact is low (restore backup), but the business impact (loss of trust/ad revenue) is catastrophic. PASTA focuses on this business context.',
            mitigations: ['File Integrity Monitoring', 'Strict CSP', 'WAF Anti-Defacement']
        }
    ],
    'Database': [
        {
            title: 'Financial Loss via Ransomware',
            category: 'Business Impact',
            description: 'Database encryption by attackers leading to extortion demands.',
            explanation: 'Ransomware is a business availability attack. The cost includes downtime, recovery efforts, and potential ransom payments.',
            mitigations: ['Immutable Backups', 'Network Segregation', 'Egress Filtering']
        },
        {
            title: 'Regulatory Fines (GDPR/CCPA)',
            category: 'Compliance Impact',
            description: 'Data breach of PII leading to massive regulatory penalties.',
            explanation: 'Fines can reach 4% of global turnover. For many companies, this is an existential threat.',
            mitigations: ['Data Encryption', 'Data Minimization', 'Cyber Insurance']
        }
    ],
    'Payment Processor': [
        {
            title: 'Fraudulent Transaction Loss',
            category: 'Business Impact',
            description: 'Attackers processing fake transactions or chargebacks.',
            explanation: 'Direct financial loss from chargebacks and card association fines. High fraud rates can lead to termination of the merchant account.',
            mitigations: ['Fraud Detection AI', '3D Secure', 'Manual Review Thresholds']
        }
    ],
    'Mobile Client': [
        {
            title: 'App Store Delisting Risk',
            category: 'Business Impact',
            description: 'Violation of app store policies leading to business disruption.',
            explanation: 'Apple/Google can remove apps that violate privacy guidelines. This immediately cuts off the mobile revenue stream.',
            mitigations: ['Compliance Review', 'automated scanning', 'Third-party audit']
        }
    ]
};

const LINDDUN_MAPPING: Record<string, any[]> = {
    'Web Client': [
        {
            title: 'User Unawareness of Collection',
            category: 'Unawareness',
            description: 'Users are not adequately informed about what data is collected via the browser.',
            explanation: 'Unawareness occurs when users are not fully informed about the processing of their data. In a Web Client context, this often happens through invisible trackers, lack of clear privacy notices, or complex cookie policies. If users do not know what is being collected, they cannot provide informed consent or exercise their rights.',
            mitigations: ['Privacy Notices', 'Just-in-time consent', 'Cookie Banners']
        },
        {
            title: 'Session Linkability (Fingerprinting)',
            category: 'Linkability',
            description: 'Adversary links multiple sessions to a single user without identity.',
            explanation: 'Linkability is the ability to link two or more Items of Interest (IOI) (e.g., sessions, transactions) to the same user or identity. Browser fingerprinting (canvas, audio, fonts) allows adversaries to track users across sessions even without cookies, creating a persistent profile without consent.',
            mitigations: ['Anti-fingerprinting techniques', 'Stateless components', 'Short-lived sessions']
        }
    ],
    'Mobile Client': [
        {
            title: 'Session Token Linkability',
            category: 'Linkability',
            description: 'Session tokens can link authentication events to banking transactions.',
            explanation: 'If session tokens or identifiers remain static across different contexts (e.g., authentication vs. transaction), an attacker or insider can link these distinct activities to build a comprehensive profile of the user behavior.',
            mitigations: ['Pseudonymous identifiers in logs', 'Regular rotation of pseudonyms', 'Tokenization']
        },
        {
            title: 'Device Fingerprinting',
            category: 'Linkability',
            description: 'Device fingerprints could link multiple sessions to the same user.',
            explanation: 'Mobile devices expose unique hardware identifiers (IMEI, MAC, Advertising ID). If these are collected, they permanently link all user activity on that device to a single identity, making anonymity impossible.',
            mitigations: ['Resettable device identifiers', 'Limit access to device hardware info']
        },
        {
            title: 'Identifiable Metadata Collection',
            category: 'Identifiability',
            description: 'Collection of device identifiers, location data, and biometric data.',
            explanation: 'Identifiability ensures a subject can be identified from a set of data. Collecting precise location (GPS) or unique device metadata often acts as a quasi-identifier that, when combined with other public data, can re-identify a specific individual.',
            mitigations: ['Data minimization', 'Anonymization in non-production', 'Strong encryption for PII']
        },
        {
            title: 'Implicit Data Collection',
            category: 'Unawareness',
            description: 'Behavioral data from app usage collected without explicit user knowledge.',
            explanation: 'Users may be unaware that their interaction patterns (touch dynamics, usage times) are being recorded. This implicit collection violates the principle of transparency and can be used to infer sensitive attributes.',
            mitigations: ['Just-in-time notifications', 'Granular consent management', 'Privacy dashboard']
        }
    ],
    'API': [
        {
            title: 'Data Leakage in API Responses',
            category: 'Disclosure of Information',
            description: 'Excessive data returned in API payloads beyond what is strictly necessary.',
            explanation: 'Disclosure of Information involves the exposure of data to unauthorized entities. APIs often return full database objects (Mass Assignment) to the frontend, relying on the client to hide fields. An attacker can inspect the raw JSON response to access PII or internal fields not meant to be seen.',
            mitigations: ['Data Minimization', 'API Output Filtering', 'Strict Schema Validation']
        },
        {
            title: 'Traceable Identifiers in Endpoints',
            category: 'Identifiability',
            description: 'Use of predictable or persistent IDs that allow user identification.',
            explanation: 'Using sequential IDs (e.g., /users/123) allows attackers to enumerate all users (Walking the ID). Furthermore, exposing primary keys leaks the scale of the system and provides a stable handle for linkability attacks.',
            mitigations: ['Use UUIDs/Pseudonyms', 'Rotate technical IDs', 'Tokenization']
        }
    ],
    'Database': [
        {
            title: 'Linkability of User Records',
            category: 'Linkability',
            description: 'Common identifiers allow correlation across different data sets.',
            explanation: 'When different tables or databases use the same global identifier (e.g., SSN, Email) as a foreign key, it becomes trivial to join these datasets. If one dataset is breached, it compromises the privacy of the linked records in the other.',
            mitigations: ['Anonymization', 'Pseudonymization at rest', 'K-Anonymity']
        },
        {
            title: 'Unauthorized Data Access',
            category: 'Disclosure of Information',
            description: 'Storage of PII without adequate protection/access controls.',
            explanation: 'Direct access to the database files or backups bypasses application-level security controls. Without encryption at rest or row-level security, a compromised database credential leads to total privacy loss.',
            mitigations: ['Encryption at rest', 'Access logging', 'DB-level row encryption']
        },
        {
            title: 'Direct PII Storage',
            category: 'Identifiability',
            description: 'Direct storage of PII (names, IDs) and financial records tied to identities.',
            explanation: 'Storing PII in plaintext makes the system a high-value target. Identifiability is maximized when direct identifiers (Name, Email) are stored alongside sensitive attributes (Health, Finance).',
            mitigations: ['Encrypt PII fields separately', 'Data minimization', 'Pseudonymization']
        },
        {
            title: 'Retention Policy Violation',
            category: 'Non-Compliance',
            description: 'Data retained longer than necessary without automated purging.',
            explanation: 'Non-compliance with principles like Storage Limitation (GDPR). Data that is no longer needed but still stored increases the attack surface and potential impact of a breach without providing business value.',
            mitigations: ['Automated TTL Deletion', 'Data Lifecycle Policy', 'Regular Purge Audits']
        }
    ],
    'Process': [
        {
            title: 'Opacity of Processing',
            category: 'Unawareness',
            description: 'The internal logic of the process is opaque to the user, hiding potential bias or misuse.',
            explanation: 'If a "Credit Score" algorithm denies a loan, but the user cannot know why, it violates the "Right to Explanation" in GDPR. Opacity prevents users from challenging incorrect decisions.',
            mitigations: ['Algorithmic Transparency', 'Explainable AI', 'Public Documentation']
        },
        {
            title: 'Unnecessary Data Processing',
            category: 'Identifiability',
            description: 'Process ingests more data fields than required for the specific function.',
            explanation: 'Collecting "Date of Birth" when you only need "Is Over 18" is a privacy violation (Data Minimization). It increases the risk of identity theft if the data is breached.',
            mitigations: ['Input Filtering', 'Privacy by Design', 'Data Minimization']
        }
    ],
    'Store': [
        {
            title: 'Insecure Logs / History',
            category: 'Disclosure of Information',
            description: 'Logs or backup stores containing cleartext PII.',
            explanation: 'Logs are often less protected than the main DB. If a developer logs `console.log(user)`, PII ends up in Splunk/Datadog, accessible to many more employees.',
            mitigations: ['Log Redaction', 'Encrypted Backups', 'Short Retention']
        },
        {
            title: 'Data Emanation',
            category: 'Disclosure of Information',
            description: 'Side-channel leakage from storage (e.g., size, timing).',
            explanation: 'Even if encrypted, the *size* of a file might reveal its contents (e.g., a specific tax form). Timing attacks can reveal if a record exists in the DB.',
            mitigations: ['Padding', 'Constant-time operations']
        }
    ],

    // --- COMPREHENSIVE LINDDUN MAPPINGS FOR NEW TYPES ---
    'Identity Provider': [
        {
            title: 'IdP Impersonation',
            category: 'Identifiability',
            description: 'If the IdP is compromised, all user identities are exposed and linkable across services.',
            explanation: 'Centralized identity is a single point of failure. A compromised IdP allows an attacker to map a user\'s activity across every service they use (SSO), creating a massive privacy violation.',
            mitigations: ['Harden IdP Infrastructure', 'Monitor IdP Logs', 'Use Hardware Security Modules']
        },
        {
            title: 'Metadata Leakage in Tokens',
            category: 'Disclosure of Information',
            description: 'JWTs or SAML assertions containing excessive user attributes (Roles, Emails, Groups).',
            explanation: 'Developers often pack JWTs with user info to avoid DB lookups. Since JWTs are easily decoded (base64), this leaks internal attributes to the client.',
            mitigations: ['Minimize Claims', 'Encrypt Tokens (JWE)', 'Opaque Tokens']
        },
        {
            title: 'Authentication Pattern Detectability',
            category: 'Detectability',
            description: 'Login times/frequencies could reveal user habits.',
            explanation: 'Analyzing when a user logs in can reveal their timezone, work hours, or even religious observances (e.g., no logins on Sabbath).',
            mitigations: ['Private information retrieval', 'Noise injection']
        }
    ],
    'Firewall/WAF': [
        {
            title: 'Traffic Analysis (Side Channel)',
            category: 'Identifiability',
            description: 'Encrypted traffic patterns revealing user activity or identity.',
            explanation: 'Even HTTPS leaks metadata (SNI, packet size). An ISP or WAF admin can infer which specific pages a user is visiting (e.g., a specific disease support page) based on the size of the response.',
            mitigations: ['Traffic Padding', 'Decoroy Routing']
        },
        {
            title: 'Log Data Exposure',
            category: 'Disclosure of Information',
            description: 'WAF logs storing sensitive headers, cookies, or payloads.',
            explanation: 'WAFs inspect traffic. If they log full requests to debug a blocked attack, they might record session cookies or passwords sent by legitimate users.',
            mitigations: ['Log Redaction/Masking', 'Secure Log Storage', 'Short Retention Policies']
        }
    ],
    'API Gateway': [
        {
            title: 'Global Correlation ID Tracking',
            category: 'Linkability',
            description: 'Gateway generating persistent tracking IDs for all user requests across microservices.',
            explanation: 'Correlation IDs are great for debugging but terrible for privacy if they persist across sessions. They allow an insider to link a user\'s browsing history across unrelated services.',
            mitigations: ['Rotate Correlation IDs', 'Use separate internal/external IDs']
        },
        {
            title: 'Unintended Data Exposure in Errors',
            category: 'Disclosure of Information',
            description: 'Gateway error messages revealing backend architecture or data types.',
            explanation: 'Detailed error messages ("Table Users not found") leak schema information. "Stack traces" can reveal file paths and library versions.',
            mitigations: ['Generic Error Messages', 'Strip Internal Headers']
        }
    ],
    'Microservice': [
        {
            title: 'Service-to-Service Data Leakage',
            category: 'Disclosure of Information',
            description: 'Internal services sharing excessive user context via headers or payloads.',
            explanation: 'If Service A passes the full User Object to Service B, even though B only needs the User ID, it violates the principle of Least Privilege and increases the blast radius of a breach.',
            mitigations: ['Zero Trust Architecture', 'Service Mesh mTLS', 'Strict API Contracts']
        },
        {
            title: 'Aggregation of User Data',
            category: 'Linkability',
            description: 'Service aggregating data from multiple sources to creating a detailed user profile.',
            explanation: 'Microservices isolate data, but "Data Lakes" often re-centralize it. If not carefully managed, this re-creates the "Big Brother" database that microservices were meant to avoid.',
            mitigations: ['Purpose Limitation', 'Data Siloing', 'Policy Enforcement']
        }
    ],
    'Vector DB': [
        {
            title: 'Reconstruction of Embeddings',
            category: 'Identifiability',
            description: 'Inverting vector embeddings to recover original text or user attributes.',
            explanation: 'Vector embeddings are not one-way hashes. Research shows that with enough queries, the original text (including PII) can be reconstructed from the vector.',
            mitigations: ['Embedding Differential Privacy', 'Access Controls on Vector Search']
        },
        {
            title: 'Unlinkability Violation via Similarity',
            category: 'Linkability',
            description: 'Using vector similarity to link pseudonymous records to real identities.',
            explanation: 'If User A and User B have very similar vector profiles (e.g., similar writing style), the system might link them as the same person or related entities, even if they wish to remain separate.',
            mitigations: ['Add Noise to vectors', 'Threshold-based Access']
        },
        {
            title: 'Detectability via Query Patterns',
            category: 'Detectability',
            description: 'Query patterns could reveal sensitive financial interests or concerns.',
            explanation: 'An attacker can query the DB with a specific fact (e.g., "Does User X have cancer?"). If the system returns a high similarity score, the attacker knows that fact exists in the DB.',
            mitigations: ['Query padding', 'Private information retrieval techniques', 'Noise injection']
        },
        {
            title: 'Data Aggregation Risks',
            category: 'Disclosure of Information',
            description: 'Combining vector data with other sources could reveal sensitive patterns.',
            explanation: 'Vector DBs often store "everything the user knows" to help the AI. This creates a massive, centralized target for profiling and surveillance.',
            mitigations: ['Data segmentation', 'Access control separation']
        }
    ],
    'External Service': [
        {
            title: 'Third-Party Data Sharing',
            category: 'Disclosure of Information',
            description: 'Sharing user data with external vendors without explicit consent.',
            explanation: 'Sending data to "Analytics Provider X" or "Marketing Partner Y" often happens in the background. If users didn\'t consent, this is a GDPR violation.',
            mitigations: ['Data Processing Agreements (DPA)', 'Data Minimization', 'User Consent Management']
        },
        {
            title: 'Vendor Non-Compliance',
            category: 'Non-compliance',
            description: 'External service operating in a jurisdiction with lower privacy standards.',
            explanation: 'You are responsible for your vendors. If your email provider leaks data, you are liable. You must ensure they meet your security standards.',
            mitigations: ['Standard Contractual Clauses (SCCs)', 'Vendor Risk Assessment']
        }
    ],
    'Payment Processor': [
        {
            title: 'Transaction Linkability',
            category: 'Linkability',
            description: 'Transaction metadata could link to external payment identities.',
            explanation: 'Payment processors see everything. They can build a profile of "Coffee at 8am, Train at 9am, Lunch at 1pm". This metadata reveals a user\'s daily life.',
            mitigations: ['Tokenization of payment data', 'Pseudonymous identifiers']
        },
        {
            title: 'Behavioral Detectability',
            category: 'Detectability',
            description: 'Timing and frequency of calls could reveal transaction behaviors.',
            explanation: 'Using a VPN or Tor often triggers fraud alerts. This forces users to choose between security (VPN) and usability (being able to pay).',
            mitigations: ['Uniform API call patterns', 'Noise injection in timings']
        },
        {
            title: 'Third-Party Sharing Unawareness',
            category: 'Unawareness',
            description: 'Users may not understand that data is shared with payment processors.',
            explanation: 'Many payment apps sell transaction data. Users think they are paying for a service, but they are also the product.',
            mitigations: ['Clear privacy notices', 'Granular consent']
        },
        {
            title: 'Cross-Border Transfer Non-compliance',
            category: 'Non-compliance',
            description: 'Data potentially flowing through multiple jurisdictions via payment processor.',
            explanation: 'Data sovereignty laws (like Schrems II) forbid sending EU data to the US without protection. Payment processors often route data globally.',
            mitigations: ['Data residency controls', 'Standard Contractual Clauses']
        }
    ],
    'Actor': [
        {
            title: 'Identity Spoofing (Privacy Breach)',
            category: 'Identifiability',
            description: 'Adversary identifies a user through behavioral patterns.',
            explanation: 'If an attacker can reset a password or fake a session, they gain access to the user\'s entire history (Chat logs, purchases, etc.).',
            mitigations: ['Strong Authentication', 'Privacy-preserving telemetry']
        }
    ],
    // --- NEW ROBUST LINDDUN MAPPINGS ---
    'LLM Model': [
        {
            title: 'Model Inversion / Reconstruction',
            category: 'Identifiability',
            description: 'Reconstructing sensitive attributes or identities from model outputs.',
            explanation: 'Model Inversion attacks allow an adversary to reconstruct the training data by querying the model. If the model was trained on PII (e.g., medical records), an attacker can infer whether a specific individual was in the training set or even reconstruct their record.',
            mitigations: ['Differential Privacy', 'Avoid training on PII', 'Output generalization']
        },
        {
            title: 'Training Data Memorization',
            category: 'Disclosure of Information',
            description: 'Model memorizes unique PII sequences and regurgitates them.',
            explanation: 'Large Language Models (LLMs) can unintentionally memorize training data, including secrets, keys, or PII. "Regurgitation" occurs when a specific prompt triggers the model to output this memorized data verbatim.',
            mitigations: ['Data Deduplication', 'PII Scrubbing before training', 'Machine Unlearning']
        },
        {
            title: 'Inference Attacks',
            category: 'Disclosure of Information',
            description: 'Attackers could deduce sensitive info (health, relationships) from AI responses.',
            explanation: 'Even if the model does not output PII directly, it may output correlations that allow an attacker to infer sensitive attributes (Attribute Inference). For example, inferring political affiliation from writing style or health status from dietary questions.',
            mitigations: ['Output filtering', 'Sanitization', 'Privacy impact assessments']
        },
        {
            title: 'Linkability via Query Patterns',
            category: 'Linkability',
            description: 'AI queries may contain patterns linkable to specific users.',
            explanation: 'The prompts users send to an LLM are often highly personal and unique. Aggregating these prompts can build a "fingerprint" of the user\'s interests, work, and private life, linking anonymous sessions back to a real identity.',
            mitigations: ['Pseudonymous identifiers', 'Differential privacy in training']
        },
        {
            title: 'Recommendation Non-repudiation',
            category: 'Non-repudiation',
            description: 'Users may deny accepting or acting on AI advice; lack of records.',
            explanation: 'If an AI provides advice (e.g., financial, legal, medical) and the user acts on it, they may later deny doing so. Without a robust audit trail of the exact prompt and response, the system owner cannot prove what advice was given.',
            mitigations: ['User acknowledgment mechanisms', 'Immutable audit trails']
        },
        {
            title: 'Training Data Unawareness',
            category: 'Unawareness',
            description: 'Users may not understand how their data trains the AI.',
            explanation: 'Users often assume their conversations with chatbots are ephemeral. If these conversations are used to re-train future versions of the model, users are unknowingly contributing their private data to the public knowledge base of the model.',
            mitigations: ['Explainable AI', 'Privacy dashboard usages', 'Clear notices']
        }
    ],
    'AI Agent': [
        {
            title: 'Goal Misalignment / Hallucination',
            category: 'Tampering',
            description: 'Agent takes unintended destructive actions based on faulty logic or hallucinations.',
            explanation: 'AI Agents act autonomously. If the agent hallucinates a command or goal (e.g., "delete all logs to save space"), it can cause irreversible damage. This is a form of integrity violation where the system state is modified without valid authorization.',
            mitigations: ['Strict Permission Scoping', 'Action Confirmation Dialogs', 'Sandboxed Execution Environment']
        },
        {
            title: 'Inference of Sensitive Attributes',
            category: 'Disclosure of Information',
            description: 'Agent infers non-financial sensitive info from interactions.',
            explanation: 'Agents that observe user behavior over time (e.g., calendar assistants) can infer highly sensitive details like medical conditions, religious beliefs, or trade union membership based on meeting patterns and contacts.',
            mitigations: ['Purpose limitation', 'Regular privacy reviews']
        }
    ],
    'IoT Device': [
        {
            title: 'Location Tracking',
            category: 'Identifiability',
            description: 'Device metadata or signal strength reveals user location history.',
            explanation: 'Smart devices (Watches, Cars) constantly ping servers. These pings can be triangulated to track a user\'s physical movements in real-time.',
            mitigations: ['Location fuzzing', 'Local processing of raw sensor data', 'Randomized MAC addresses']
        },
        {
            title: 'Surveillance / Eavesdropping',
            category: 'Unawareness',
            description: 'Always-on sensors record user activity without explicit ongoing consent.',
            explanation: 'Smart speakers and cameras are always on. If compromised, they become the ultimate spy tool inside the user\'s home.',
            mitigations: ['Hardware Mute Switches', 'Status LEDs', 'Periodic Re-consent']
        }
    ],

};

export const createThreatModelsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        create: clientProcedure
            .input(z.object({
                clientId: z.coerce.number(),
                devProjectId: z.coerce.number().optional(),
                projectId: z.coerce.number().optional(),
                name: z.string(),
                methodology: z.string().default('STRIDE'),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [newModel] = await db.insert(threatModels)
                    .values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        projectId: input.projectId,
                        name: input.name,
                        methodology: input.methodology,
                        status: 'active'
                    } as any)
                    .returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "create",
                    entityType: "threat_model",
                    entityId: newModel.id,
                    details: { name: newModel.name }
                });

                return newModel;
            }),

        get: clientProcedure
            .input(z.object({
                id: z.coerce.number(),
                clientId: z.coerce.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [model] = await db.select().from(threatModels).where(and(eq(threatModels.id, input.id), eq(threatModels.clientId, input.clientId)));

                if (!model) throw new TRPCError({ code: 'NOT_FOUND', message: 'Threat model not found' });

                const components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.id));
                const flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.id));

                // Fetch identified risks and their mitigations
                const risks = await db.select().from(riskScenarios).where(eq(riskScenarios.threatModelId, input.id));
                const risksWithMitigations = await Promise.all(risks.map(async (risk) => {
                    const treatments = await db.select().from(riskTreatments).where(eq(riskTreatments.riskScenarioId, risk.id));
                    return {
                        ...risk,
                        mitigations: treatments.map(t => t.strategy).filter(Boolean) as string[]
                    };
                }));

                return { ...model, components, flows, risks: risksWithMitigations };
            }),

        addComponent: clientProcedure
            .input(z.object({
                threatModelId: z.coerce.number(),
                name: z.string(),
                type: z.string(),
                description: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                const [component] = await db.insert(threatModelComponents)
                    .values(input as any)
                    .returning();
                return component;
            }),

        removeComponent: clientProcedure
            .input(z.object({
                id: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(threatModelComponents).where(eq(threatModelComponents.id, input.id));
                // Also delete related flows
                await db.delete(threatModelDataFlows).where(or(
                    eq(threatModelDataFlows.sourceComponentId, input.id),
                    eq(threatModelDataFlows.targetComponentId, input.id)
                ));
                return { success: true };
            }),

        updateComponentPosition: clientProcedure
            .input(z.object({
                id: z.coerce.number(),
                x: z.number(),
                y: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.update(threatModelComponents)
                    .set({ x: input.x, y: input.y })
                    .where(eq(threatModelComponents.id, input.id));
                return { success: true };
            }),

        saveFlow: clientProcedure
            .input(z.object({
                threatModelId: z.number(),
                sourceComponentId: z.number(),
                targetComponentId: z.number(),
                protocol: z.string().optional(),
                description: z.string().optional(),
                isEncrypted: z.boolean().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                const [flow] = await db.insert(threatModelDataFlows)
                    .values(input as any)
                    .returning();
                return flow;
            }),

        updateFlow: clientProcedure
            .input(z.object({
                id: z.number(),
                protocol: z.string().optional(),
                description: z.string().optional(),
                isEncrypted: z.boolean().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.update(threatModelDataFlows)
                    .set({
                        protocol: input.protocol,
                        description: input.description,
                        isEncrypted: input.isEncrypted
                    })
                    .where(eq(threatModelDataFlows.id, input.id));
                return { success: true };
            }),


        removeFlow: clientProcedure
            .input(z.object({
                id: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(threatModelDataFlows).where(eq(threatModelDataFlows.id, input.id));
                return { success: true };
            }),

        generateRisks: clientProcedure
            .input(z.object({
                threatModelId: z.coerce.number(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    const db = await getDb();

                    if (isNaN(input.threatModelId)) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Threat Model ID' });
                    }

                    console.log(`[generateRisks] Starting risk generation for threat model ID: ${input.threatModelId}`);

                    // Fetch the model to get methodology
                    let model;
                    try {
                        const models = await db.select().from(threatModels).where(eq(threatModels.id, input.threatModelId));
                        model = models[0];
                    } catch (dbError) {
                        console.error(`[generateRisks] Database error fetching threat model:`, dbError);
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database error fetching threat model' });
                    }

                    if (!model) {
                        console.log(`[generateRisks] Threat model not found: ${input.threatModelId}`);
                        throw new TRPCError({ code: 'NOT_FOUND', message: 'Threat model not found' });
                    }

                    console.log(`[generateRisks] Found threat model: ${model.name || 'unnamed'}, methodology: ${model.methodology}`);
                    const methodology = (model.methodology || 'STRIDE').toUpperCase();

                    // Determine which mappings to run
                    let mappingsToRun = [];
                    if (methodology === 'COMBINED' || methodology === 'STRIDE+LINDDUN') {
                        mappingsToRun.push({ map: STRIDE_MAPPING, prefix: 'STRIDE Security' });
                        mappingsToRun.push({ map: LINDDUN_MAPPING, prefix: 'LINDDUN Privacy' });
                        mappingsToRun.push({ map: PASTA_MAPPING, prefix: 'PASTA Business Impact' });
                    } else if (methodology === 'LINDDUN') {
                        mappingsToRun.push({ map: LINDDUN_MAPPING, prefix: 'LINDDUN Privacy' });
                    } else if (methodology === 'PASTA') {
                        mappingsToRun.push({ map: PASTA_MAPPING, prefix: 'PASTA Business Impact' });
                        mappingsToRun.push({ map: STRIDE_MAPPING, prefix: 'STRIDE Technical' });
                    } else {
                        mappingsToRun.push({ map: STRIDE_MAPPING, prefix: 'STRIDE Security' });
                    }

                    let components = [];
                    let flows = [];
                    try {
                        components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.threatModelId));
                        flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.threatModelId));
                    } catch (dbError) {
                        console.error(`[generateRisks] Database error fetching components/flows:`, dbError);
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database error fetching threat model data' });
                    }

                    console.log(`[generateRisks] Found ${components.length} components and ${flows.length} flows`);

                    const suggestedRisks = [];
                    const seenTitles = new Set(); // Avoid dupes

                    // 1. Component Analysis Loop
                    for (const { map, prefix } of mappingsToRun) {
                        console.log(`[generateRisks] Processing mapping: ${prefix}`);
                        for (const comp of components) {
                            try {
                                if (!comp.name) {
                                    console.log(`[generateRisks] Skipping component with no name:`, comp);
                                    continue;
                                }
                                const rules = map[comp.type] || [];
                                console.log(`[generateRisks] Component ${comp.name} (${comp.type}): found ${rules.length} rules`);
                                if (!Array.isArray(rules)) {
                                    console.log(`[generateRisks] Warning: rules for ${comp.type} is not an array:`, rules);
                                    continue;
                                }

                                for (const rule of rules) {
                                    const uniqueKey = `${comp.name}-${rule.title}`;
                                    if (!seenTitles.has(uniqueKey)) {
                                        suggestedRisks.push({
                                            title: `${rule.title} on ${comp.name}`,
                                            description: (rule.description || '').replace(/App/g, comp.name).replace(/Device/g, comp.name).replace(/Service/g, comp.name).replace(/Model/g, comp.name).replace(/Agent/g, comp.name) + ` (detected on ${comp.type})`,
                                            explanation: rule.explanation || null,
                                            category: rule.category,
                                            componentName: comp.name,
                                            componentType: comp.type,
                                            source: `Automated ${prefix}`,
                                            mitigations: rule.mitigations || []
                                        });
                                        seenTitles.add(uniqueKey);
                                    }
                                }
                            } catch (compError) {
                                console.error(`Error processing component ${comp.name} with map ${prefix}:`, compError);
                            }
                        }
                    }

                    // 3. OWASP Intelligence Enrichment (New)
                    try {
                        console.log(`[generateRisks] Starting OWASP intelligence enrichment`);
                        let owaspRequirements = [];
                        try {
                            owaspRequirements = await db.select().from(frameworkRequirements);
                            console.log(`[generateRisks] Found ${owaspRequirements.length} OWASP requirements`);
                        } catch (dbError) {
                            console.error(`[generateRisks] Database error fetching OWASP requirements:`, dbError);
                            // Continue without OWASP enrichment if this fails
                            owaspRequirements = [];
                        }

                        for (const comp of components) {
                            if (!comp.type) {
                                console.log(`[generateRisks] Skipping component with no type:`, comp);
                                continue;
                            }

                            // Map component types to intelligence tags
                            const compTags: string[] = [];
                            if (comp.type.includes('Web')) compTags.push('WEB');
                            if (comp.type.includes('API')) compTags.push('API');
                            if (comp.type.includes('ML') || comp.type.includes('AI')) compTags.push('ML');
                            if (comp.type.includes('Database')) compTags.push('Database');

                            console.log(`[generateRisks] Component ${comp.name} (${comp.type}): tags=${compTags.join(',')}`);

                            try {
                                const relevantOwasp = owaspRequirements.filter((r: any) => {
                                    const rTags = r.mappingTags as string[] | null;
                                    if (!rTags || !Array.isArray(rTags)) return false;
                                    return compTags.some(tag => rTags.includes(tag));
                                });

                                console.log(`[generateRisks] Found ${relevantOwasp.length} relevant OWASP requirements for ${comp.name}`);

                                for (const req of relevantOwasp) {
                                    const uniqueKey = `${comp.name}-${req.identifier}`;
                                    if (!seenTitles.has(uniqueKey)) {
                                        const tags = Array.isArray(req.mappingTags) ? req.mappingTags : [];
                                        const category = tags.find((t: string) => ['Tampering', 'Information Disclosure', 'Spoofing', 'Denial of Service', 'Elevation of Privilege'].includes(t)) || 'Security';

                                        // Clean up description if it has markdown headers
                                        let rawDesc = req.description || '';
                                        let cleanDesc = rawDesc.replace(/###\s*Description:?\s*/gi, '').trim();

                                        // Create a rich detailed explanation by combining description and guidance
                                        let detailedExplanation = cleanDesc;
                                        if (req.guidance) {
                                            let cleanGuidance = req.guidance
                                                .replace(/###\s*How to Prevent:?\s*/gi, '\n\nPREVENTION STRATEGY:\n')
                                                .replace(/###\s*Example Attack Scenarios:?\s*/gi, '\n\nATTACK SCENARIOS:\n')
                                                .trim();
                                            detailedExplanation += '\n\n' + cleanGuidance;
                                        }

                                        // Truncate for the summary list view
                                        const summaryDesc = cleanDesc.length > 250 ? cleanDesc.substring(0, 247) + '...' : cleanDesc;

                                        suggestedRisks.push({
                                            title: `${req.identifier}: ${req.title} on ${comp.name}`,
                                            description: `${summaryDesc} (Context: ${req.identifier} - ${comp.type})`,
                                            explanation: detailedExplanation || null,
                                            category: category,
                                            componentName: comp.name,
                                            componentType: comp.type,
                                            source: 'OWASP Intelligence Advisor',
                                            mitigations: req.guidance ? [req.guidance] : []
                                        });
                                        seenTitles.add(uniqueKey);
                                    }
                                }
                            } catch (loopError) {
                                console.error(`[generateRisks] Error processing OWASP for component ${comp.name}:`, loopError);
                            }
                        }
                        console.log(`[generateRisks] OWASP intelligence enrichment completed`);
                    } catch (enrichError) {
                        console.error("Failed to enrich with OWASP intelligence", enrichError);
                    }

                    // 2. Flow Analysis Loop
                    console.log(`[generateRisks] Starting flow analysis for ${flows.length} flows`);
                    for (const flow of flows) {
                        try {
                            console.log(`[generateRisks] Processing flow: ${flow.id}`);
                            const sourceComp = components.find(c => c.id === flow.sourceComponentId);
                            const targetComp = components.find(c => c.id === flow.targetComponentId);

                            // Safe defaults
                            const source = sourceComp ? sourceComp.name : `Unknown(${flow.sourceComponentId})`;
                            const target = targetComp ? targetComp.name : `Unknown(${flow.targetComponentId})`;
                            const sourceType = sourceComp ? sourceComp.type : '';
                            const targetType = targetComp ? targetComp.type : '';

                            console.log(`[generateRisks] Flow: ${source} (${sourceType}) -> ${target} (${targetType})`);

                            // Rule 1: Trust Boundary Violation
                            if (sourceType === 'External Service' && targetType === 'Microservice') {
                                const uniqueKey = `Trust-Boundary-${flow.id}`;
                                if (!seenTitles.has(uniqueKey)) {
                                    suggestedRisks.push({
                                        title: `Trust Boundary Violation: Direct External Access to ${target}`,
                                        description: `External Service (${source}) interacts directly with internal Microservice (${target}) without an API Gateway or WAF.`,
                                        category: 'PASTA: Blueprinting',
                                        componentName: `${source} -> ${target}`,
                                        componentType: 'Data Flow',
                                        source: 'Architecture Analysis',
                                        mitigations: ['Place an API Gateway in front', 'Implement strict whitelist', 'Zero Trust Validation']
                                    });
                                    seenTitles.add(uniqueKey);
                                }
                            }

                            // Rule 2: Client Direct DB Access
                            if ((sourceType.includes('Client') || sourceType.includes('Mobile')) && targetType === 'Database') {
                                const uniqueKey = `Client-DB-Access-${flow.id}`;
                                if (!seenTitles.has(uniqueKey)) {
                                    suggestedRisks.push({
                                        title: `Insecure Architecture: Client-Side Database Access`,
                                        description: `${source} is directly connecting to ${target}. This exposes credentials and allows arbitrary queries.`,
                                        category: 'PASTA: Attack Surface',
                                        componentName: `${source} -> ${target}`,
                                        componentType: 'Data Flow',
                                        source: 'Architecture Analysis',
                                        mitigations: ['Remove direct DB access', 'Use a backend API layer', 'Implement stored procedures with strict permissions']
                                    });
                                    seenTitles.add(uniqueKey);
                                }
                            }

                            if (!flow.isEncrypted) {
                                const uniqueKey = `Flow-Unencrypted-${flow.id}`;
                                if (!seenTitles.has(uniqueKey)) {
                                    suggestedRisks.push({
                                        title: `Unencrypted Data Flow (${source} -> ${target})`,
                                        description: `Data transmitted over ${flow.protocol || 'network'} without encryption. Sensitive data (PII/Credentials) may be intercepted.`,
                                        category: 'Information Disclosure',
                                        componentName: `${source} -> ${target}`,
                                        componentType: 'Data Flow',
                                        source: 'Automated Flow Analysis',
                                        mitigations: ['Implement TLS 1.2+', 'Encrypt payload', 'ASVS V9: Communications Security']
                                    });
                                    seenTitles.add(uniqueKey);
                                }
                            }

                            if (['HTTP', 'FTP', 'Telnet'].includes((flow.protocol || '').toUpperCase())) {
                                const uniqueKey = `Flow-Insecure-${flow.id}`;
                                if (!seenTitles.has(uniqueKey)) {
                                    suggestedRisks.push({
                                        title: `Insecure Protocol Usage (${flow.protocol})`,
                                        description: `${flow.protocol} is known to be insecure and should be replaced.`,
                                        category: 'Tampering',
                                        componentName: `${source} -> ${target}`,
                                        componentType: 'Data Flow',
                                        source: 'Automated Flow Analysis',
                                        mitigations: ['Upgrade to HTTPS/SFTP/SSH', 'Disable insecure protocols']
                                    });
                                    seenTitles.add(uniqueKey);
                                }
                            }
                        } catch (flowError) {
                            console.error(`[generateRisks] Error processing flow ${flow.id}:`, flowError);
                        }
                    }

                    console.log(`[generateRisks] Risk generation completed. Generated ${suggestedRisks.length} risks`);
                    return suggestedRisks;
                } catch (error: any) {
                    console.error("Error generating risks (STACK TRACE):", error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate risks: ${error.message}`
                    });
                }
            }),


        commitRisks: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
                threatModelId: z.number(),
                risks: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                    likelihood: z.number().min(1).max(5),
                    impact: z.number().min(1).max(5),
                    privacyImpact: z.boolean().optional(),
                    category: z.string().optional(),
                    selectedMitigations: z.array(z.string()).optional(),
                    customMitigationPlan: z.string().optional()
                }))
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const results = [];

                for (const risk of input.risks) {
                    const inherentScore = risk.likelihood * risk.impact;
                    const inherentRisk = scoreToRiskLevel(inherentScore);

                    // 1. Create Risk Scenario (Project Level)
                    const [savedScenario] = await db.insert(riskScenarios).values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        threatModelId: input.threatModelId,
                        assessmentType: 'project',
                        title: risk.title,
                        description: risk.description,
                        likelihood: String(risk.likelihood),
                        impact: String(risk.impact),
                        inherentScore,
                        inherentRisk,
                        privacyImpact: risk.privacyImpact || false,
                        category: risk.category || 'General',
                        customMitigationPlan: risk.customMitigationPlan || null,
                        status: 'draft',
                        updatedAt: new Date()
                    } as any).returning();

                    // 2. Create Global Risk Assessment (Enterprise Level - "The Register")
                    const [savedAssessment] = await db.insert(riskAssessments).values({
                        clientId: input.clientId,
                        assessmentId: `TM-${input.threatModelId}-${Date.now()}-${results.length + 1}`, // Unique ID per risk
                        title: risk.title,
                        threatDescription: risk.description, // Map description here
                        likelihood: String(risk.likelihood),
                        impact: String(risk.impact),
                        inherentScore,
                        inherentRisk,
                        riskId: savedScenario.id, // Link back to scenario
                        projectId: input.devProjectId, // CRITICAL: Link to project for filtering
                        privacyImpact: risk.privacyImpact || false, // CRITICAL: Link for privacy dashboard
                        category: risk.category || 'General',
                        status: 'draft',
                        contextSnapshot: {
                            source: 'Threat Model',
                            projectId: input.devProjectId,
                            threatModelId: input.threatModelId
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } as any).returning();

                    // 3. Add Mitigations as Treatments (Linked to BOTH)
                    if (risk.selectedMitigations && risk.selectedMitigations.length > 0) {
                        for (const mitigation of risk.selectedMitigations) {
                            // Check if mitigation is HTML (contains tags), if so, store as 'custom_plan' strategy
                            // or just store raw string if 'strategy' field supports text (it does)
                            await db.insert(riskTreatments).values({
                                clientId: input.clientId,
                                riskScenarioId: savedScenario.id,
                                riskAssessmentId: savedAssessment.id, // Critical for global dashboard visibility
                                treatmentType: 'mitigate',
                                strategy: mitigation,
                                status: 'planned',
                                updatedAt: new Date()
                            } as any);
                        }
                    }

                    results.push(savedAssessment);
                }

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "update",
                    entityType: "threat_model",
                    entityId: input.threatModelId,
                    details: { action: "committed_risks", count: results.length }
                });

                return results;
            }),

        exportToThreatDragon: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [model] = await db.select().from(threatModels).where(and(eq(threatModels.id, input.id), eq(threatModels.clientId, input.clientId)));
                if (!model) throw new TRPCError({ code: 'NOT_FOUND', message: 'Model not found' });

                const components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.id));
                const flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.id));

                const cells = [];

                // Map Components
                components.forEach((c: any) => {
                    cells.push({
                        id: String(c.id),
                        shape: c.type === 'Actor' ? 'actor' : c.type === 'Store' ? 'store' : 'process', // Simple mapping
                        data: {
                            name: c.name,
                            type: c.type,
                            description: c.description
                        },
                        position: { x: c.x, y: c.y },
                        size: { width: 160, height: 80 },
                        zIndex: 10
                    });
                });

                // Map Flows
                flows.forEach((f: any) => {
                    cells.push({
                        id: String(f.id),
                        shape: 'flow',
                        source: { cell: String(f.sourceComponentId) },
                        target: { cell: String(f.targetComponentId) },
                        data: {
                            name: f.protocol || 'Flow',
                            protocol: f.protocol,
                            isEncrypted: f.isEncrypted
                        },
                        zIndex: 20
                    });
                });

                return {
                    summary: {
                        title: model.name,
                        owner: "ComplianceOS User",
                        description: "Exported from ComplianceOS"
                    },
                    detail: {
                        diagrams: [
                            {
                                title: "Main Diagram",
                                cells: cells
                            }
                        ]
                    }
                };
            }),

        importFromThreatDragon: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
                json: z.string() // The raw JSON string
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                let data;
                try {
                    data = JSON.parse(input.json);
                } catch (e) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid JSON' });
                }

                const modelName = data.summary?.title || "Imported Threat Dragon Model";

                // Create Model
                const [newModel] = await db.insert(threatModels)
                    .values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        name: modelName,
                        methodology: 'STRIDE',
                        status: 'active'
                    } as any)
                    .returning();

                // Import Diagram (Assuming first diagram)
                const diagram = data.detail?.diagrams?.[0];
                if (!diagram) return newModel;

                const componentMap = new Map(); // Old ID -> New ID

                // 1. Import Components (Nodes)
                const nodes = diagram.cells.filter((c: any) => c.shape !== 'flow');
                for (const node of nodes) {
                    // Map TD shape to our Type
                    let type = 'Process';
                    if (node.shape === 'actor') type = 'Actor';
                    if (node.shape === 'store') type = 'Store';
                    // Fallback to name-based heuristic if shape is generic
                    if (node.data?.type) type = node.data.type;

                    const [comp] = await db.insert(threatModelComponents).values({
                        threatModelId: newModel.id,
                        name: node.data?.name || 'Unnamed',
                        type: type,
                        description: node.data?.description || '',
                        x: node.position?.x || 0,
                        y: node.position?.y || 0
                    } as any).returning();
                    componentMap.set(node.id, comp.id);
                }

                // 2. Import Flows (Edges)
                const edges = diagram.cells.filter((c: any) => c.shape === 'flow');
                for (const edge of edges) {
                    const sourceId = componentMap.get(edge.source?.cell);
                    const targetId = componentMap.get(edge.target?.cell);

                    if (sourceId && targetId) {
                        await db.insert(threatModelDataFlows).values({
                            threatModelId: newModel.id,
                            sourceComponentId: sourceId,
                            targetComponentId: targetId,
                            protocol: edge.data?.protocol || 'HTTP',
                            isEncrypted: edge.data?.isEncrypted || false,
                            description: edge.data?.name || ''
                        } as any);
                    }
                }

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "import",
                    entityType: "threat_model",
                    entityId: newModel.id,
                    details: { name: modelName, components: nodes.length }
                });

                return newModel;
            }),

        list: clientProcedure
            .input(z.object({
                clientId: z.coerce.number(),
                devProjectId: z.coerce.number().optional(),
                projectId: z.coerce.number().optional(),
                relaxedProjectSearch: z.boolean().optional(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();

                // Base condition: Client ID match
                const conditions = [eq(threatModels.clientId, input.clientId)];

                if (input.relaxedProjectSearch && input.projectId) {
                    // Search for ID in EITHER projectId OR devProjectId
                    const clause = or(
                        eq(threatModels.projectId, input.projectId),
                        eq(threatModels.devProjectId, input.projectId)
                    );
                    if (clause) conditions.push(clause);
                } else {
                    // Standard strict filtering
                    if (input.devProjectId) {
                        conditions.push(eq(threatModels.devProjectId, input.devProjectId));
                    }
                    if (input.projectId) {
                        conditions.push(eq(threatModels.projectId, input.projectId));
                    }
                }

                return await db.select().from(threatModels).where(and(...conditions));
            })
    });
};
