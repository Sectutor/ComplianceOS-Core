-- =============================================================================
-- NIST Compliance Hub Demo Data for Client 3
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

-- Get the POA&M IDs for linking items
DO $$
DECLARE
    eci_poam_id INTEGER;
    hris_poam_id INTEGER;
    fms_poam_id INTEGER;
BEGIN
    SELECT id INTO eci_poam_id FROM federal_poams WHERE client_id = 3 AND title = 'ECI Security Enhancement Plan 2024' LIMIT 1;
    SELECT id INTO hris_poam_id FROM federal_poams WHERE client_id = 3 AND title = 'HRIS Privacy Compliance Plan' LIMIT 1;
    SELECT id INTO fms_poam_id FROM federal_poams WHERE client_id = 3 AND title = 'FMS SOX Compliance Plan' LIMIT 1;

    -- =============================================================================
    -- 3. POA&M ITEMS (10 items per POA&M)
    -- =============================================================================
    -- ECI POA&M Items
    INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, raw_risk_score, residual_risk_score, overall_remediation_plan)
    VALUES
    (eci_poam_id, 'AC-2', 'Weak password policy enforcement', 'Current password policy allows 8-character minimum without complexity requirements', 'Vulnerability Scan', 'VULN-2024-001', 'ECI-Web-01', 'Open', '2024-06-30', 85, 45, 'Implement NIST 800-63B password requirements'),
    (eci_poam_id, 'AU-3', 'Insufficient audit logging', 'Critical system events not being logged as required', 'Manual Review', 'AUD-001', 'ECI-App-02', 'Open', '2024-05-15', 75, 40, 'Enable comprehensive audit logging'),
    (eci_poam_id, 'SC-8', 'Unencrypted data transmission', 'TLS 1.0 still enabled on some endpoints', 'Penetration Test', 'PEN-2024-003', 'ECI-Net-05', 'Open', '2024-04-30', 90, 50, 'Disable TLS 1.0 and enforce TLS 1.2+'),
    (eci_poam_id, 'IA-5', 'No multi-factor authentication', 'MFA not enforced for privileged accounts', 'Assessment', 'ASM-001', 'ECI-Auth-01', 'Open', '2024-07-31', 95, 60, 'Deploy MFA for all privileged access'),
    (eci_poam_id, 'CP-9', 'No disaster recovery testing', 'DR plan has not been tested in 18 months', 'Audit Finding', 'AUD-2024-010', 'ECI-Backup-01', 'Open', '2024-08-31', 70, 35, 'Conduct annual DR tabletop exercise'),
    (eci_poam_id, 'SI-2', 'Unpatched vulnerabilities', 'Critical patches missing on 15% of servers', 'Vulnerability Scan', 'VULN-2024-007', 'ECI-Srv-03', 'Open', '2024-04-15', 80, 55, 'Implement automated patch management'),
    (eci_poam_id, 'AC-6', 'Excessive privileged access', '23 users have unnecessary admin privileges', 'Access Review', 'ACC-001', 'ECI-Usr-12', 'In Progress', '2024-05-31', 65, 30, 'Implement least privilege access model'),
    (eci_poam_id, 'SC-13', 'Weak cryptographic algorithms', 'SHA-1 still used for digital signatures', 'Code Review', 'CR-001', 'ECI-Crypto-01', 'Open', '2024-06-15', 75, 40, 'Migrate to SHA-256 algorithms'),
    (eci_poam_id, 'AT-3', 'Incomplete security training', '35% of staff missing annual security awareness', 'Training Records', 'TRN-001', 'ECI-Emp-All', 'Open', '2024-04-30', 50, 25, 'Complete mandatory security training'),
    (eci_poam_id, 'IR-4', 'No incident response plan testing', 'IR plan has never been tested', 'Audit Finding', 'AUD-2024-015', 'ECI-IR-01', 'Open', '2024-09-30', 60, 30, 'Conduct quarterly IR exercises')
    ON CONFLICT DO NOTHING;

    -- HRIS POA&M Items
    INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, raw_risk_score, residual_risk_score, overall_remediation_plan)
    VALUES
    (hris_poam_id, 'AC-2', 'Shared service accounts', 'Multiple users sharing admin accounts', 'Access Review', 'ACC-HRIS-001', 'HRIS-Admin-01', 'Open', '2024-05-31', 70, 35, 'Implement individual user accounts'),
    (hris_poam_id, 'AC-3', 'Inadequate role-based access', 'No formal RBAC implementation', 'Audit Finding', 'AUD-HRIS-002', 'HRIS-RBAC-01', 'Open', '2024-06-30', 60, 30, 'Design and implement RBAC model'),
    (hris_poam_id, 'AU-2', 'No PII access logging', 'Cannot track who accessed employee PII', 'Privacy Assessment', 'PA-HRIS-001', 'HRIS-Audit-01', 'Open', '2024-07-31', 80, 45, 'Implement PII access auditing'),
    (hris_poam_id, 'SC-8', 'Data at rest not encrypted', 'Employee data stored unencrypted', 'Privacy Assessment', 'PA-HRIS-002', 'HRIS-DB-01', 'Open', '2024-04-30', 90, 55, 'Enable database-level encryption'),
    (hris_poam_id, 'CP-2', 'No business impact analysis', 'BIA not documented for HRIS', 'Contingency Planning', 'CP-HRIS-001', 'HRIS-BIA-01', 'Open', '2024-08-31', 55, 25, 'Complete BIA documentation'),
    (hris_poam_id, 'AT-2', 'No privacy awareness training', 'Staff not trained on handling PII', 'Training Audit', 'TRN-HRIS-001', 'HRIS-Train-01', 'Open', '2024-05-15', 45, 20, 'Deploy PII handling training'),
    (hris_poam_id, 'SA-4', 'No secure development lifecycle', 'Custom HRIS components not security tested', 'Code Review', 'CR-HRIS-001', 'HRIS-Custom-01', 'Open', '2024-09-30', 65, 35, 'Implement SDLC security controls'),
    (hris_poam_id, 'RA-5', 'No vulnerability scanning', 'HRIS not included in vulnerability program', 'Assessment', 'ASM-HRIS-001', 'HRIS-Vuln-01', 'Open', '2024-06-15', 60, 30, 'Include HRIS in regular scanning'),
    (hris_poam_id, 'MA-2', 'No maintenance scheduling', 'System patches applied ad-hoc', 'Audit Finding', 'AUD-HRIS-003', 'HRIS-Maint-01', 'Open', '2024-07-31', 40, 20, 'Establish patch management schedule'),
    (hris_poam_id, 'PL-2', 'No system security plan', 'SSP not documented', 'Certification', 'CERT-HRIS-001', 'HRIS-SSP-01', 'Open', '2024-10-31', 75, 40, 'Develop comprehensive SSP')
    ON CONFLICT DO NOTHING;

    -- FMS POA&M Items
    INSERT INTO poam_items (poam_id, control_id, weakness_name, weakness_description, weakness_detector_source, source_identifier, asset_identifier, status, scheduled_completion_date, raw_risk_score, residual_risk_score, overall_remediation_plan)
    VALUES
    (fms_poam_id, 'AC-2', 'Segregation of duties gaps', 'Users can both initiate and approve transactions', 'SOX Control Test', 'SOX-FMS-001', 'FMS-App-01', 'Open', '2024-04-30', 95, 60, 'Implement approval workflow controls'),
    (fms_poam_id, 'AU-2', 'Incomplete transaction logging', 'Some financial transactions not fully logged', 'SOX Control Test', 'SOX-FMS-002', 'FMS-Audit-01', 'Open', '2024-05-31', 85, 50, 'Enhance transaction audit trail'),
    (fms_poam_id, 'SC-8', 'Data transmission encryption', 'Inter-system data flows unencrypted', 'Network Assessment', 'NA-FMS-001', 'FMS-Net-01', 'Open', '2024-04-15', 90, 55, 'Implement VPN and TLS for all data flows'),
    (fms_poam_id, 'IA-2', 'Weak authentication for FMS', 'No MFA for financial system access', 'Risk Assessment', 'RA-FMS-001', 'FMS-Auth-01', 'Open', '2024-05-15', 95, 65, 'Deploy hardware token MFA'),
    (fms_poam_id, 'CC6.1', 'No change management', 'Production changes made without approval', 'SOX Control Test', 'SOX-FMS-003', 'FMS-Chg-01', 'Open', '2024-06-30', 80, 40, 'Implement formal change management'),
    (fms_poam_id, 'CC7.2', 'No automated monitoring', 'Manual review of system activities', 'SOX Control Test', 'SOX-FMS-004', 'FMS-Mon-01', 'Open', '2024-07-31', 70, 35, 'Deploy SIEM integration'),
    (fms_poam_id, 'CC8.1', 'No vulnerability management', 'Critical FMS vulnerabilities unpatched', 'Vulnerability Scan', 'VULN-FMS-001', 'FMS-Srv-01', 'Open', '2024-04-30', 85, 50, 'Establish critical patch SLAs'),
    (fms_poam_id, 'CC6.6', 'Incomplete backup verification', 'Backups never test-restored', 'Contingency Test', 'CT-FMS-001', 'FMS-Backup-01', 'Open', '2024-08-31', 75, 40, 'Monthly backup restoration tests'),
    (fms_poam_id, 'CC9.1', 'No vendor risk assessment', 'Third-party payment processor not assessed', 'Vendor Management', 'VM-FMS-001', 'FMS-Vendor-01', 'Open', '2024-09-30', 65, 35, 'Complete vendor security assessment'),
    (fms_poam_id, 'CC3.3', 'No security policies', 'Information security policy not documented', 'Audit Finding', 'AUD-FMS-001', 'FMS-Policy-01', 'Open', '2024-10-31', 60, 30, 'Develop FMS-specific security policy')
    ON CONFLICT DO NOTHING;
