// Simple direct test data creation for Client 3
// This script creates a complete dataset for testing report generation

const postgres = require('postgres');

async function createTestData() {
    console.log('🚀 Creating comprehensive test data for Client 3...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // Check if Client 3 exists
        const client = await sql`SELECT * FROM clients WHERE id = 3`;
        
        if (client.length === 0) {
            console.error('❌ Client 3 not found. Please create Client 3 first.');
            return;
        }

        console.log(`✅ Found client: ${client[0].name} (ID: ${client[0].id})`);

        // 1. Create a comprehensive roadmap
        console.log('📋 Creating comprehensive roadmap...');
        let roadmapId;
        
        // Check if roadmap already exists
        const existingRoadmap = await sql`SELECT id FROM roadmaps WHERE client_id = 3 AND title = 'ISO 27001:2022 Compliance Roadmap'`;
        
        if (existingRoadmap.length > 0) {
            roadmapId = existingRoadmap[0].id;
            console.log(`✅ Roadmap already exists with ID: ${roadmapId}`);
        } else {
            const roadmapResult = await sql`
                INSERT INTO roadmaps (
                    client_id, title, description, vision, objectives, framework, 
                    status, start_date, target_date, kpi_targets, created_by_id
                ) VALUES (
                    3, 
                    'ISO 27001:2022 Compliance Roadmap',
                    'Complete implementation roadmap for ISO 27001:2022 certification including all Annex A controls.',
                    'Achieve ISO 27001:2022 certification within 12 months while establishing a sustainable information security management system (ISMS) that protects critical assets and ensures regulatory compliance.',
                    '["Establish ISMS framework and governance","Implement all Annex A controls","Conduct risk assessment and treatment","Develop security policies and procedures","Train staff on security awareness","Prepare for certification audit"]',
                    'ISO 27001:2022',
                    'active',
                    '2024-01-15',
                    '2024-12-31',
                    '[{"name":"Control Implementation Rate","target":100,"unit":"%"},{"name":"Risk Treatment Completion","target":95,"unit":"%"},{"name":"Staff Training Completion","target":100,"unit":"%"},{"name":"Policy Approval Rate","target":100,"unit":"%"},{"name":"Incident Response Time","target":24,"unit":"hours"}]',
                    1
                ) RETURNING id
            `;
            
            roadmapId = roadmapResult[0].id;
            console.log(`✅ Created roadmap with ID: ${roadmapId}`);
        }

        // 2. Create roadmap milestones
        console.log('📅 Creating roadmap milestones...');
        const milestones = [
            [roadmapId, 'ISMS Scope Definition', 'Define scope, boundaries, and applicability of the ISMS', '2024-02-15', 'completed', 'high'],
            [roadmapId, 'Risk Assessment Completion', 'Complete initial risk assessment and treatment plan', '2024-03-31', 'in_progress', 'high'],
            [roadmapId, 'Policy Framework Established', 'Develop and approve all required security policies', '2024-05-15', 'planned', 'medium'],
            [roadmapId, 'Control Implementation Phase 1', 'Implement high-priority controls (A.5-A.8)', '2024-07-31', 'planned', 'high'],
            [roadmapId, 'Internal Audit', 'Conduct internal ISMS audit', '2024-09-30', 'planned', 'medium'],
            [roadmapId, 'Certification Audit', 'External certification audit by accredited body', '2024-11-30', 'planned', 'high']
        ];

        for (const [rId, title, desc, date, status, priority] of milestones) {
            const existing = await sql`SELECT id FROM roadmap_milestones WHERE roadmap_id = ${rId} AND title = ${title}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO roadmap_milestones (roadmap_id, title, description, target_date, status, priority)
                    VALUES (${rId}, ${title}, ${desc}, ${date}, ${status}, ${priority})
                `;
                console.log(`✅ Created milestone: ${title}`);
            } else {
                console.log(`✅ Milestone already exists: ${title}`);
            }
        }

        // 3. Create implementation plan
        console.log('📊 Creating implementation plan...');
        let planId;
        
        const existingPlan = await sql`SELECT id FROM implementation_plans WHERE client_id = 3 AND roadmap_id = ${roadmapId}`;
        
        if (existingPlan.length > 0) {
            planId = existingPlan[0].id;
            console.log(`✅ Implementation plan already exists with ID: ${planId}`);
        } else {
            const planResult = await sql`
                INSERT INTO implementation_plans (
                    client_id, roadmap_id, title, description, status, priority,
                    planned_start_date, planned_end_date, created_by_id
                ) VALUES (
                    3, ${roadmapId}, 'ISO 27001 Implementation Plan',
                    'Detailed implementation plan covering all phases of ISO 27001 certification',
                    'in_progress', 'high', '2024-01-15', '2024-12-31', 1
                ) RETURNING id
            `;
            
            planId = planResult[0].id;
            console.log(`✅ Created implementation plan with ID: ${planId}`);
        }

        // 4. Create implementation tasks
        console.log('✅ Creating implementation tasks...');
        const tasks = [
            [planId, 'Define ISMS Scope', 'Document scope, boundaries, and applicability statement', 'done', 'high'],
            [planId, 'Conduct Risk Assessment', 'Identify assets, assess risks, and develop treatment plan', 'in_progress', 'high'],
            [planId, 'Develop Security Policies', 'Create information security policy and supporting procedures', 'todo', 'medium'],
            [planId, 'Implement Access Controls', 'Implement user access management and privilege controls', 'todo', 'high'],
            [planId, 'Security Awareness Training', 'Develop and deliver security awareness program', 'todo', 'medium']
        ];

        for (const [pId, title, desc, status, priority, assigned, effort, cost, start, due] of tasks) {
            const existing = await sql`SELECT id FROM implementation_tasks WHERE implementation_plan_id = ${pId} AND title = ${title}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO implementation_tasks (
                        implementation_plan_id, title, description, status, priority, created_by_id
                    ) VALUES (${pId}, ${title}, ${desc}, ${status}, ${priority}, 1)
                `;
                console.log(`✅ Created task: ${title}`);
            } else {
                console.log(`✅ Task already exists: ${title}`);
            }
        }

        // 5. Create risks
        console.log('⚠️ Creating risk assessments...');
        const risks = [
            [3, 'Unauthorized Access to Systems', 'Risk of unauthorized access to critical systems and data', 'High', 'Medium', 4, 5, 'open', 'Implement multi-factor authentication and access reviews'],
            [3, 'Data Breach', 'Risk of sensitive data exposure or theft', 'Very High', 'High', 3, 5, 'open', 'Implement encryption, DLP, and incident response plan'],
            [3, 'Malware Infection', 'Risk of malware compromising systems', 'Medium', 'Low', 4, 3, 'mitigated', 'Implement endpoint protection and regular updates'],
            [3, 'Insider Threat', 'Risk of malicious actions by employees', 'Medium', 'Medium', 2, 4, 'open', 'Implement user monitoring and least privilege access'],
            [3, 'Third-Party Risk', 'Risk from vendors and service providers', 'High', 'Medium', 3, 4, 'open', 'Implement vendor risk management program']
        ];

        for (const [clientId, title, desc, inherent, residual, likelihood, impact, status, treatment] of risks) {
            const existing = await sql`SELECT id FROM risk_assessments WHERE client_id = ${clientId} AND title = ${title}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO risk_assessments (
                        client_id, title, inherent_risk, residual_risk,
                        likelihood, impact, status, treatment_plan
                    ) VALUES (${clientId}, ${title}, ${inherent}, ${residual}, ${likelihood},impact ${}, ${status}, ${treatment})
                `;
                console.log(`✅ Created risk: ${title}`);
            } else {
                console.log(`✅ Risk already exists: ${title}`);
            }
        }

        // 6. Create controls
        console.log('🛡️ Creating security controls...');
        const controls = [
            [3, 'Access Control Policy', 'Formal policy for user access management', 'Access Control', 'implemented', '2024-02-01', 'High', 'ISO 27001', 'A.9.1.1'],
            [3, 'Multi-Factor Authentication', 'MFA implementation for all privileged accounts', 'Access Control', 'implemented', '2024-02-15', 'High', 'ISO 27001', 'A.9.4.2'],
            [3, 'Data Encryption', 'Encryption of sensitive data at rest and in transit', 'Cryptography', 'in_progress', null, 'Medium', 'ISO 27001', 'A.10.1.1'],
            [3, 'Incident Response Plan', 'Formal incident response procedures', 'Operations Security', 'planned', null, null, 'ISO 27001', 'A.16.1.1'],
            [3, 'Security Awareness Training', 'Regular security training for all staff', 'Human Resource Security', 'not_started', null, null, 'ISO 27001', 'A.7.2.2'],
            [3, 'Vendor Risk Assessment', 'Formal assessment of third-party risks', 'Supplier Relationships', 'in_progress', null, 'Medium', 'ISO 27001', 'A.15.1.1']
        ];

        for (const [clientId, title, desc, category, status, implDate, effectiveness, framework, controlId] of controls) {
            const existing = await sql`SELECT id FROM controls WHERE client_id = ${clientId} AND title = ${title}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO controls (
                        client_id, title, description, category, status,
                        implementation_date, effectiveness, framework, control_id
                    ) VALUES (${clientId}, ${title}, ${desc}, ${category}, ${status}, ${implDate}, ${effectiveness}, ${framework}, ${controlId})
                `;
                console.log(`✅ Created control: ${title}`);
            } else {
                console.log(`✅ Control already exists: ${title}`);
            }
        }

        // 7. Create policies
        console.log('📄 Creating security policies...');
        const policies = [
            [3, 'Information Security Policy', 'Overall information security policy statement', 'Governance', 'approved', '1.0', '2024-02-01', '2025-02-01', 'ISO 27001'],
            [3, 'Acceptable Use Policy', 'Rules for acceptable use of IT resources', 'Access Control', 'approved', '1.0', '2024-02-15', '2025-02-15', 'ISO 27001'],
            [3, 'Data Classification Policy', 'Policy for classifying and handling data', 'Information Security', 'review', '0.9', null, null, 'ISO 27001'],
            [3, 'Incident Response Policy', 'Procedures for handling security incidents', 'Operations Security', 'draft', '0.5', null, null, 'ISO 27001'],
            [3, 'Remote Access Policy', 'Policy for secure remote access', 'Access Control', 'approved', '1.0', '2024-03-01', '2025-03-01', 'ISO 27001']
        ];

        for (const [clientId, title, desc, category, status, version, effective, review, framework] of policies) {
            const existing = await sql`SELECT id FROM client_policies WHERE client_id = ${clientId} AND title = ${title}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO client_policies (
                        client_id, title, description, category, status,
                        version, effective_date, review_date, framework
                    ) VALUES (${clientId}, ${title}, ${desc}, ${category}, ${status}, ${version}, ${effective}, ${review}, ${framework})
                `;
                console.log(`✅ Created policy: ${title}`);
            } else {
                console.log(`✅ Policy already exists: ${title}`);
            }
        }

        console.log('\n🎉 Comprehensive test data creation complete!');
        console.log('===========================================');
        console.log('📊 Data Summary for Client 3:');
        console.log(`• Roadmap: ISO 27001:2022 Compliance Roadmap (ID: ${roadmapId})`);
        console.log('• Milestones: 6 strategic milestones');
        console.log(`• Implementation Plan: ISO 27001 Implementation Plan (ID: ${planId})`);
        console.log('• Tasks: 5 implementation tasks with effort/cost estimates');
        console.log('• Risks: 5 risk assessments with treatment plans');
        console.log('• Controls: 6 security controls with implementation status');
        console.log('• Policies: 5 security policies with approval status');
        console.log('\n🚀 Now test report generation with:');
        console.log('1. ALL data sources selected');
        console.log('2. Roadmap ID:', roadmapId);
        console.log('3. All report sections selected');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
    } finally {
        await sql.end();
    }
}

// Run the script
createTestData();