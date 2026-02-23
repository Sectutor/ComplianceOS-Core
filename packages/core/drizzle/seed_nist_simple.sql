-- =============================================================================
-- NIST Compliance Hub Demo Data for Client 3 - Simple Version
-- Run this script to populate comprehensive demo data for testing
-- =============================================================================

-- First, add the new columns to federal_fisma_systems if not exists
ALTER TABLE federal_fisma_systems 
ADD COLUMN IF NOT EXISTS acronym VARCHAR(20),
ADD COLUMN IF NOT EXISTS owner VARCHAR(255),
ADD COLUMN IF NOT EXISTS controls_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assets_count INTEGER DEFAULT 0;

-- =============================================================================
-- 1. FISMA SYSTEMS (3 systems for client 3)
-- =============================================================================
INSERT INTO federal_fisma_systems (client_id, name, acronym, owner, fips199_overall, description, status, controls_count, assets_count)
VALUES 
(3, 'Enterprise Cloud Infrastructure', 'ECI', 'John Smith (CISO)', 'Moderate', 'Main cloud infrastructure hosting all enterprise applications and data storage', 'Active', 125, 48),
(3, 'Human Resources Information System', 'HRIS', 'Sarah Johnson (HR Director)', 'Low', 'HR system containing employee records, payroll, and benefits data', 'Active', 89, 12),
(3, 'Financial Management System', 'FMS', 'Michael Chen (CFO)', 'High', 'Core financial system for accounting, budgeting, and procurement', 'Active', 156, 32)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. POA&M PLANS (3 POA&M plans - one per system)
-- =============================================================================
INSERT INTO federal_poams (client_id, title, status)
VALUES 
(3, 'ECI Security Enhancement Plan 2024', 'active'),
(3, 'HRIS Privacy Compliance Plan', 'active'),
(3, 'FMS SOX Compliance Plan', 'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. POA&M ITEMS (10 items per POA&M)
-- =============================================================================
-- ECI POA&M Items (poam_id = 1)
INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, overall_remediation_plan)
VALUES
(1, 'AC-2', 'Weak password policy enforcement', 'Current password policy allows 8-character minimum without complexity requirements', 'Vulnerability Scan', 'VULN-2024-001', 'ECI-Web-01', 'Open', '2024-06-30', 'Implement NIST 800-63B password requirements'),
(1, 'AU-3', 'Insufficient audit logging', 'Critical system events not being logged as required', 'Manual Review', 'AUD-001', 'ECI-App-02', 'Open', '2024-05-15', 'Enable comprehensive audit logging'),
(1, 'SC-8', 'Unencrypted data transmission', 'TLS 1.0 still enabled on some endpoints', 'Penetration Test', 'PEN-2024-003', 'ECI-Net-05', 'Open', '2024-04-30', 'Disable TLS 1.0 and enforce TLS 1.2+'),
(1, 'IA-5', 'No multi-factor authentication', 'MFA not enforced for privileged accounts', 'Assessment', 'ASM-001', 'ECI-Auth-01', 'Open', '2024-07-31', 'Deploy MFA for all privileged access'),
(1, 'CP-9', 'No disaster recovery testing', 'DR plan has not been tested in 18 months', 'Audit Finding', 'AUD-2024-010', 'ECI-Backup-01', 'Open', '2024-08-31', 'Conduct annual DR tabletop exercise'),
(1, 'SI-2', 'Unpatched vulnerabilities', 'Critical patches missing on 15% of servers', 'Vulnerability Scan', 'VULN-2024-007', 'ECI-Srv-03', 'Open', '2024-04-15', 'Implement automated patch management'),
(1, 'AC-6', 'Excessive privileged access', '23 users have unnecessary admin privileges', 'Access Review', 'ACC-001', 'ECI-Usr-12', 'In Progress', '2024-05-31', 'Implement least privilege access model'),
(1, 'SC-13', 'Weak cryptographic algorithms', 'SHA-1 still used for digital signatures', 'Code Review', 'CR-001', 'ECI-Crypto-01', 'Open', '2024-06-15', 'Migrate to SHA-256 algorithms'),
(1, 'AT-3', 'Incomplete security training', '35% of staff missing annual security awareness', 'Training Records', 'TRN-001', 'ECI-Emp-All', 'Open', '2024-04-30', 'Complete mandatory security training'),
(1, 'IR-4', 'No incident response plan testing', 'IR plan has never been tested', 'Audit Finding', 'AUD-2024-015', 'ECI-IR-01', 'Open', '2024-09-30', 'Conduct quarterly IR exercises')
ON CONFLICT DO NOTHING;