END $$;

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
DO $$
DECLARE
    apt_id INTEGER;
    crime_id INTEGER;
    insider_id INTEGER;
    admin_err_id INTEGER;
    dev_err_id INTEGER;
    db_fail_id INTEGER;
    net_deg_id INTEGER;
    flood_id INTEGER;
    power_id INTEGER;
    supply_id INTEGER;
BEGIN
    SELECT id INTO apt_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Nation-State Actor (APT29)' LIMIT 1;
    SELECT id INTO crime_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Organized Cybercrime Group' LIMIT 1;
    SELECT id INTO insider_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Insider Threat - Malicious' LIMIT 1;
    SELECT id INTO admin_err_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'System Administrator Error' LIMIT 1;
    SELECT id INTO dev_err_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Developer Coding Error' LIMIT 1;
    SELECT id INTO db_fail_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Database Server Failure' LIMIT 1;
    SELECT id INTO net_deg_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Network Equipment Degradation' LIMIT 1;
    SELECT id INTO flood_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Data Center Flooding' LIMIT 1;
    SELECT id INTO power_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Power Grid Instability' LIMIT 1;
    SELECT id INTO supply_id FROM nist_80030_threat_sources WHERE client_id = 3 AND name = 'Supply Chain Compromise' LIMIT 1;

    INSERT INTO nist_80030_threat_events (client_id, threat_source_id, event_id, name, description, source_type, relevance, likelihood, vulnerabilities_predispositions, targeted_assets, status)
    VALUES
    (3, apt_id, 'TE-001', 'Advanced Persistent Threat Campaign', 'APT29 targeting government contractors with spear-phishing and zero-day exploits', 'Adversarial', 'Confirmed', 'High', 'Unpatched systems, weak email filtering', 'FMS database, employee credentials', 'active'),
    (3, crime_id, 'TE-002', 'Ransomware Deployment', 'Clop ransomware encrypting financial systems and demanding payment', 'Adversarial', 'Confirmed', 'High', 'No network segmentation, weak backups', 'FMS, HRIS databases', 'active'),
    (3, insider_id, 'TE-003', 'Unauthorized Data Exfiltration', 'Privileged user exporting sensitive data to personal cloud storage', 'Adversarial', 'Predicted', 'Moderate', 'No DLP, excessive privileges', 'Employee PII, financial records', 'active'),
    (3, admin_err_id, 'TE-004', 'Firewall Rule Misconfiguration', 'Admin accidentally opens inbound access to database servers', 'Accidental', 'Expected', 'Moderate', 'No change management, no review process', 'ECI database tier', 'active'),
    (3, dev_err_id, 'TE-005', 'SQL Injection Attack Vector', 'Developer leaves unsanitized input field in HRIS login', 'Accidental', 'Confirmed', 'High', 'No input validation, no WAF', 'HRIS employee data', 'active'),
    (3, db_fail_id, 'TE-006', 'Storage Array Failure', 'Primary database storage fails causing service outage', 'Structural', 'Possible', 'Low', 'No redundancy, aging hardware', 'All database-hosted applications', 'active'),
    (3, net_deg_id, 'TE-007', 'Network Latency Spikes', 'Aging core switch causing packet loss and latency', 'Structural', 'Expected', 'Moderate', 'No redundancy, EOL equipment', 'All networked systems', 'active'),
    (3, flood_id, 'TE-008', 'Data Center Flood Event', 'Flash flood damages primary data center HVAC and power', 'Environmental', 'Possible', 'Low', 'Inadequate flood barriers, single location', 'All hosted systems', 'active'),
    (3, power_id, 'TE-009', 'Extended Power Outage', 'Regional grid failure causes extended outage at primary site', 'Environmental', 'Predicted', 'Moderate', 'No generator fuel contract, single UPS', 'All infrastructure', 'active'),
    (3, supply_id, 'TE-010', 'Compromised Software Update', 'Vendor software update contains backdoor', 'Adversarial', 'Predicted', 'Moderate', 'No code signing verification, no staging', 'All systems using vendor software', 'active')
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 6. IMPACT ASSESSMENTS (10 domain-level + CIA)
-- =============================================================================
INSERT INTO nist_80030_impact_assessments (client_id, domain, cia_type, magnitude, magnitude_score, description, rationale, factor_name, factor_level, factor_type)
VALUES 
-- Business Operations Domain
(3, 'Business Operations', NULL, 'High', 85, 'Disruption to financial transaction processing', 'Inability to process payments impacts revenue and regulatory compliance', 'Revenue Impact', 'High', 'Amplifier'),
(3, 'Business Operations', NULL, 'Moderate', 55, 'Disruption to HR payroll processing', 'Delayed payroll affects employee satisfaction and compliance', 'Employee Impact', 'Moderate', 'Amplifier'),

