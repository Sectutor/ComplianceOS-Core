const { Client } = require('pg');

async function seedRemaining() {
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

        // 1. Create Impact Assessments
        console.log('=== Creating 10 Impact Assessments ===');
        const impacts = [
            { domain: 'financial', cia_type: 'Confidentiality', magnitude: 'High', description: 'Unauthorized disclosure of financial data could cause significant harm' },
            { domain: 'financial', cia_type: 'Availability', magnitude: 'High', description: 'System downtime affects government operations' },
            { domain: 'healthcare', cia_type: 'Confidentiality', magnitude: 'High', description: 'Breach of patient health records violates HIPAA' },
            { domain: 'healthcare', cia_type: 'Integrity', magnitude: 'High', description: 'Modification of medical records could harm patients' },
            { domain: 'grants', cia_type: 'Confidentiality', magnitude: 'Medium', description: 'Disclosure of grant applicant information' },
            { domain: 'personnel', cia_type: 'Confidentiality', magnitude: 'High', description: 'Compromise of clearance information' },
            { domain: 'logistics', cia_type: 'Availability', magnitude: 'Medium', description: 'Supply chain disruption' },
            { domain: 'tax', cia_type: 'Integrity', magnitude: 'High', description: 'Tax record manipulation fraud' },
            { domain: 'legal', cia_type: 'Confidentiality', magnitude: 'Medium', description: 'Attorney-client privilege disclosure' },
            { domain: 'public', cia_type: 'Availability', magnitude: 'Low', description: 'Public portal downtime' }
        ];

        for (const imp of impacts) {
            await client.query(`
                INSERT INTO nist_80030_impact_assessments
                (client_id, domain, cia_type, magnitude, description, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [clientId, imp.domain, imp.cia_type, imp.magnitude, imp.description, 'active']);
        }
        console.log(`Created ${impacts.length} impact assessments`);

        // 2. Create Risk Scenarios (likelihood and impact are integers)
        console.log('\n=== Creating 10 Risk Scenarios ===');
        const risks = [
            { title: 'Ransomware Attack on Financial System', description: 'Ransomware could encrypt critical data', likelihood: 2, impact: 3, status: 'open' },
            { title: 'Data Breach of Patient Records', description: 'Unauthorized disclosure of patient info', likelihood: 2, impact: 3, status: 'open' },
            { title: 'Insider Threat - Data Exfiltration', description: 'Malicious insider copying sensitive data', likelihood: 1, impact: 3, status: 'open' },
            { title: 'Supply Chain Compromise', description: 'Compromise through vendor software', likelihood: 1, impact: 3, status: 'mitigated' },
            { title: 'DDoS Attack on Public Portal', description: 'DDoS making services unavailable', likelihood: 3, impact: 1, status: 'open' },
            { title: 'Phishing Attack on Executives', description: 'Phishing to gain executive credentials', likelihood: 3, impact: 2, status: 'mitigated' },
            { title: 'Unpatched Vulnerability', description: 'Exploitation of unpatched vulnerabilities', likelihood: 2, impact: 3, status: 'open' },
            { title: 'Physical Security Breach', description: 'Unauthorized physical access', likelihood: 1, impact: 2, status: 'mitigated' },
            { title: 'Weak Password Access', description: 'Compromise through weak passwords', likelihood: 3, impact: 3, status: 'open' },
            { title: 'Natural Disaster Impact', description: 'Hurricane or earthquake affecting systems', likelihood: 1, impact: 3, status: 'open' }
        ];

        for (const risk of risks) {
            await client.query(`
                INSERT INTO risk_scenarios
                (client_id, title, description, likelihood, impact, status, inherent_score, inherent_risk, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [clientId, risk.title, risk.description, risk.likelihood, risk.impact, risk.status, risk.likelihood, risk.impact]);
        }
        console.log(`Created ${risks.length} risk scenarios`);

        // 3. Create Checklist States (items is JSON)
        console.log('\n=== Creating 10 Checklist States ===');
        const checklists = [
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

        for (const chk of checklists) {
            const itemsJson = JSON.stringify([{ name: chk.name, status: chk.status, finding: chk.finding }]);
            await client.query(`
                INSERT INTO checklist_states
                (client_id, items, updated_at)
                VALUES ($1, $2, NOW())
            `, [clientId, itemsJson]);
        }
        console.log(`Created ${checklists.length} checklist states`);

        console.log('\n=== Seed Complete ===');
        console.log('10 Impact assessments, 10 Risk scenarios, 10 Checklist states');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

seedRemaining();
