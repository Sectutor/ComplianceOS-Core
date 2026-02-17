-- Seed Data for Intellfence Client
-- This script populates the risk management tables with realistic sample data

-- First, get the Intellfence client ID (assuming it's client_id = 1)
-- If different, update the client_id value throughout this script

-- ==================== ASSETS (10) ====================
INSERT INTO assets (client_id, name, type, owner, location, status, valuation_c, valuation_i, valuation_a, description, acquisition_date, last_review_date) VALUES
(1, 'Customer Database', 'Information / Data', 'CTO', 'AWS RDS - us-east-1', 'active', 5, 5, 4, 'Primary customer data including PII, payment history, and preferences', '2022-01-15', '2024-11-20'),
(1, 'Production Web Servers', 'Hardware', 'IT Operations', 'AWS EC2 - us-east-1', 'active', 3, 5, 5, 'Load-balanced web servers hosting customer-facing applications', '2023-03-10', '2024-12-01'),
(1, 'Employee Laptops', 'Hardware', 'IT Department', 'Remote/Distributed', 'active', 4, 3, 3, 'MacBook Pro laptops issued to all employees for daily work', '2023-06-01', '2024-10-15'),
(1, 'Source Code Repository', 'Information / Data', 'Engineering Lead', 'GitHub Enterprise', 'active', 5, 5, 3, 'Private repositories containing proprietary application code', '2021-08-20', '2024-11-30'),
(1, 'Payment Processing API', 'Software', 'VP Engineering', 'AWS Lambda', 'active', 5, 5, 5, 'Stripe integration handling all customer transactions', '2022-05-12', '2024-12-10'),
(1, 'Office Network Infrastructure', 'Hardware', 'Network Admin', 'Main Office', 'active', 3, 4, 5, 'Routers, switches, and firewalls for office connectivity', '2022-11-01', '2024-09-20'),
(1, 'Backup Storage System', 'Hardware', 'IT Operations', 'AWS S3 Glacier', 'active', 4, 5, 4, 'Encrypted backup storage for disaster recovery', '2023-01-05', '2024-11-25'),
(1, 'HR Management System', 'Software', 'HR Director', 'SaaS - BambooHR', 'active', 5, 4, 3, 'Employee records, payroll, and performance data', '2022-09-14', '2024-10-30'),
(1, 'API Documentation Portal', 'Information / Data', 'Product Manager', 'AWS CloudFront', 'active', 2, 3, 4, 'Public and internal API documentation', '2023-04-20', '2024-11-15'),
(1, 'Office Building', 'Site / Facility', 'Facilities Manager', '123 Tech Street', 'active', 3, 3, 4, 'Main office building with 50-person capacity', '2021-06-01', '2024-08-10');

-- ==================== THREATS (10) ====================
INSERT INTO threats (client_id, threat_id, name, category, source, intent, capability, targeting, likelihood, potential_impact, status, owner, last_review_date, description) VALUES
(1, 'THR-2024-001', 'Ransomware Attack', 'Malware', 'Cybercriminal Groups', 'Financial Gain', 'High', 'Opportunistic', 'Possible', 'Critical - Data encryption, business disruption, ransom demands', 'active', 'CISO', '2024-12-15', 'Sophisticated ransomware targeting cloud infrastructure and backups'),
(1, 'THR-2024-002', 'Phishing Campaign', 'Social Engineering', 'External Attackers', 'Credential Theft', 'Medium', 'Targeted', 'Likely', 'High - Compromised accounts, data breach', 'active', 'Security Team', '2024-12-10', 'Spear phishing emails targeting employees with admin privileges'),
(1, 'THR-2024-003', 'DDoS Attack', 'Network', 'Hacktivists', 'Service Disruption', 'High', 'Targeted', 'Unlikely', 'High - Service unavailability, revenue loss', 'monitored', 'IT Operations', '2024-11-28', 'Distributed denial of service targeting public APIs'),
(1, 'THR-2024-004', 'Insider Threat', 'Human', 'Disgruntled Employee', 'Data Theft', 'Medium', 'Targeted', 'Rare', 'Very High - IP theft, data exfiltration', 'monitored', 'HR Director', '2024-12-01', 'Malicious insider with administrative access'),
(1, 'THR-2024-005', 'SQL Injection', 'Application', 'External Attackers', 'Data Breach', 'Medium', 'Opportunistic', 'Possible', 'Critical - Database compromise', 'active', 'Engineering Lead', '2024-12-12', 'Exploitation of vulnerable web application endpoints'),
(1, 'THR-2024-006', 'Supply Chain Attack', 'Third-Party', 'Nation State', 'Espionage', 'Very High', 'Targeted', 'Unlikely', 'Critical - Widespread compromise', 'monitored', 'CISO', '2024-11-20', 'Compromised software dependencies or vendors'),
(1, 'THR-2024-007', 'Physical Breach', 'Physical', 'Opportunist', 'Theft', 'Low', 'Opportunistic', 'Unlikely', 'Medium - Hardware theft, data access', 'monitored', 'Facilities Manager', '2024-10-15', 'Unauthorized physical access to office premises'),
(1, 'THR-2024-008', 'API Abuse', 'Application', 'Automated Bots', 'Service Abuse', 'Medium', 'Opportunistic', 'Likely', 'Medium - Resource exhaustion, data scraping', 'active', 'API Team', '2024-12-08', 'Excessive API calls and rate limit bypass attempts'),
(1, 'THR-2024-009', 'Data Exfiltration', 'Data', 'APT Group', 'Espionage', 'Very High', 'Targeted', 'Rare', 'Critical - Loss of confidential data', 'monitored', 'Security Team', '2024-11-25', 'Advanced persistent threat targeting customer data'),
(1, 'THR-2024-010', 'Credential Stuffing', 'Authentication', 'Cybercriminals', 'Account Takeover', 'Medium', 'Opportunistic', 'Possible', 'High - Customer account compromise', 'active', 'Security Team', '2024-12-14', 'Automated login attempts using leaked credentials');

-- ==================== VULNERABILITIES (10) ====================
INSERT INTO vulnerabilities (client_id, vuln_id, name, description, severity, cvss_score, cwe_id, affected_systems, status, discovery_date, owner, remediation_plan, remediation_deadline) VALUES
(1, 'VULN-2024-001', 'Unpatched Web Server', 'Apache web server running outdated version with known CVEs', 'High', 7.5, 'CWE-1104', 'Production Web Servers', 'open', '2024-12-01', 'IT Operations', 'Schedule maintenance window for patching', '2024-12-30'),
(1, 'VULN-2024-002', 'Weak Password Policy', 'No password complexity requirements enforced', 'Medium', 5.3, 'CWE-521', 'All Systems', 'open', '2024-11-15', 'Security Team', 'Implement password policy in IAM', '2025-01-15'),
(1, 'VULN-2024-003', 'Missing MFA', 'Multi-factor authentication not enforced for admin accounts', 'High', 8.1, 'CWE-308', 'Customer Database, HR System', 'open', '2024-11-20', 'CISO', 'Roll out MFA for all privileged accounts', '2024-12-31'),
(1, 'VULN-2024-004', 'Unencrypted Backups', 'Backup data stored without encryption at rest', 'Critical', 9.1, 'CWE-311', 'Backup Storage System', 'open', '2024-12-05', 'IT Operations', 'Enable AWS S3 encryption', '2024-12-20'),
(1, 'VULN-2024-005', 'Insecure API Endpoints', 'Rate limiting not implemented on public APIs', 'Medium', 6.5, 'CWE-770', 'Payment Processing API', 'mitigated', '2024-10-10', 'API Team', 'Deployed API Gateway rate limits', '2024-11-30'),
(1, 'VULN-2024-006', 'Outdated Dependencies', 'NPM packages with known security vulnerabilities', 'Medium', 6.1, 'CWE-1035', 'Source Code Repository', 'open', '2024-11-28', 'Engineering Lead', 'Update to latest stable versions', '2025-01-10'),
(1, 'VULN-2024-007', 'No Network Segmentation', 'Flat network architecture without VLANs', 'High', 7.8, 'CWE-923', 'Office Network Infrastructure', 'open', '2024-09-15', 'Network Admin', 'Implement network segmentation', '2025-02-01'),
(1, 'VULN-2024-008', 'Insufficient Logging', 'Audit logs not enabled for sensitive operations', 'Medium', 5.9, 'CWE-778', 'All Systems', 'open', '2024-10-20', 'Security Team', 'Deploy centralized logging solution', '2025-01-20'),
(1, 'VULN-2024-009', 'No Data Loss Prevention', 'DLP controls not implemented', 'High', 7.2, 'CWE-212', 'Employee Laptops', 'open', '2024-11-10', 'CISO', 'Evaluate and deploy DLP software', '2025-03-01'),
(1, 'VULN-2024-010', 'Inadequate Access Controls', 'Overly permissive IAM roles', 'Medium', 6.8, 'CWE-269', 'AWS Infrastructure', 'remediated', '2024-09-01', 'Cloud Architect', 'Implemented least privilege access', '2024-10-15');

-- ==================== RISK ASSESSMENTS (10) ====================
INSERT INTO risk_assessments (
    client_id, assessment_id, assessment_date, assessor, method,
    threat_description, vulnerability_description, affected_assets,
    likelihood, impact, inherent_risk,
    existing_controls, control_effectiveness,
    residual_risk, risk_owner, treatment_option,
    recommended_actions, priority, status
) VALUES
(1, 'RA-2024-001', '2024-12-01', 'Security Team', 'Qualitative',
 'Ransomware attack targeting cloud infrastructure', 
 'Unencrypted backups and missing system patches',
 '["Customer Database", "Backup Storage System"]', 
 'Possible', 'Critical', 'Very High',
 'Firewall, Antivirus, Backup procedures', 'Partially Effective',
 'High', 'CISO', 'Mitigate',
 'Enable backup encryption, deploy EDR, implement offline backups', 'Critical', 'approved'),

(2, 'RA-2024-002', '2024-12-03', 'CISO', 'Qualitative',
 'Phishing campaign targeting employees with admin access',
 'Weak password policy and no MFA enforcement',
 '["Employee Laptops", "HR Management System"]',
 'Likely', 'High', 'High',
 'Email filtering, Security awareness training', 'Partially Effective',
 'Medium', 'Security Team', 'Mitigate',
 'Enforce MFA, enhance phishing simulations, improve email security', 'High', 'approved'),

(1, 'RA-2024-003', '2024-11-28', 'IT Operations', 'Qualitative',
 'DDoS attack on public-facing services',
 'No DDoS protection or rate limiting',
 '["Production Web Servers", "Payment Processing API"]',
 'Unlikely', 'High', 'Medium',
 'CDN, Load balancer', 'Effective',
 'Low', 'IT Operations', 'Mitigate',
 'Deploy AWS Shield, implement rate limiting', 'Medium', 'draft'),

(1, 'RA-2024-004', '2024-12-10', 'CISO', 'Qualitative',
 'Insider threat - malicious data exfiltration',
 'No DLP controls or privileged access monitoring',
 '["Customer Database", "Source Code Repository"]',
 'Rare', 'Very High', 'High',
 'Access controls, HR background checks', 'Partially Effective',
 'Medium', 'HR Director', 'Mitigate',
 'Deploy DLP, implement PAM, enhance user activity monitoring', 'High', 'approved'),

(1, 'RA-2024-005', '2024-12-05', 'Engineering Lead', 'Qualitative',
 'SQL injection attack on web applications',
 'Outdated dependencies and insufficient input validation',
 '["Production Web Servers", "Customer Database"]',
 'Possible', 'Critical', 'Very High',
 'WAF, Input validation (partial)', 'Ineffective',
 'High', 'Engineering Lead', 'Mitigate',
 'Update dependencies, implement parameterized queries, enhance WAF rules', 'Critical', 'approved'),

(1, 'RA-2024-006', '2024-11-25', 'Security Team', 'Qualitative',
 'Supply chain attack through compromised vendor',
 'Limited vendor security assessments',
 '["Payment Processing API", "HR Management System"]',
 'Unlikely', 'Critical', 'High',
 'Vendor contracts, SLA monitoring', 'Partially Effective',
 'Medium', 'CISO', 'Mitigate',
 'Conduct security audits of critical vendors, implement SBOM', 'High', 'reviewed'),

(1, 'RA-2024-007', '2024-11-20', 'Facilities Manager', 'Qualitative',
 'Physical breach and hardware theft',
 'No visitor logs or security cameras in office',
 '["Office Building", "Office Network Infrastructure"]',
 'Unlikely', 'Medium', 'Low',
 'Door locks, Reception desk', 'Effective',
 'Low', 'Facilities Manager', 'Accept',
 'Risk accepted - Install security cameras if budget allows', 'Low', 'approved'),

(1, 'RA-2024-008', '2024-12-12', 'API Team', 'Qualitative',
 'API abuse and resource exhaustion',
 'Rate limiting implemented but may be bypassed',
 '["Payment Processing API", "API Documentation Portal"]',
 'Likely', 'Medium', 'Medium',
 'API Gateway rate limits', 'Partially Effective',
 'Low', 'API Team', 'Mitigate',
 'Implement advanced bot detection, enhance rate limiting', 'Medium', 'draft'),

(1, 'RA-2024-009', '2024-12-08', 'Network Admin', 'Qualitative',
 'Lateral movement after network breach',
 'Flat network with no segmentation',
 '["Office Network Infrastructure", "Production Web Servers"]',
 'Possible', 'High', 'High',
 'Firewall rules', 'Ineffective',
 'High', 'Network Admin', 'Mitigate',
 'Implement network segmentation and VLANs', 'High', 'approved'),

(1, 'RA-2024-010', '2024-12-15', 'Security Team', 'Qualitative',
 'Credential stuffing attacks on customer accounts',
 'No account lockout or CAPTCHA on login',
 '["Customer Database", "Production Web Servers"]',
 'Possible', 'High', 'High',
 'Password hashing, Basic rate limiting', 'Partially Effective',
 'Medium', 'Security Team', 'Mitigate',
 'Implement CAPTCHA, account lockout, breach monitoring', 'High', 'approved');

-- ==================== RISK TREATMENTS (Sample - 5) ====================
INSERT INTO risk_treatments (
    client_id, risk_assessment_id, treatment_type, strategy, 
    status, owner, due_date, priority, estimated_cost
) VALUES
(1, 1, 'mitigate', 'Deploy endpoint detection and response (EDR) solution and enable backup encryption', 
 'in_progress', 'IT Operations', '2024-12-31', 'critical', '$25,000'),

(1, 2, 'mitigate', 'Enforce MFA across all systems and conduct monthly phishing simulations',
 'planned', 'Security Team', '2025-01-15', 'high', '$15,000'),

(1, 4, 'mitigate', 'Implement data loss prevention software and privileged access management',
 'planned', 'CISO', '2025-02-01', 'high', '$50,000'),

(1, 5, 'mitigate', 'Update all application dependencies and implement prepared statements',
 'in_progress', 'Engineering Lead', '2024-12-30', 'critical', '$10,000'),

(1, 7, 'accept', 'Physical security risk accepted with residual controls in place',
 'implemented', 'Facilities Manager', NULL, 'low', '$0');

-- Notes:
-- 1. Adjust client_id if Intellfence is not ID 1
-- 2. Risk assessment IDs start from 1, assuming clean database
-- 3. Treatment IDs link to assessment IDs
-- 4. All dates are realistic and recent
-- 5. CIA valuations (Confidentiality, Integrity, Availability) range 1-5