-- Corporate Assets Domain
(3, 'Corporate Assets', 'Confidentiality', 'Critical', 95, 'Exposure of financial forecasts', 'Premature disclosure impacts stock price and competitive position', 'Competitive Harm', 'Critical', 'Amplifier'),
(3, 'Corporate Assets', 'Integrity', 'High', 80, 'Manipulation of financial data', 'Incorrect data leads to wrong business decisions', 'Decision Quality', 'High', 'Amplifier'),
(3, 'Corporate Assets', 'Availability', 'Moderate', 50, 'Temporary unavailability of HR system', 'Delays in employee onboarding and HR processes', 'Operational Delay', 'Moderate', 'Dampener'),

-- Personnel Safety Domain
(3, 'Personnel Safety', NULL, 'Low', 25, 'Inability to process payroll', 'Employees may miss direct deposits', 'Financial Hardship', 'Low', 'Dampener'),

-- National Interests Domain
(3, 'National Interests', 'Confidentiality', 'High', 75, 'Unauthorized disclosure of contractor information', 'May affect national security if classified info involved', 'Classification Level', 'High', 'Amplifier'),

-- Additional Impact Areas
(3, 'IT Infrastructure', 'Availability', 'High', 85, 'Complete cloud infrastructure outage', 'All enterprise systems become unavailable', 'Business Continuity', 'High', 'Amplifier'),
(3, 'Customer Data', 'Confidentiality', 'Critical', 90, 'Breach of customer PII', 'Regulatory fines, reputational damage, customer churn', 'Regulatory Penalty', 'Critical', 'Amplifier'),
(3, 'Intellectual Property', 'Confidentiality', 'High', 80, 'Theft of proprietary software', 'Loss of competitive advantage', 'Market Position', 'High', 'Amplifier')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. CHECKLIST STATES (RMF Workflow - 3 systems x 6 steps)
-- =============================================================================
DO $$
DECLARE
    sys1_id INTEGER;
    sys2_id INTEGER;
    sys3_id INTEGER;
