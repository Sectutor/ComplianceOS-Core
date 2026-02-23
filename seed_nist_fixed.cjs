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

        // Get existing FISMA systems for client 3
        console.log('=== Getting FISMA Systems ===');
        const systems = await client.query(`
            SELECT id, name, acronym FROM federal_fisma_systems 
            WHERE client_id = $1
        `, [clientId]);

        let systemIds = systems.rows.map(r => r.id);
        console.log(`Found ${systemIds.length} FISMA systems`);

        // Create more if we don't have enough
        if (systemIds.length < 10) {
            const newSystems = [
                { name: 'Federal Financial Management System', acronym: 'FFMS' },
                { name: 'Healthcare Information System', acronym: 'HIS' },
                { name: 'Grant Management System', acronym: 'GMS' },
                { name: 'Personnel Security System', acronym: 'PSS' },
                { name: 'Logistics Management System', acronym: 'LMS' },
                { name: 'Tax Processing System', acronym: 'TPS' },
                { name: 'Legal Case Management', acronym: 'LCM' },
                { name: 'Public Web Portal', acronym: 'PWP' },
                { name: 'Intelligence Analysis System', acronym: 'IAS' },
                { name: 'Training Management System', acronym: 'TMS' }
            ];

            for (let i = 0; i < newSystems.length && systemIds.length < 10; i++) {
                const result = await client.query(`
                    INSERT INTO federal_fisma_systems 
                    (client_id, name, acronym, owner, status, fips_199_overall, description, created_at, updated_at, controls_count, assets_count)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9)
                    RETURNING id
                `, [clientId, newSystems[i].name, newSystems[i].acronym, 'System Owner', 'active', 'HIGH', 'Security system', 100, 200]);
                systemIds.push(result.rows[0].id);
            }
        }

        console.log(`Using system IDs: ${systemIds.join(', ')}`);

        // 1. Create POA&M Plans (10 plans) - using correct column names
        console.log('\n=== Creating 10 POA&M Plans ===');
        const poamPlans = [
            { title: 'POA&M FY2024-Q1', status: 'active', source_ssp_id: systemIds[0] },
            { title: 'POA&M FY2024-Q2', status: 'active', source_ssp_id: systemIds[1] },
            { title: 'POA&M FY2024-Q3', status: 'active', source_ssp_id: systemIds[2] },
            { title: 'POA&M FY2024-Q4', status: 'draft', source_ssp_id: systemIds[3] },
            { title: 'POA&M FY2025-Q1', status: 'active', source_ssp_id: systemIds[4] },
            { title: 'POA&M FY2025-Q2', status: 'active', source_ssp_id: systemIds[5] },
            { title: 'POA&M FY2025-Q3', status: 'draft', source_ssp_id: systemIds[6] },
            { title: 'POA&M FY2025-Q4', status: 'draft', source_ssp_id: systemIds[7] },
            { title: 'POA&M FY2026-Q1', status: 'draft', source_ssp_id: systemIds[8] },
            { title: 'Enterprise POA&M', status: 'active', source_ssp_id: systemIds[9] }
        ];

        const poamIds = [];
        for (const poam of poamPlans) {
            const result = await client.query(`
                INSERT INTO federal_poams
                (client_id, title, source_ssp_id, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id
            `, [clientId, poam.title, poam.source_ssp_id, poam.status]);
            poamIds.push(result.rows[0].id);
            console.log(`Created POA&M: ${poam.title} (ID: ${result.rows[0].id})`);
        }

        // 2. Create POA&M Items (30 items - 3 per plan)
        console.log('\n=== Creating 30 POA&M Items ===');
        const poamItems = [
            { poam_id: poamIds[0], control_id: 'SC-28', weakness_name: 'Missing encryption for data at rest', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[0], control_id: 'AU-2', weakness_name: 'Inadequate access logging', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[0], control_id: 'IA-5', weakness_name: 'Weak password policy', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[1], control_id: 'IA-2', weakness_name: 'No multi-factor authentication', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[1], control_id: 'SI-2', weakness_name: 'Unpatched operating system', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[1], control_id: 'CP-9', weakness_name: 'Missing data backup procedures', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[2], control_id: 'SC-7', weakness_name: 'Insufficient network segmentation', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[2], control_id: 'SI-4', weakness_name: 'No intrusion detection system', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[2], control_id: 'IR-8', weakness_name: 'Weak incident response plan', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[3], control_id: 'AT-2', weakness_name: 'Missing security awareness training', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[3], control_id: 'CP-2', weakness_name: 'No contingency planning documentation', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[3], control_id: 'CM-3', weakness_name: 'Unclear change management process', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[4], control_id: 'RA-5', weakness_name: 'Missing vulnerability scanner license', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[4], control_id: 'CA-2', weakness_name: 'No security assessment procedure', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[4], control_id: 'PE-3', weakness_name: 'Weak physical security controls', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[5], control_id: 'SC-8', weakness_name: 'No encryption for data in transit', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[5], control_id: 'AU-6', weakness_name: 'Missing audit log review process', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[5], control_id: 'SC-7', weakness_name: 'Inadequate boundary protection', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[6], control_id: 'CM-8', weakness_name: 'No configuration management database', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[6], control_id: 'SI-3', weakness_name: 'Missing system integrity checks', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[6], control_id: 'IA-2', weakness_name: 'Weak identification and authentication', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[7], control_id: 'IR-4', weakness_name: 'No incident handling procedures', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[7], control_id: 'MP-6', weakness_name: 'Missing media sanitization procedures', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[7], control_id: 'PS-3', weakness_name: 'Inadequate personnel security', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[8], control_id: 'RA-3', weakness_name: 'No risk assessment documentation', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[8], control_id: 'SC-1', weakness_name: 'Missing system and communications protection', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[8], control_id: 'SI-1', weakness_name: 'Weak information integrity controls', status: 'Completed', scheduled_completion_date: '2024-03-31' },
            { poam_id: poamIds[9], control_id: 'SA-3', weakness_name: 'No enterprise security architecture', status: 'In Progress', scheduled_completion_date: '2024-06-30' },
            { poam_id: poamIds[9], control_id: 'SR-1', weakness_name: 'Missing supply chain risk management', status: 'Not Started', scheduled_completion_date: '2024-09-30' },
            { poam_id: poamIds[9], control_id: 'RA-8', weakness_name: 'Inadequate privacy impact assessment', status: 'In Progress', scheduled_completion_date: '2024-06-30' }
        ];

        for (const item of poamItems) {
            await client.query(`
                INSERT INTO poam_items
                (poam_id, control_id, weakness_name, status, scheduled_completion_date, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [item.poam_id, item.control_id, item.weakness_name, item.status, item.scheduled_completion_date]);
        }
        console.log(`Created ${poamItems.length} POA&M items`);

        // 3. Create Threat Sources - using correct column names
        console.log('\n=== Creating 10 Threat Sources ===');
        const threatSources = [
            { type: 'nation-state', name: 'APT29', description: 'Russian intelligence service cyber operations', capability: 'Sophisticated', intent: 'Economic Espionage', targeting: 'Government agencies', motive: 'High' },
            { type: 'crime', name: 'Organized Crime Group', description: 'Ransomware and financial theft operations', capability: 'Moderate', intent: 'Financial Gain', targeting: 'Financial institutions', motive: 'High' },
            { type: 'insider', name: 'Insider Threat - Negligent', description: 'Employee negligence and policy violations', capability: 'Low', intent: 'Unintentional Harm', targeting: 'Internal systems', motive: 'Medium' },
            { type: 'hacktivist', name: 'Hacktivist Group', description: 'Politically motivated DDoS and defacement', capability: 'Moderate', intent: 'Political Motivation', targeting: 'Government websites', motive: 'High' },
            { type: 'nation-state', name: 'APT41', description: 'Chinese state-sponsored cyber operations', capability: 'Sophisticated', intent: 'Strategic Advantage', targeting: 'Defense contractors', motive: 'High' },
            { type: 'insider', name: 'Insider Threat - Malicious', description: 'Disgruntled employee data exfiltration', capability: 'Moderate', intent: 'Espionage', targeting: 'Sensitive data', motive: 'Medium' },
            { type: 'script-kiddie', name: 'Script Kiddie', description: 'Amateur attacks using pre-built tools', capability: 'Low', intent: 'Skill Development', targeting: 'Any vulnerable system', motive: 'Low' },
            { type: 'terrorist', name: 'Terrorist Organization', description: 'Terrorist cyber operations targeting critical infrastructure', capability: 'Moderate', intent: 'Disruption', targeting: 'Critical infrastructure', motive: 'High' },
            { type: 'competitor', name: 'Corporate Espionage', description: 'Corporate espionage and IP theft', capability: 'Sophisticated', intent: 'Competitive Advantage', targeting: 'Trade secrets', motive: 'Medium' },
            { type: 'environmental', name: 'Natural Disaster', description: 'Hurricanes, earthquakes, floods affecting infrastructure', capability: 'N/A', intent: 'Environmental', targeting: 'Physical infrastructure', motive: 'N/A' }
        ];

        const sourceIds = [];
        for (const src of threatSources) {
            const result = await client.query(`
                INSERT INTO nist_80030_threat_sources
                (client_id, type, name, description, capability, intent, targeting, motive, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                RETURNING id
            `, [clientId, src.type, src.name, src.description, src.capability, src.intent, src.targeting, src.motive, 'active']);
            sourceIds.push(result.rows[0].id);
            console.log(`Created threat source: ${src.name}`);
        }

        // 4. Create Threat Events
        console.log('\n=== Creating 10 Threat Events ===');
        const threatEvents = [
            { threat_source_id: sourceIds[0], name: 'Spear Phishing Campaign', description: 'Targeted spear phishing emails to executive leadership', likelihood: 'High' },
            { threat_source_id: sourceIds[0], name: 'Supply Chain Compromise', description: 'Compromise of software vendor to infiltrate systems', likelihood: 'Medium' },
            { threat_source_id: sourceIds[1], name: 'Ransomware Attack', description: 'Deploy ransomware to encrypt critical data', likelihood: 'High' },
            { threat_source_id: sourceIds[1], name: 'Business Email Compromise', description: 'Social engineering to divert financial transactions', likelihood: 'High' },
            { threat_source_id: sourceIds[2], name: 'Accidental Data Leak', description: 'Employee sends sensitive data to wrong recipient', likelihood: 'Medium' },
            { threat_source_id: sourceIds[2], name: 'Weak Password Usage', description: 'Use of weak or default passwords on systems', likelihood: 'High' },
            { threat_source_id: sourceIds[3], name: 'DDoS Attack', description: 'Distributed denial of service against public-facing services', likelihood: 'Medium' },
            { threat_source_id: sourceIds[3], name: 'Website Defacement', description: 'Hacktivist defacement of government websites', likelihood: 'Low' },
            { threat_source_id: sourceIds[4], name: 'Zero-Day Exploitation', description: 'Exploit unknown vulnerabilities in software', likelihood: 'Medium' },
            { threat_source_id: sourceIds[5], name: 'Data Exfiltration', description: 'Malicious insider copies data to removable media', likelihood: 'Low' }
        ];

        for (const evt of threatEvents) {
            await client.query(`
                INSERT INTO nist_80030_threat_events
                (client_id, threat_source_id, name, description, likelihood, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [clientId, evt.threat_source_id, evt.name, evt.description, evt.likelihood, 'active']);
        }
        console.log(`Created ${threatEvents.length} threat events`);

        // 5. Create Impact Assessments - using correct column names
        console.log('\n=== Creating 10 Impact Assessments ===');
        const impactAssessments = [
            { domain: 'financial', cia_type: 'Confidentiality', magnitude: 'High', description: 'Unauthorized disclosure of financial data could cause significant harm', likelihood: 'Medium' },
            { domain: 'financial', cia_type: 'Availability', magnitude: 'High', description: 'System downtime affects government operations and citizen services', likelihood: 'Low' },
            { domain: 'healthcare', cia_type: 'Confidentiality', magnitude: 'High', description: 'Breach of patient health records violates HIPAA and privacy laws', likelihood: 'Medium' },
            { domain: 'healthcare', cia_type: 'Integrity', magnitude: 'High', description: 'Modification of medical records could lead to patient harm', likelihood: 'Low' },
            { domain: 'grants', cia_type: 'Confidentiality', magnitude: 'Medium', description: 'Disclosure of grant applicant information could cause unfair advantage', likelihood: 'Medium' },
            { domain: 'personnel', cia_type: 'Confidentiality', magnitude: 'High', description: 'Compromise of clearance information endangers national security', likelihood: 'Low' },
            { domain: 'logistics', cia_type: 'Availability', magnitude: 'Medium', description: 'Supply chain disruption affects mission-critical operations', likelihood: 'Medium' },
            { domain: 'tax', cia_type: 'Integrity', magnitude: 'High', description: 'Tax record manipulation could result in financial fraud', likelihood: 'Low' },
            { domain: 'legal', cia_type: 'Confidentiality', magnitude: 'Medium', description: 'Attorney-client privileged information could be disclosed', likelihood: 'Medium' },
            { domain: 'public', cia_type: 'Availability', magnitude: 'Low', description: 'Public portal downtime reduces citizen trust', likelihood: 'High' }
        ];

        for (const imp of impactAssessments) {
            await client.query(`
                INSERT INTO nist_80030_impact_assessments
                (client_id, domain, cia_type, magnitude, description, likelihood, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [clientId, imp.domain, imp.cia_type, imp.magnitude, imp.description, imp.likelihood, 'active']);
        }
        console.log(`Created ${impactAssessments.length} impact assessments`);

        // 6. Create Evidence records - using correct column names
        console.log('\n=== Creating 10 Evidence Records ===');
        const evidenceRecords = [
            { description: 'Access Control Policy Document', type: 'policy', status: 'active' },
            { description: 'Risk Assessment Report FY2024', type: 'assessment', status: 'active' },
            { description: 'Contingency Plan Test Results', type: 'test', status: 'active' },
            { description: 'Incident Response Playbook', type: 'procedure', status: 'active' },
            { description: 'Security Awareness Training Records', type: 'training', status: 'active' },
            { description: 'Vulnerability Scan Report Q1', type: 'assessment', status: 'active' },
            { description: 'Penetration Test Report', type: 'assessment', status: 'active' },
            { description: 'System Security Plan', type: 'policy', status: 'active' },
            { description: 'POA&M Document FY2024', type: 'policy', status: 'active' },
            { description: 'Configuration Baseline Documentation', type: 'configuration', status: 'active' }
        ];

        for (const ev of evidenceRecords) {
            await client.query(`
                INSERT INTO evidence
                (client_id, description, type, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [clientId, ev.description, ev.type, ev.status]);
        }
        console.log(`Created ${evidenceRecords.length} evidence records`);

        // 7. Create Risk Scenarios - using correct column names
        console.log('\n=== Creating 10 Risk Scenarios ===');
        const riskScenarios = [
            { title: 'Ransomware Attack on Financial System', description: 'A ransomware attack could encrypt critical financial data', likelihood: 'Medium', impact: 'High', status: 'open' },
            { title: 'Data Breach of Patient Records', description: 'Unauthorized disclosure of patient health information', likelihood: 'Medium', impact: 'High', status: 'open' },
            { title: 'Insider Threat - Data Exfiltration', description: 'Malicious insider copying sensitive data', likelihood: 'Low', impact: 'High', status: 'open' },
            { title: 'Supply Chain Compromise', description: 'Compromise through vulnerable vendor software', likelihood: 'Low', impact: 'High', status: 'mitigated' },
            { title: 'DDoS Attack on Public Portal', description: 'Distributed denial of service making public services unavailable', likelihood: 'High', impact: 'Low', status: 'open' },
            { title: 'Phishing Attack on Executives', description: 'Targeted phishing emails to gain executive credentials', likelihood: 'High', impact: 'Medium', status: 'mitigated' },
            { title: 'Unpatched Vulnerability Exploitation', description: 'Exploitation of known but unpatched vulnerabilities', likelihood: 'Medium', impact: 'High', status: 'open' },
            { title: 'Physical Security Breach', description: 'Unauthorized physical access to data center', likelihood: 'Low', impact: 'Medium', status: 'mitigated' },
            { title: 'Unauthorized Access via Weak Password', description: 'Compromise through weak or default passwords', likelihood: 'High', impact: 'High', status: 'open' },
            { title: 'Natural Disaster Impact', description: 'Hurricane or earthquake affecting data center', likelihood: 'Low', impact: 'High', status: 'open' }
        ];

        for (const risk of riskScenarios) {
            await client.query(`
                INSERT INTO risk_scenarios
                (client_id, title, description, likelihood, impact, status, inherent_score, inherent_risk, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [clientId, risk.title, risk.description, risk.likelihood, risk.impact, risk.status,
                risk.likelihood === 'High' ? 3 : (risk.likelihood === 'Medium' ? 2 : 1),
                risk.impact === 'High' ? 3 : (risk.impact === 'Medium' ? 2 : 1)]);
        }
        console.log(`Created ${riskScenarios.length} risk scenarios`);

        // 8. Create Checklist States - using correct column names (items is JSON)
        console.log('\n=== Creating 10 Checklist States ===');
        const checklistItems = [
            { name: 'AC-1 Access Control Policy', status: 'Pass', finding: 'No findings' },
            { name: 'AC-2 Account Management', status: 'Fail', finding: 'Weak' },
            { name: 'AU-2 Audit Events', status: 'Pass', finding: 'No findings' },
            { name: 'IA-2 Identification and Authentication', status: 'Fail', finding: 'Medium' },
            { name: 'SC-8 Transmission Confidentiality', status: 'Pass', finding: 'No findings' },
            { name: 'SI-2 Flaw Remediation', status: 'Fail', finding: 'High' },
            { name: 'CP-2 Contingency Plan', status: 'Pass', finding: 'No findings' },
            { name: 'IR-4 Incident Handling', status: 'Fail', finding: 'Medium' },
            { name: 'RA-5 Vulnerability Scanning', status: 'Pass', finding: 'No findings' },
            { name: 'CA-2 Security Assessments', status: 'Fail', finding: 'Low' }
        ];

        for (const chk of checklistItems) {
            const itemsJson = JSON.stringify([{ name: chk.name, status: chk.status, finding: chk.finding }]);
            await client.query(`
                INSERT INTO checklist_states
                (client_id, items, updated_at)
                VALUES ($1, $2, NOW())
            `, [clientId, itemsJson]);
        }
        console.log(`Created ${checklistItems.length} checklist states`);

        console.log('\n=== Seed Complete ===');
        console.log(`Total: ${systemIds.length} FISMA systems, 10 POA&M plans, 30 POA&M items, 10 threat sources, 10 threat events, 10 impact assessments, 10 evidence records, 10 risk scenarios, 10 checklist states`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

seedNISTData();