-- HRIS POA&M Items (poam_id = 2)
INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, overall_remediation_plan)
VALUES
(2, 'AC-2', 'Shared service accounts', 'Multiple users sharing admin accounts', 'Access Review', 'ACC-HRIS-001', 'HRIS-Admin-01', 'Open', '2024-05-31', 'Implement individual user accounts'),
(2, 'AC-3', 'Inadequate role-based access', 'No formal RBAC implementation', 'Audit Finding', 'AUD-HRIS-002', 'HRIS-RBAC-01', 'Open', '2024-06-30', 'Design and implement RBAC model'),
(2, 'AU-2', 'No PII access logging', 'Cannot track who accessed employee PII', 'Privacy Assessment', 'PA-HRIS-001', 'HRIS-Audit-01', 'Open', '2024-07-31', 'Implement PII access auditing'),
(2, 'SC-8', 'Data at rest not encrypted', 'Employee data stored unencrypted', 'Privacy Assessment', 'PA-HRIS-002', 'HRIS-DB-01', 'Open', '2024-04-30', 'Enable database-level encryption'),
(2, 'CP-2', 'No business impact analysis', 'BIA not documented for HRIS', 'Contingency Planning', 'CP-HRIS-001', 'HRIS-BIA-01', 'Open', '2024-08-31', 'Complete BIA documentation'),
(2, 'AT-2', 'No privacy awareness training', 'Staff not trained on handling PII', 'Training Audit', 'TRN-HRIS-001', 'HRIS-Train-01', 'Open', '2024-05-15', 'Deploy PII handling training'),
(2, 'SA-4', 'No secure development lifecycle', 'Custom HRIS components not security tested', 'Code Review', 'CR-HRIS-001', 'HRIS-Custom-01', 'Open', '2024-09-30', 'Implement SDLC security controls'),
(2, 'RA-5', 'No vulnerability scanning', 'HRIS not included in vulnerability program', 'Assessment', 'ASM-HRIS-001', 'HRIS-Vuln-01', 'Open', '2024-06-15', 'Include HRIS in regular scanning'),
(2, 'MA-2', 'No maintenance scheduling', 'System patches applied ad-hoc', 'Audit Finding', 'AUD-HRIS-003', 'HRIS-Maint-01', 'Open', '2024-07-31', 'Establish patch management schedule'),
(2, 'PL-2', 'No system security plan', 'SSP not documented', 'Certification', 'CERT-HRIS-001', 'HRIS-SSP-01', 'Open', '2024-10-31', 'Develop comprehensive SSP')
ON CONFLICT DO NOTHING;