BEGIN
    SELECT id INTO sys1_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'ECI' LIMIT 1;
    SELECT id INTO sys2_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'HRIS' LIMIT 1;
    SELECT id INTO sys3_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'FMS' LIMIT 1;

    IF sys1_id IS NOT NULL THEN
        -- ECI System RMF Workflow Checklists
        INSERT INTO checklist_states (client_id, checklist_id, items)
        VALUES 
        (3, concat('nist-800-37-categorize-', sys1_id), '{"c1_objectives": {"confidentiality": {"level": "Moderate", "selected": true}, "integrity": {"level": "Moderate", "selected": true}, "availability": {"level": "Moderate", "selected": true}}, "system_type": "Moderate", "completed": true}'::json),
        (3, concat('nist-800-37-select-', sys1_id), '{"baseline": "Moderate", "controls_selected": 325, "tailoring_applied": true, "compensing_controls": 5, "completed": false}'::json),
        (3, concat('nist-800-37-implement-', sys1_id), '{"implementation_progress": 65, "controls_implemented": 211, "controls_remaining": 114, "common_controls": 45, "completed": false}'::json),
        (3, concat('nist-800-37-assess-', sys1_id), '{"assessment_progress": 30, "controls_tested": 97, "open_findings": 12, "completed": false}'::json),
        (3, concat('nist-800-37-authorize-', sys1_id), '{"package_complete": false, "ssp_reviewed": true, "risk_determination": "Moderate", "completed": false}'::json),
        (3, concat('nist-800-37-monitor-', sys1_id), '{"continuous_monitoring": true, "monthly_reviews": 3, "active_poams": 10, "completed": false}'::json)
        ON CONFLICT DO NOTHING;
    END IF;

    IF sys2_id IS NOT NULL THEN
        -- HRIS System RMF Workflow Checklists  
        INSERT INTO checklist_states (client_id, checklist_id, items)
        VALUES 
        (3, concat('nist-800-37-categorize-', sys2_id), '{"c1_objectives": {"confidentiality": {"level": "Moderate", "selected": true}, "integrity": {"level": "Low", "selected": true}, "availability": {"level": "Low", "selected": true}}, "system_type": "Low", "completed": true}'::json),
        (3, concat('nist-800-37-select-', sys2_id), '{"baseline": "Low", "controls_selected": 125, "tailoring_applied": true, "compensing_controls": 2, "completed": true}'::json),
        (3, concat('nist-800-37-implement-', sys2_id), '{"implementation_progress": 90, "controls_implemented": 113, "controls_remaining": 12, "common_controls": 35, "completed": false}'::json),
        (3, concat('nist-800-37-assess-', sys2_id), '{"assessment_progress": 70, "controls_tested": 88, "open_findings": 5, "completed": false}'::json),
        (3, concat('nist-800-37-authorize-', sys2_id), '{"package_complete": false, "ssp_reviewed": false, "risk_determination": "Pending", "completed": false}'::json),
        (3, concat('nist-800-37-monitor-', sys2_id), '{"continuous_monitoring": false, "monthly_reviews": 0, "active_poams": 10, "completed": false}'::json)
        ON CONFLICT DO NOTHING;
    END IF;

    IF sys3_id IS NOT NULL THEN
        -- FMS System RMF Workflow Checklists
        INSERT INTO checklist_states (client_id, checklist_id, items)
        VALUES 
        (3, concat('nist-800-37-categorize-', sys3_id), '{"c1_objectives": {"confidentiality": {"level": "High", "selected": true}, "integrity": {"level": "High", "selected": true}, "availability": {"level": "High", "selected": true}}, "system_type": "High", "completed": true}'::json),
        (3, concat('nist-800-37-select-', sys3_id), '{"baseline": "High", "controls_selected": 542, "tailoring_applied": true, "compensing_controls": 15, "completed": true}'::json),
        (3, concat('nist-800-37-implement-', sys3_id), '{"implementation_progress": 40, "controls_implemented": 217, "controls_remaining": 325, "common_controls": 60, "completed": false}'::json),
        (3, concat('nist-800-37-assess-', sys3_id), '{"assessment_progress": 15, "controls_tested": 81, "open_findings": 18, "completed": false}'::json),
        (3, concat('nist-800-37-authorize-', sys3_id), '{"package_complete": false, "ssp_reviewed": false, "risk_determination": "Pending", "completed": false}'::json),
        (3, concat('nist-800-37-monitor-', sys3_id), '{"continuous_monitoring": false, "monthly_reviews": 0, "active_poams": 10, "completed": false}'::json)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 8. EVIDENCE ITEMS (15 evidence items)
