const { Client } = require('pg');

async function seedNISTData() {
    const client = new Client({
        host: 'aws-1-eu-west-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.erjlkrtccmlrvsjtpppp',
        password: 'rDAO3DsFTjZyZJpj',
        ssl: { rejectUnauthorized: false }
    });

    const clientId = 3;

    try {
        await client.connect();
        console.log('Connected to database\n');

        // 1. Create FISMA Systems (10 systems)
        console.log('=== Creating 10 FISMA Systems ===');
        const fismaSystems = [
            { name: 'Federal Financial Management System', acronym: 'FFMS', owner: 'John Smith', status: 'active', fips: 'HIGH', desc: 'Core financial management and accounting system' },
            { name: 'Healthcare Information System', acronym: 'HIS', owner: 'Dr. Sarah Johnson', status: 'active', fips: 'HIGH', desc: 'Electronic health records and patient data management' },
            { name: 'Grant Management System', acronym: 'GMS', owner: 'Michael Brown', status: 'active', fips: 'MODERATE', desc: 'Federal grant application and tracking system' },
            { name: 'Personnel Security System', acronym: 'PSS', owner: 'Emily Davis', status: 'active', fips: 'HIGH', desc: 'Background investigation and clearance management' },
            { name: 'Logistics Management System', acronym: 'LMS', owner: 'Robert Wilson', status: 'active', fips: 'MODERATE', desc: 'Supply chain and inventory management' },
            { name: 'Tax Processing System', acronym: 'TPS', owner: 'Jennifer Lee', status: 'active', fips: 'HIGH', desc: 'Tax return processing and collection system' },
            { name: 'Legal Case Management', acronym: 'LCM', owner: 'David Martinez', status: 'active', fips: 'MODERATE', desc: 'Case tracking and legal document management' },
            { name: 'Public-facing Web Portal', acronym: 'PWP', owner: 'Lisa Anderson', status: 'active', fips: 'LOW', desc: 'Citizen services and information portal' },
            { name: 'Intelligence Analysis System', acronym: 'IAS', owner: 'James Taylor', status: 'active', fips: 'HIGH', desc: 'Classified intelligence data analysis' },
            { name: 'Training Management System', acronym: 'TMS', owner: 'Patricia Thomas', status: 'active', fips: 'LOW', desc: 'Employee training and certification tracking' }
        ];

        const systemIds = [];
        for (const sys of fismaSystems) {
            const result = await client.query(`
                INSERT INTO federal_fisma_systems 
                (client_id, name, acronym, owner, status, fips_199_overall, description, created_at, updated_at, controls_count, assets_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9)
                RETURNING id
            `, [clientId, sys.name, sys.acronym, sys.owner, sys.status, sys.fips, sys.desc, Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 500) + 100]);
            systemIds.push(result.rows[0].id);
            console.log(`Created system: ${sys.acronym} (ID: ${result.rows[0].id})`);
        }

        // 2. Create POA&M Plans (10 plans)
        console.log('\n=== Creating 10 POA&M Plans ===');
        const poamPlans = [
            { name: 'POA&M FY2024-Q1', status: 'active', system_id: systemIds[0] },
            { name: 'POA&M FY2024-Q2', status: 'active', system_id: systemIds[1] },
            { name: 'POA&M FY2024-Q3', status: 'active', system_id: systemIds[2] },
            { name: 'POA&M FY2024-Q4', status: 'draft', system_id: systemIds[3] },
            { name: 'POA&M FY2025-Q1', status: 'active', system_id: systemIds[4] },
            { name: 'POA&M FY2025-Q2', status: 'active', system_id: systemIds[5] },
            { name: 'POA&M FY2025-Q3', status: 'draft', system_id: systemIds[6] },
            { name: 'POA&M FY2025-Q4', status: 'draft', system_id: systemIds[7] },
            { name: 'POA&M FY2026-Q1', status: 'draft', system_id: systemIds[8] },
            { name: 'Enterprise POA&M', status: 'active', system_id: systemIds[9] }
        ];

        const poamIds = [];
        for (const poam of poamPlans) {
            const result = await client.query(`
                INSERT INTO federal_poams
                (client_id, name, status, fisma_system_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id
            `, [clientId, poam.name, poam.status, poam.system_id]);
            poamIds.push(result.rows[0].id);
            console.log(`Created POA&M: ${poam.name} (ID: ${result.rows[0].id})`);
        }

        // 3. Create POA&M Items (30 items - 3 per plan)
        console.log('\n=== Creating 30 POA&M Items ===');
        const poamItems = [
            // System 1 POA&M items
            { poam_id: poamIds[0], weakness: 'Missing encryption for data at rest', control: 'SC-28', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[0], weakness: 'Inadequate access logging', control: 'AU-2', severity: 'Medium', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[0], weakness: 'Weak password policy', control: 'IA-5', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            // System 2 POA&M items
            { poam_id: poamIds[1], weakness: 'No multi-factor authentication', control: 'IA-2', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[1], weakness: 'Unpatched operating system', control: 'SI-2', severity: 'High', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[1], weakness: 'Missing data backup procedures', control: 'CP-9', severity: 'Medium', status: 'Not Started', milestone: 'Q3 2024' },
            // System 3 POA&M items
            { poam_id: poamIds[2], weakness: 'Insufficient network segmentation', control: 'SC-7', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[2], weakness: 'No intrusion detection system', control: 'SI-4', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[2], weakness: 'Weak incident response plan', control: 'IR-8', severity: 'Medium', status: 'Completed', milestone: 'Q1 2024' },
            // System 4 POA&M items
            { poam_id: poamIds[3], weakness: 'Missing security awareness training', control: 'AT-2', severity: 'Low', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[3], weakness: 'No contingency planning documentation', control: 'CP-2', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[3], weakness: 'Unclear change management process', control: 'CM-3', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' },
            // More POA&M items
            { poam_id: poamIds[4], weakness: 'Missing vulnerability scanner license', control: 'RA-5', severity: 'High', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[4], weakness: 'No security assessment procedure', control: 'CA-2', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[4], weakness: 'Weak physical security controls', control: 'PE-3', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[5], weakness: 'No encryption for data in transit', control: 'SC-8', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[5], weakness: 'Missing audit log review process', control: 'AU-6', severity: 'Medium', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[5], weakness: 'Inadequate boundary protection', control: 'SC-7', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[6], weakness: 'No configuration management database', control: 'CM-8', severity: 'Low', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[6], weakness: 'Missing system integrity checks', control: 'SI-3', severity: 'High', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[6], weakness: 'Weak identification and authentication', control: 'IA-2', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[7], weakness: 'No incident handling procedures', control: 'IR-4', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[7], weakness: 'Missing media sanitization procedures', control: 'MP-6', severity: 'Medium', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[7], weakness: 'Inadequate personnel security', control: 'PS-3', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[8], weakness: 'No risk assessment documentation', control: 'RA-3', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[8], weakness: 'Missing system and communications protection', control: 'SC-1', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[8], weakness: 'Weak information integrity controls', control: 'SI-1', severity: 'Medium', status: 'Completed', milestone: 'Q1 2024' },
            { poam_id: poamIds[9], weakness: 'No enterprise security architecture', control: 'SA-3', severity: 'High', status: 'In Progress', milestone: 'Q2 2024' },
            { poam_id: poamIds[9], weakness: 'Missing supply chain risk management', control: 'SR-1', severity: 'High', status: 'Not Started', milestone: 'Q3 2024' },
            { poam_id: poamIds[9], weakness: 'Inadequate privacy impact assessment', control: 'RA-8', severity: 'Medium', status: 'In Progress', milestone: 'Q2 2024' }
        ];

        for (const item of poamItems) {
            await client.query(`
                INSERT INTO poam_items
                (poam_id, weakness_name, control_number, severity, status, scheduled_completion, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [item.poam_id, item.weakness, item.control, item.severity, item.status, item.milestone]);
        }
        console.log(`Created ${poamItems.length} POA&M items`);

        // 4. Create Threat Sources (10 sources)
        console.log('\n=== Creating 10 Threat Sources ===');
        const threatSources = [
            { name: 'Nation-State Actor: APT29', intent: 'Economic Espionage', capability: 'Sophisticated', motivation: 'High', desc: 'Russian intelligence service cyber operations' },
            { name: 'Organized Crime Group', intent: 'Financial Gain', capability: 'Moderate', motivation: 'High', desc: 'Ransomware and financial theft operations' },
            { name: 'Insider Threat - Negligent', intent: 'Unintentional Harm', capability: 'Low', motivation: 'Medium', desc: 'Employee negligence and policy violations' },
            { name: 'Hacktivist Group', intent: 'Political Motivation', capability: 'Moderate', motivation: 'High', desc: 'Politically motivated DDoS and defacement' },
            { name: 'Nation-State Actor: APT41', intent: 'Strategic Advantage', capability: 'Sophisticated', motivation: 'High', desc: 'Chinese state-sponsored cyber operations' },
            { name: 'Insider Threat - Malicious', intent: 'Espionage', capability: 'Moderate', motivation: 'Medium', desc: 'Disgruntled employee data exfiltration' },
            { name: 'Script Kiddie', intent: 'Skill Development', capability: 'Low', motivation: 'Low', desc: 'Amateur attacks using pre-built tools' },
            { name: 'Terrorist Organization', intent: 'Disruption', capability: 'Moderate', motivation: 'High', desc: 'Terrorist cyber operations targeting critical infrastructure' },
            { name: 'Competitor - Corporate Espionage', intent: 'Competitive Advantage', capability: 'Sophisticated', motivation: 'Medium', desc: 'Corporate espionage and IP theft' },
            { name: 'Natural Disaster', intent: 'Environmental', capability: 'N/A', motivation: 'N/A', desc: 'Hurricanes, earthquakes, floods affecting infrastructure' }
        ];

        const sourceIds = [];
        for (const src of threatSources) {
            const result = await client.query(`
                INSERT INTO nist_80030_threat_sources
                (client_id, name, intent, capability, motivation, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING id
            `, [clientId, src.name, src.intent, src.capability, src.motivation, src.desc]);
            sourceIds.push(result.rows[0].id);
            console.log(`Created threat source: ${src.name}`);
        }

        // 5. Create Threat Events (10 events)
        console.log('\n=== Creating 10 Threat Events ===');
        const threatEvents = [
            { source_id: sourceIds[0], event: 'Spear Phishing Campaign', likelihood: 'High', desc: 'Targeted spear phishing emails to executive leadership' },
            { source_id: sourceIds[0], event: 'Supply Chain Compromise', likelihood: 'Medium', desc: 'Compromise of software vendor to infiltrate systems' },
            { source_id: sourceIds[1], event: 'Ransomware Attack', likelihood: 'High', desc: 'Deploy ransomware to encrypt critical data' },
            { source_id: sourceIds[1], event: 'Business Email Compromise', likelihood: 'High', desc: 'Social engineering to divert financial transactions' },
            { source_id: sourceIds[2], event: 'Accidental Data Leak', likelihood: 'Medium', desc: 'Employee sends sensitive data to wrong recipient' },
            { source_id: sourceIds[2], event: 'Weak Password Usage', likelihood: 'High', desc: 'Use of weak or default passwords on systems' },
            { source_id: sourceIds[3], event: 'DDoS Attack', likelihood: 'Medium', desc: 'Distributed denial of service against public-facing services' },
            { source_id: sourceIds[3], event: 'Website Defacement', likelihood: 'Low', desc: 'Hacktivist defacement of government websites' },
            { source_id: sourceIds[4], event: 'Zero-Day Exploitation', likelihood: 'Medium', desc: 'Exploit unknown vulnerabilities in software' },
            { source_id: sourceIds[5], event: 'Data Exfiltration', likelihood: 'Low', desc: 'Malicious insider copies data to removable media' }
        ];

        for (const evt of threatEvents) {
            await client.query(`
                INSERT INTO nist_80030_threat_events
                (threat_source_id, threat_event_name, likelihood, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [evt.source_id, evt.event, evt.likelihood, evt.desc]);
        }
        console.log(`Created ${threatEvents.length} threat events`);

        // 6. Create Impact Assessments (10 assessments)
        console.log('\n=== Creating 10 Impact Assessments ===');
        const impactAssessments = [
            { system_id: systemIds[0], impact: 'High', impact_type: 'Confidentiality', desc: 'Unauthorized disclosure of financial data could cause significant harm', likelihood: 'Medium' },
            { system_id: systemIds[0], impact: 'High', impact_type: 'Availability', desc: 'System downtime affects government operations and citizen services', likelihood: 'Low' },
            { system_id: systemIds[1], impact: 'High', impact_type: 'Confidentiality', desc: 'Breach of patient health records violates HIPAA and privacy laws', likelihood: 'Medium' },
            { system_id: systemIds[1], impact: 'High', impact_type: 'Integrity', desc: 'Modification of medical records could lead to patient harm', likelihood: 'Low' },
            { system_id: systemIds[2], impact: 'Medium', impact_type: 'Confidentiality', desc: 'Disclosure of grant applicant information could cause unfair advantage', likelihood: 'Medium' },
            { system_id: systemIds[3], impact: 'High', impact_type: 'Confidentiality', desc: 'Compromise of clearance information endangers national security', likelihood: 'Low' },
            { system_id: systemIds[4], impact: 'Medium', impact_type: 'Availability', desc: 'Supply chain disruption affects mission-critical operations', likelihood: 'Medium' },
            { system_id: systemIds[5], impact: 'High', impact_type: 'Integrity', desc: 'Tax record manipulation could result in financial fraud', likelihood: 'Low' },
            { system_id: systemIds[6], impact: 'Medium', impact_type: 'Confidentiality', desc: 'Attorney-client privileged information could be disclosed', likelihood: 'Medium' },
            { system_id: systemIds[7], impact: 'Low', impact_type: 'Availability', desc: 'Public portal downtime reduces citizen trust', likelihood: 'High' }
        ];

        for (const imp of impactAssessments) {
            await client.query(`
                INSERT INTO nist_80030_impact_assessments
                (client_id, fisma_system_id, impact_level, impact_type, description, likelihood, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [clientId, imp.system_id, imp.impact, imp.impact_type, imp.desc, imp.likelihood]);
        }
        console.log(`Created ${impactAssessments.length} impact assessments`);

        // 7. Create Checklist States (10 states)
        console.log('\n=== Creating 10 Checklist States ===');
        const checklistStates = [
            { system_id: systemIds[0], name: 'AC-1 Access Control Policy', status: 'Pass', finding: 'No findings', desc: 'Access control policy and procedures are documented' },
            { system_id: systemIds[0], name: 'AC-2 Account Management', status: 'Fail', finding: 'Weak', desc: 'No process for reviewing account privileges' },
            { system_id: systemIds[1], name: 'AU-2 Audit Events', status: 'Pass', finding: 'No findings', desc: 'Audit events are configured and monitored' },
            { system_id: systemIds[1], name: 'IA-2 Identification and Authentication', status: 'Fail', finding: 'Medium', desc: 'MFA not implemented for privileged accounts' },
            { system_id: systemIds[2], name: 'SC-8 Transmission Confidentiality', status: 'Pass', finding: 'No findings', desc: 'TLS 1.3 implemented for all communications' },
            { system_id: systemIds[2], name: 'SI-2 Flaw Remediation', status: 'Fail', finding: 'High', desc: 'Critical patches not applied within timeframe' },
            { system_id: systemIds[3], name: 'CP-2 Contingency Plan', status: 'Pass', finding: 'No findings', desc: 'Contingency plan is documented and tested' },
            { system_id: systemIds[3], name: 'IR-4 Incident Handling', status: 'Fail', finding: 'Medium', desc: 'Incident response plan not tested in 12 months' },
            { system_id: systemIds[4], name: 'RA-5 Vulnerability Scanning', status: 'Pass', finding: 'No findings', desc: 'Quarterly vulnerability scans performed' },
            { system_id: systemIds[5], name: 'CA-2 Security Assessments', status: 'Fail', finding: 'Low', desc: 'Security assessment not completed annually' }
        ];

        for (const chk of checklistStates) {
            await client.query(`
                INSERT INTO checklist_states
                (client_id, fisma_system_id, name, status, finding, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [clientId, chk.system_id, chk.name, chk.status, chk.finding, chk.desc]);
        }
        console.log(`Created ${checklistStates.length} checklist states`);

        // 8. Create Evidence records (10 records)
        console.log('\n=== Creating 10 Evidence Records ===');
        const evidenceRecords = [
            { client_id: clientId, name: 'Access Control Policy Document', type: 'policy', system_id: systemIds[0] },
            { client_id: clientId, name: 'Risk Assessment Report FY2024', type: 'assessment', system_id: systemIds[0] },
            { client_id: clientId, name: 'Contency Plan Test Results', type: 'test', system_id: systemIds[1] },
            { client_id: clientId, name: 'Incident Response Playbook', type: 'procedure', system_id: systemIds[1] },
            { client_id: clientId, name: 'Security Awareness Training Records', type: 'training', system_id: systemIds[2] },
            { client_id: clientId, name: 'Vulnerability Scan Report Q1', type: 'assessment', system_id: systemIds[2] },
            { client_id: clientId, name: 'Penetration Test Report', type: 'assessment', system_id: systemIds[3] },
            { client_id: clientId, name: 'System Security Plan', type: 'policy', system_id: systemIds[3] },
            { client_id: clientId, name: 'POA&M Document FY2024', type: 'policy', system_id: systemIds[4] },
            { client_id: clientId, name: 'Configuration Baseline Documentation', type: 'configuration', system_id: systemIds[4] }
        ];

        for (const ev of evidenceRecords) {
            await client.query(`
                INSERT INTO evidence
                (client_id, name, type, system_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [ev.client_id, ev.name, ev.type, ev.system_id]);
        }
        console.log(`Created ${evidenceRecords.length} evidence records`);

        // 9. Create Risk Scenarios (10 scenarios)
        console.log('\n=== Creating 10 Risk Scenarios ===');
        const riskScenarios = [
            { client_id: clientId, title: 'Ransomware Attack on Financial System', likelihood: 'Medium', impact: 'High', status: 'open', system_id: systemIds[0] },
            { client_id: clientId, title: 'Data Breach of Patient Records', likelihood: 'Medium', impact: 'High', status: 'open', system_id: systemIds[1] },
            { client_id: clientId, title: 'Insider Threat - Data Exfiltration', likelihood: 'Low', impact: 'High', status: 'open', system_id: systemIds[1] },
            { client_id: clientId, title: 'Supply Chain Compromise', likelihood: 'Low', impact: 'High', status: 'mitigated', system_id: systemIds[2] },
            { client_id: clientId, title: 'DDoS Attack on Public Portal', likelihood: 'High', impact: 'Low', status: 'open', system_id: systemIds[7] },
            { client_id: clientId, title: 'Phishing Attack on Executives', likelihood: 'High', impact: 'Medium', status: 'mitigated', system_id: systemIds[0] },
            { client_id: clientId, title: 'Unpatched Vulnerability Exploitation', likelihood: 'Medium', impact: 'High', status: 'open', system_id: systemIds[4] },
            { client_id: clientId, title: 'Physical Security Breach', likelihood: 'Low', impact: 'Medium', status: 'mitigated', system_id: systemIds[3] },
            { client_id: clientId, title: 'Unauthorized Access via Weak Password', likelihood: 'High', impact: 'High', status: 'open', system_id: systemIds[5] },
            { client_id: clientId, title: 'Natural Disaster Impact', likelihood: 'Low', impact: 'High', status: 'open', system_id: systemIds[6] }
        ];

        for (const risk of riskScenarios) {
            await client.query(`
                INSERT INTO risk_scenarios
                (client_id, title, likelihood, impact, status, system_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [risk.client_id, risk.title, risk.likelihood, risk.impact, risk.status, risk.system_id]);
        }
        console.log(`Created ${riskScenarios.length} risk scenarios`);

        console.log('\n=== Seed Complete ===');
        console.log(`Total: 10 FISMA systems, 10 POA&M plans, 30 POA&M items, 10 threat sources, 10 threat events, 10 impact assessments, 10 checklist states, 10 evidence records, 10 risk scenarios`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

seedNISTData();