-- FMS POA&M Items (poam_id = 3)
INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, overall_remediation_plan)
VALUES
(3, 'AC-2', 'Segregation of duties gaps', 'Users can both initiate and approve transactions', 'SOX Control Test', 'SOX-FMS-001', 'FMS-App-01', 'Open', '2024-04-30', 'Implement approval workflow controls'),
(3, 'AU-2', 'Incomplete transaction logging', 'Some financial transactions not fully logged', 'SOX Control Test', 'SOX-FMS-002', 'FMS-Audit-01', 'Open', '2024-05-31', 'Enhance transaction audit trail'),
(3, 'SC-8', 'Data transmission encryption', 'Inter-system data flows unencrypted', 'Network Assessment', 'NA-FMS-001', 'FMS-Net-01', 'Open', '2024-04-15', 'Implement VPN and TLS for all data flows'),
(3, 'IA-2', 'Weak authentication for FMS', 'No MFA for financial system access', 'Risk Assessment', 'RA-FMS-001', 'FMS-Auth-01', 'Open', '2024-05-15', 'Deploy hardware token MFA'),
(3, 'CC6.1', 'No change management', 'Production changes made without approval', 'SOX Control Test', 'SOX-FMS-003', 'FMS-Chg-01', 'Open', '2024-06-30', 'Implement formal change management'),
(3, 'CC7.2', 'No automated monitoring', 'Manual review of system activities', 'SOX Control Test', 'SOX-FMS-004', 'FMS-Mon-01', 'Open', '2024-07-31', 'Deploy SIEM integration'),
(3, 'CC8.1', 'No vulnerability management', 'Critical FMS vulnerabilities unpatched', 'Vulnerability Scan', 'VULN-FMS-001', 'FMS-Srv-01', 'Open', '2024-04-30', 'Establish critical patch SLAs'),
(3, 'CC6.6', 'Incomplete backup verification', 'Backups never test-restored', 'Contingency Test', 'CT-FMS-001', 'FMS-Backup-01', 'Open', '2024-08-31', 'Monthly backup restoration tests'),
(3, 'CC9.1', 'No vendor risk assessment', 'Third-party payment processor not assessed', 'Vendor Management', 'VM-FMS-001', 'FMS-Vendor-01', 'Open', '2024-09-30', 'Complete vendor security assessment'),
(3, 'CC3.3', 'No security policies', 'Information security policy not documented', 'Audit Finding', 'AUD-FMS-001', 'FMS-Policy-01', 'Open', '2024-10-31', 'Develop FMS-specific security policy')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. THREAT SOURCES (10 threat sources)
-- =============================================================================
INSERT INTO nist_80030_threat_sources (client_id, type, name, description, capability, intent, targeting, motive, range_of_effects, status)
VALUES 
(3, 'Adversarial', 'Nation-State Actor (APT29)', 'Russian state-sponsored threat group targeting government and critical infrastructure', 'Very High', 'Very High', 'Very High', 'Espionage', 'Nation-wide critical infrastructure', 'active'),
(3, 'Adversarial', 'Organized Cybercrime Group', 'Ransomware-as-a-service group targeting financial institutions', 'High', 'High', 'High', 'Financial Gain', 'Multi-national corporations', 'active'),
(3, 'Adversarial', 'Insider Threat - Malicious', 'Disgruntled employee with system access attempting data exfiltration', 'Moderate', 'Moderate', 'Moderate', 'Revenge', 'Single organization', 'active'),
(3, 'Accidental', 'System Administrator Error', 'Misconfiguration by sysadmin causing security vulnerability', 'N/A', 'N/A', 'N/A', 'Negligence', 'Single system', 'active'),
(3, 'Accidental', 'Developer Coding Error', 'Software developer introducing SQL injection vulnerability', 'N/A', 'N/A', 'N/A', 'Human Error', 'Single application', 'active'),
(3, 'Structural', 'Database Server Failure', 'Hardware failure in storage array causing data unavailability', 'N/A', 'N/A', 'N/A', 'Equipment Failure', 'Single service', 'active'),
(3, 'Structural', 'Network Equipment Degradation', 'Aging network infrastructure causing intermittent connectivity', 'N/A', 'N/A', 'N/A', 'Aging Infrastructure', 'Network segment', 'active'),
(3, 'Environmental', 'Data Center Flooding', 'Geographic location prone to flash flooding', 'N/A', 'N/A', 'N/A', 'Natural Disaster', 'Regional data center', 'active'),
(3, 'Environmental', 'Power Grid Instability', 'Regional power grid experiencing brownouts', 'N/A', 'N/A', 'N/A', 'Infrastructure Failure', 'Multiple facilities', 'active'),
(3, 'Adversarial', 'Supply Chain Compromise', 'Compromised software vendor delivering malicious updates', 'High', 'High', 'High', 'Espionage/Crime', 'Multiple organizations', 'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. THREAT EVENTS (10 events)
-- =============================================================================
INSERT INTO nist_80030_threat_events (client_id, threat_source_id, event_id, name, description, source_type, relevance, likelihood, vulnerabilities_predispositions, targeted_assets, status)
VALUES 
(3, 1, 'TE-001', 'Advanced Persistent Threat Campaign', 'APT29 targeting government contractors with spear-phishing and zero-day exploits', 'Adversarial', 'Confirmed', 'High', 'Unpatched systems, weak email filtering', 'FMS database, employee credentials', 'active'),
(3, 2, 'TE-002', 'Ransomware Deployment', 'Clop ransomware encrypting financial systems and demanding payment', 'Adversarial', 'Confirmed', 'High', 'No network segmentation, weak backups', 'FMS, HRIS databases', 'active'),
(3, 3, 'TE-003', 'Unauthorized Data Exfiltration', 'Privileged user exporting sensitive data to personal cloud storage', 'Adversarial', 'Predicted', 'Moderate', 'No DLP, excessive privileges', 'Employee PII, financial records', 'active'),
(3, 4, 'TE-004', 'Firewall Rule Misconfiguration', 'Admin accidentally opens inbound access to database servers', 'Accidental', 'Expected', 'Moderate', 'No change management, no review process', 'ECI database tier', 'active'),
(3, 5, 'TE-005', 'SQL Injection Attack Vector', 'Developer leaves unsanitized input field in HRIS login', 'Accidental', 'Confirmed', 'High', 'No input validation, no WAF', 'HRIS employee data', 'active'),
(3, 6, 'TE-006', 'Storage Array Failure', 'Primary database storage fails causing service outage', 'Structural', 'Possible', 'Low', 'No redundancy, aging hardware', 'All database-hosted applications', 'active'),
(3, 7, 'TE-007', 'Network Latency Spikes', 'Aging core switch causing packet loss and latency', 'Structural', 'Expected', 'Moderate', 'No redundancy, EOL equipment', 'All networked systems', 'active'),
(3, 8, 'TE-008', 'Data Center Flood Event', 'Flash flood damages primary data center HVAC and power', 'Environmental', 'Possible', 'Low', 'Inadequate flood barriers, single location', 'All hosted systems', 'active'),
(3, 9, 'TE-009', 'Extended Power Outage', 'Regional grid failure causes extended outage at primary site', 'Environmental', 'Predicted', 'Moderate', 'No generator fuel contract, single UPS', 'All infrastructure', 'active'),
(3, 10, 'TE-010', 'Compromised Software Update', 'Vendor software update contains backdoor', 'Adversarial', 'Predicted', 'Moderate', 'No code signing verification, no staging', 'All systems using vendor software', 'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. IMPACT ASSESSMENTS (10 domain-level + CIA)
-- =============================================================================
INSERT INTO nist_80030_impact_assessments (client_id, domain, cia_type, magnitude, magnitude_score, description, rationale, factor_name, factor_level, factor_type)
VALUES 
(3, 'Business Operations', NULL, 'High', 85, 'Disruption to financial transaction processing', 'Inability to process payments impacts revenue and regulatory compliance', 'Revenue Impact', 'High', 'Amplifier'),
(3, 'Business Operations', NULL, 'Moderate', 55, 'Disruption to HR payroll processing', 'Delayed payroll affects employee satisfaction and compliance', 'Employee Impact', 'Moderate', 'Amplifier'),
(3, 'Corporate Assets', 'Confidentiality', 'Critical', 95, 'Exposure of financial forecasts', 'Premature disclosure impacts stock price and competitive position', 'Competitive Harm', 'Critical', 'Amplifier'),
(3, 'Corporate Assets', 'Integrity', 'High', 80, 'Manipulation of financial data', 'Incorrect data leads to wrong business decisions', 'Decision Quality', 'High', 'Amplifier'),
(3, 'Corporate Assets', 'Availability', 'Moderate', 50, 'Temporary unavailability of HR system', 'Delays in employee onboarding and HR processes', 'Operational Delay', 'Moderate', 'Dampener'),
(3, 'Personnel Safety', NULL, 'Low', 25, 'Inability to process payroll', 'Employees may miss direct deposits', 'Financial Hardship', 'Low', 'Dampener'),
(3, 'National Interests', 'Confidentiality', 'High', 75, 'Unauthorized disclosure of contractor information', 'May affect national security if classified info involved', 'Classification Level', 'High', 'Amplifier'),
(3, 'IT Infrastructure', 'Availability', 'High', 85, 'Complete cloud infrastructure outage', 'All enterprise systems become unavailable', 'Business Continuity', 'High', 'Amplifier'),
(3, 'Customer Data', 'Confidentiality', 'Critical', 90, 'Breach of customer PII', 'Regulatory fines, reputational damage, customer churn', 'Regulatory Penalty', 'Critical', 'Amplifier'),
(3, 'Intellectual Property', 'Confidentiality', 'High', 80, 'Theft of proprietary software', 'Loss of competitive advantage', 'Market Position', 'High', 'Amplifier')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. CHECKLIST STATES (RMF Workflow - 3 systems x 6 steps)
-- =============================================================================
-- ECI System (id=1) RMF Workflow Checklists
INSERT INTO checklist_states (client_id, checklist_id, items) VALUES 
(3, 'nist-800-37-categorize-1', '{"c1_objectives": {"confidentiality": {"level": "Moderate", "selected": true}, "integrity": {"level": "Moderate", "selected": true}, "availability": {"level": "Moderate", "selected": true}}, "system_type": "Moderate", "completed": true}'),
(3, 'nist-800-37-select-1', '{"baseline": "Moderate", "controls_selected": 325, "tailoring_applied": true, "compensing_controls": 5, "completed": false}'),
(3, 'nist-800-37-implement-1', '{"implementation_progress": 65, "controls_implemented": 211, "controls_remaining": 114, "common_controls": 45, "completed": false}'),
(3, 'nist-800-37-assess-1', '{"assessment_progress": 30, "controls_tested": 97, "open_findings": 12, "completed": false}'),
(3, 'nist-800-37-authorize-1', '{"package_complete": false, "ssp_reviewed": true, "risk_determination": "Moderate", "completed": false}'),
(3, 'nist-800-37-monitor-1', '{"continuous_monitoring": true, "monthly_reviews": 3, "active_poams": 10, "completed": false}')
ON CONFLICT DO NOTHING;

-- HRIS System (id=2) RMF Workflow Checklists
INSERT INTO checklist_states (client_id, checklist_id, items) VALUES 
(3, 'nist-800-37-categorize-2', '{"c1_objectives": {"confidentiality": {"level": "Moderate", "selected": true}, "integrity": {"level": "Low", "selected": true}, "availability": {"level": "Low", "selected": true}}, "system_type": "Low", "completed": true}'),
(3, 'nist-800-37-select-2', '{"baseline": "Low", "controls_selected": 125, "tailoring_applied": true, "compensing_controls": 2, "completed": true}'),
(3, 'nist-800-37-implement-2', '{"implementation_progress": 90, "controls_implemented": 113, "controls_remaining": 12, "common_controls": 35, "completed": false}'),
(3, 'nist-800-37-assess-2', '{"assessment_progress": 70, "controls_tested": 88, "open_findings": 5, "completed": false}'),
(3, 'nist-800-37-authorize-2', '{"package_complete": false, "ssp_reviewed": false, "risk_determination": "Pending", "completed": false}'),
(3, 'nist-800-37-monitor-2', '{"continuous_monitoring": false, "monthly_reviews": 0, "active_poams": 10, "completed": false}')
ON CONFLICT DO NOTHING;

-- FMS System (id=3) RMF Workflow Checklists
INSERT INTO checklist_states (client_id, checklist_id, items) VALUES 
(3, 'nist-800-37-categorize-3', '{"c1_objectives": {"confidentiality": {"level": "High", "selected": true}, "integrity": {"level": "High", "selected": true}, "availability": {"level": "High", "selected": true}}, "system_type": "High", "completed": true}'),
(3, 'nist-800-37-select-3', '{"baseline": "High", "controls_selected": 542, "tailoring_applied": true, "compensing_controls": 15, "completed": true}'),
(3, 'nist-800-37-implement-3', '{"implementation_progress": 40, "controls_implemented": 217, "controls_remaining": 325, "common_controls": 60, "completed": false}'),
(3, 'nist-800-37-assess-3', '{"assessment_progress": 15, "controls_tested": 81, "open_findings": 18, "completed": false}'),
(3, 'nist-800-37-authorize-3', '{"package_complete": false, "ssp_reviewed": false, "risk_determination": "Pending", "completed": false}'),
(3, 'nist-800-37-monitor-3', '{"continuous_monitoring": false, "monthly_reviews": 0, "active_poams": 10, "completed": false}')
ON CONFLICT DO NOTHING;

\echo 'Demo data seeded successfully for Client 3!'