-- =============================================================================
INSERT INTO evidence (client_id, evidence_id, description, type, status, owner, location, framework)
VALUES 
(3, 'NIST-AC-2-001', 'Access Control Policy - AC-2 Account Management', 'Document', 'verified', 'Security Team', 'SharePoint/Policy/AC-2-Policy-v2.pdf', 'nist-800-53'),
(3, 'NIST-AU-3-001', 'Audit Log Configuration - Splunk Dashboard', 'Screenshot', 'verified', 'IT Operations', 'https://splunk.company.com/dashboards/audit', 'nist-800-53'),
(3, 'NIST-SC-8-001', 'TLS 1.2 Configuration Guide', 'Document', 'pending', 'Network Team', 'SharePoint/Network/TLS-Config.pdf', 'nist-800-53'),
(3, 'NIST-IA-5-001', 'MFA Implementation Plan', 'Document', 'verified', 'IAM Team', 'SharePoint/IAM/MFA-Plan-2024.pdf', 'nist-800-53'),
(3, 'NIST-CP-9-001', 'Disaster Recovery Test Report - Q1 2024', 'Document', 'verified', 'Business Continuity', 'SharePoint/DR/DR-Test-Q1-2024.pdf', 'nist-800-53'),
(3, 'NIST-SI-2-001', 'Patch Management Schedule - March 2024', 'Spreadsheet', 'verified', 'IT Operations', 'SharePoint/PatchMgmt/Schedule-Mar2024.xlsx', 'nist-800-53'),
(3, 'NIST-AC-6-001', 'Least Privilege Review - Q1 2024', 'Document', 'pending', 'Security Team', 'SharePoint/Access/Privilege-Review-Q1.pdf', 'nist-800-53'),
(3, 'NIST-AT-3-001', 'Security Awareness Training Records', 'Spreadsheet', 'verified', 'Training', 'SharePoint/Training/Records-2024.xlsx', 'nist-800-53'),
(3, 'NIST-IR-4-001', 'Incident Response Plan v3.0', 'Document', 'verified', 'Security Team', 'SharePoint/IR/IR-Plan-v3.pdf', 'nist-800-53'),
(3, 'NIST-SI-2-002', 'Vulnerability Scan Report - March 2024', 'Document', 'expired', 'IT Operations', 'SharePoint/VulnScan/Mar2024-Report.pdf', 'nist-800-53'),
(3, 'NIST-AC-2-002', 'User Access Review Certification', 'Document', 'verified', 'IT Operations', 'SharePoint/Access/User-Access-Cert-Q1.pdf', 'nist-800-53'),
(3, 'NIST-AU-2-001', 'Event Log Retention Policy', 'Document', 'verified', 'IT Operations', 'SharePoint/Audit/LogRetention-Policy.pdf', 'nist-800-53'),
(3, 'NIST-SC-13-001', 'Cryptographic Standards Document', 'Document', 'pending', 'Security Team', 'SharePoint/Crypto/Standards-v2.pdf', 'nist-800-53'),
(3, 'SOX-CONTROL-001', 'Segregation of Duties Matrix', 'Spreadsheet', 'verified', 'Finance', 'SharePoint/SOX/SoD-Matrix-2024.xlsx', 'sox'),
(3, 'SOX-CONTROL-002', 'Change Management Procedure', 'Document', 'verified', 'IT Operations', 'SharePoint/SOX/ChangeMgmt-Procedure.pdf', 'sox')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9. RISK ASSESSMENTS (10 risk scenarios using risk_scenarios table)
-- =============================================================================
INSERT INTO risk_scenarios (client_id, title, description, inherent_score, residual_score, status, category, threat_sources, vulnerabilities, affected_assets, likelihood, impact, created_at)
VALUES 
(3, 'Ransomware Attack on Financial Systems', 'Clop ransomware specifically targeting financial institutions could encrypt FMS and demand payment', 85, 55, 'identified', 'Cyber Attack', 'Organized Cybercrime Group', 'No network segmentation, weak backup verification', 'FMS, HRIS', 'High', 'Critical'),
(3, 'Phishing Attack Leading to Credential Theft', ' Spear-phishing campaign targets employees to steal credentials for lateral movement', 75, 45, 'identified', 'Cyber Attack', 'Nation-State Actor, Organized Cybercrime Group', 'No MFA, weak email filtering', 'All systems', 'High', 'High'),
(3, 'Insider Data Exfiltration', 'Privileged user with malicious intent exports sensitive data to personal cloud storage', 70, 40, 'identified', 'Insider Threat', 'Insider Threat - Malicious', 'No DLP, excessive privileges', 'PII, Financial Data', 'Moderate', 'High'),
(3, 'Database Server Failure', 'Primary database storage array fails causing extended service outage', 55, 30, 'identified', 'Infrastructure Failure', 'Database Server Failure', 'No redundancy, aging hardware', 'All database applications', 'Moderate', 'High'),
(3, 'Supply Chain Compromise', 'Compromised software vendor delivers malicious update to enterprise applications', 65, 35, 'identified', 'Supply Chain', 'Supply Chain Compromise', 'No code signing verification', 'All vendor-managed systems', 'Moderate', 'High'),
(3, 'Regulatory Non-Compliance SOX', 'Failure to maintain adequate internal controls leads to SOX audit findings', 80, 50, 'identified', 'Compliance', 'N/A', 'Incomplete control documentation', 'FMS', 'Moderate', 'Critical'),
(3, 'Data Center Flooding', 'Flash flood damages primary data center causing extended outage', 50, 25, 'identified', 'Natural Disaster', 'Data Center Flooding', 'Single data center location', 'All hosted systems', 'Low', 'Critical'),
(3, 'Advanced Persistent Threat', 'Nation-state actor establishes persistence in network undetected', 90, 60, 'identified', 'Cyber Attack', 'Nation-State Actor (APT29)', 'Unpatched systems, weak monitoring', 'All systems', 'High', 'Critical'),
(3, 'Developer Introducing SQL Injection', 'Software developer leaves unsanitized input allowing SQL injection', 70, 40, 'identified', 'Software Vulnerability', 'Developer Coding Error', 'No input validation, no WAF', 'Web applications', 'Moderate', 'High'),
(3, 'Power Grid Failure', 'Regional power grid failure causes extended outage at primary facility', 45, 20, 'identified', 'Infrastructure Failure', 'Power Grid Instability', 'Limited UPS capacity', 'All infrastructure', 'Low', 'High')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 10. NIST 800-53 ASSESSMENTS (Sample controls for each system)
-- =============================================================================
DO $$
DECLARE
    sys1_id INTEGER;
    sys2_id INTEGER;
    sys3_id INTEGER;
BEGIN
    SELECT id INTO sys1_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'ECI' LIMIT 1;
    SELECT id INTO sys2_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'HRIS' LIMIT 1;
    SELECT id INTO sys3_id FROM federal_fisma_systems WHERE client_id = 3 AND acronym = 'FMS' LIMIT 1;

    -- ECI System Controls Assessment (Sample 10 controls)
    IF sys1_id IS NOT NULL THEN
        INSERT INTO federal_nist_800_53_assessments (client_id, fisma_system_id, control_id, implementation_status, implementation_description, test_results, compliance_status)
        VALUES 
        (3, sys1_id, 'AC-2', 'Implemented', 'Formal account management procedure in place with quarterly reviews', 'Reviewed account provisioning forms and termination checklist - all compliant', 'compliant'),
        (3, sys1_id, 'AC-3', 'Implemented', 'Role-based access control enforced through Active Directory groups', 'Tested access by attempting unauthorized file access - access denied correctly', 'compliant'),
        (3, sys1_id, 'AU-3', 'Implemented', 'All authentication events logged to centralized Splunk instance', 'Verified log retention for 90 days - all events captured', 'compliant'),
        (3, sys1_id, 'IA-5', 'Partially Implemented', 'MFA deployed for admin accounts, still rolling out to regular users', 'Verified MFA for 65% of privileged accounts', 'partial'),
        (3, sys1_id, 'SC-8', 'Partially Implemented', 'TLS 1.2 enforced for external connections, internal still on TLS 1.1', 'Scanned 100 endpoints - 15 still accept TLS 1.1', 'partial'),
        (3, sys1_id, 'CP-9', 'Implemented', 'Daily backups with weekly restore tests', 'Verified backup logs and last successful restore test - 3/1/2024', 'compliant'),
        (3, sys1_id, 'SI-2', 'Partially Implemented', 'Critical patches within 7 days, high within 30 days', 'Found 12 critical patches outstanding over 30 days', 'partial'),
        (3, sys1_id, 'AT-3', 'Implemented', 'Annual security awareness training mandatory for all staff', '95% completion rate for 2024 training', 'compliant'),
        (3, sys1_id, 'IR-4', 'Implemented', 'IR plan tested quarterly with documented results', 'Last IR test 2/15/2024 - all milestones met', 'compliant'),
        (3, sys1_id, 'RA-5', 'Implemented', 'Monthly vulnerability scans with tracking to remediation', 'March scan found 45 vulnerabilities - 40 remediated', 'compliant')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HRIS System Controls Assessment
    IF sys2_id IS NOT NULL THEN
        INSERT INTO federal_nist_800_53_assessments (client_id, fisma_system_id, control_id, implementation_status, implementation_description, test_results, compliance_status)
        VALUES 
        (3, sys2_id, 'AC-2', 'Partially Implemented', 'Individual accounts created, but shared admin accounts still exist', 'Found 5 shared service accounts in use', 'partial'),
        (3, sys2_id, 'AC-3', 'Implemented', 'RBAC model implemented with quarterly access reviews', 'Reviewed access matrix - all roles properly assigned', 'compliant'),
        (3, sys2_id, 'AU-2', 'Implemented', 'PII access logged with 1-year retention', 'Verified audit logs show all PII access events', 'compliant'),
        (3, sys2_id, 'SC-8', 'Implemented', 'Database encryption at rest enabled using TDE', 'Confirmed encryption status in database configuration', 'compliant'),
        (3, sys2_id, 'AC-6', 'Implemented', 'Least privilege enforced with monthly access reviews', 'March review found 3 users with excessive access - remediated', 'compliant'),
        (3, sys2_id, 'CP-2', 'Not Implemented', 'BIA not yet documented for HRIS', 'No BIA documentation found', 'non_compliant'),
        (3, sys2_id, 'AT-2', 'Partially Implemented', 'Privacy training available but not mandatory', 'Only 60% completion rate', 'partial'),
        (3, sys2_id, 'RA-5', 'Not Implemented', 'HRIS not included in vulnerability scanning program', 'No vulnerability scan reports found', 'non_compliant'),
        (3, sys2_id, 'SC-13', 'Implemented', 'SHA-256 used for all password hashing', 'Verified password hash algorithm in source code', 'compliant'),
        (3, sys2_id, 'PL-2', 'Not Implemented', 'System Security Plan not yet created', 'No SSP documentation found', 'non_compliant')
        ON CONFLICT DO NOTHING;
    END IF;

    -- FMS System Controls Assessment
    IF sys3_id IS NOT NULL THEN
        INSERT INTO federal_nist_800_53_assessments (client_id, fisma_system_id, control_id, implementation_status, implementation_description, test_results, compliance_status)
        VALUES 
        (3, sys3_id, 'AC-2', 'Partially Implemented', 'SoD conflicts identified in approval workflows', 'Found 8 users with conflicting transaction permissions', 'partial'),
        (3, sys3_id, 'AC-3', 'Implemented', 'Transaction-level authorization controls in place', 'Tested 20 transactions - all authorization checks passed', 'compliant'),
        (3, sys3_id, 'AU-2', 'Implemented', 'All financial transactions logged with 7-year retention', 'Verified audit trail meets SOX requirements', 'compliant'),
        (3, sys3_id, 'IA-2', 'Partially Implemented', 'MFA planned but not yet deployed for FMS', 'Currently using password-only authentication', 'partial'),
        (3, sys3_id, 'SC-8', 'Implemented', 'TLS 1.3 enforced for all FMS connections', 'SSL scan shows only TLS 1.3 enabled', 'compliant'),
        (3, sys3_id, 'CC6.1', 'Partially Implemented', 'Change management procedure exists but not consistently followed', 'Audit found 3 production changes without approval', 'partial'),
        (3, sys3_id, 'CC7.2', 'Not Implemented', 'No SIEM integration for automated monitoring', 'All monitoring done manually via weekly reviews', 'non_compliant'),
        (3, sys3_id, 'CC8.1', 'Partially Implemented', 'Quarterly vulnerability scans, but patch SLAs not met', 'Critical patches averaging 45 days to remediate', 'partial'),
        (3, sys3_id, 'CC6.6', 'Implemented', 'Monthly backup restoration tests documented', 'Last successful restore test 3/1/2024', 'compliant'),
        (3, sys3_id, 'CC9.1', 'Not Implemented', 'No vendor security assessments completed', 'All third-party assessments overdue', 'non_compliant')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- SELECT 'FISMA Systems: ' || COUNT(*)::text FROM federal_fisma_systems WHERE client_id = 3;
-- SELECT 'POA&M Items: ' || COUNT(*)::text FROM poam_items WHERE poam_id IN (SELECT id FROM federal_poams WHERE client_id = 3);
-- SELECT 'Threat Sources: ' || COUNT(*)::text FROM nist_80030_threat_sources WHERE client_id = 3;
-- SELECT 'Threat Events: ' || COUNT(*)::text FROM nist_80030_threat_events WHERE client_id = 3;
-- SELECT 'Impact Assessments: ' || COUNT(*)::text FROM nist_80030_impact_assessments WHERE client_id = 3;
-- SELECT 'Checklist States: ' || COUNT(*)::text FROM checklist_states WHERE client_id = 3;
-- SELECT 'Evidence Items: ' || COUNT(*)::text FROM evidence WHERE client_id = 3;
-- SELECT 'Risk Scenarios: ' || COUNT(*)::text FROM risk_scenarios WHERE client_id = 3;
-- SELECT '800-53 Assessments: ' || COUNT(*)::text FROM federal_nist_800_53_assessments WHERE client_id = 3;

\echo 'Demo data seeded successfully for Client 3!'
\echo 'FISMA Systems created'
\echo 'POA&M Plans and Items created'
\echo 'Threat Sources and Events created'
\echo 'Impact Assessments created'
\echo 'RMF Workflow Checklists created'
\echo 'Evidence Items created'
\echo 'Risk Scenarios created'
\echo '800-53 Control Assessments created'
