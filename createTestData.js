// Comprehensive test data creation for Client 3
// This script creates a complete dataset for testing report generation

const { drizzle } = require('drizzle-orm/postgres-js');
const { eq, and } = require('drizzle-orm');
const postgres = require('postgres');

// Import schema
const schema = require('./schema.ts');

async function createTestData() {
    console.log('🚀 Creating comprehensive test data for Client 3...');
    
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/compliance_os';
    const sql = postgres(connectionString);
    const db = drizzle(sql, { schema });

    try {
        // Check if Client 3 exists
        const client = await db.query.clients.findFirst({
            where: eq(schema.clients.id, 3)
        });

        if (!client) {
            console.error('❌ Client 3 not found. Please create Client 3 first.');
            return;
        }

        console.log(`✅ Found client: ${client.name} (ID: ${client.id})`);

        // 1. Create a comprehensive roadmap
        console.log('📋 Creating comprehensive roadmap...');
        const roadmapData = {
            clientId: 3,
            title: 'ISO 27001:2022 Compliance Roadmap',
            description: 'Complete implementation roadmap for ISO 27001:2022 certification including all Annex A controls.',
            vision: 'Achieve ISO 27001:2022 certification within 12 months while establishing a sustainable information security management system (ISMS) that protects critical assets and ensures regulatory compliance.',
            objectives: JSON.stringify([
                'Establish ISMS framework and governance',
                'Implement all Annex A controls',
                'Conduct risk assessment and treatment',
                'Develop security policies and procedures',
                'Train staff on security awareness',
                'Prepare for certification audit'
            ]),
            framework: 'ISO 27001:2022',
            status: 'active',
            startDate: new Date('2024-01-15'),
            targetDate: new Date('2024-12-31'),
            kpiTargets: JSON.stringify([
                { name: 'Control Implementation Rate', target: 100, unit: '%' },
                { name: 'Risk Treatment Completion', target: 95, unit: '%' },
                { name: 'Staff Training Completion', target: 100, unit: '%' },
                { name: 'Policy Approval Rate', target: 100, unit: '%' },
                { name: 'Incident Response Time', target: 24, unit: 'hours' }
            ]),
            createdById: 1 // Assuming user ID 1 exists
        };

        // Check if roadmap already exists
        const existingRoadmap = await db.query.roadmaps.findFirst({
            where: and(
                eq(schema.roadmaps.clientId, 3),
                eq(schema.roadmaps.title, roadmapData.title)
            )
        });

        let roadmapId;
        if (existingRoadmap) {
            roadmapId = existingRoadmap.id;
            console.log(`✅ Roadmap already exists with ID: ${roadmapId}`);
        } else {
            const [newRoadmap] = await db.insert(schema.roadmaps).values(roadmapData).returning();
            roadmapId = newRoadmap.id;
            console.log(`✅ Created roadmap with ID: ${roadmapId}`);
        }

        // 2. Create roadmap milestones
        console.log('📅 Creating roadmap milestones...');
        const milestones = [
            {
                roadmapId,
                title: 'ISMS Scope Definition',
                description: 'Define scope, boundaries, and applicability of the ISMS',
                targetDate: new Date('2024-02-15'),
                status: 'completed',
                priority: 'high'
            },
            {
                roadmapId,
                title: 'Risk Assessment Completion',
                description: 'Complete initial risk assessment and treatment plan',
                targetDate: new Date('2024-03-31'),
                status: 'in_progress',
                priority: 'high'
            },
            {
                roadmapId,
                title: 'Policy Framework Established',
                description: 'Develop and approve all required security policies',
                targetDate: new Date('2024-05-15'),
                status: 'planned',
                priority: 'medium'
            },
            {
                roadmapId,
                title: 'Control Implementation Phase 1',
                description: 'Implement high-priority controls (A.5-A.8)',
                targetDate: new Date('2024-07-31'),
                status: 'planned',
                priority: 'high'
            },
            {
                roadmapId,
                title: 'Internal Audit',
                description: 'Conduct internal ISMS audit',
                targetDate: new Date('2024-09-30'),
                status: 'planned',
                priority: 'medium'
            },
            {
                roadmapId,
                title: 'Certification Audit',
                description: 'External certification audit by accredited body',
                targetDate: new Date('2024-11-30'),
                status: 'planned',
                priority: 'high'
            }
        ];

        for (const milestone of milestones) {
            const existing = await db.query.roadmapMilestones.findFirst({
                where: and(
                    eq(schema.roadmapMilestones.roadmapId, milestone.roadmapId),
                    eq(schema.roadmapMilestones.title, milestone.title)
                )
            });

            if (!existing) {
                await db.insert(schema.roadmapMilestones).values(milestone);
                console.log(`✅ Created milestone: ${milestone.title}`);
            }
        }

        // 3. Create implementation plan
        console.log('📊 Creating implementation plan...');
        const implementationPlanData = {
            clientId: 3,
            roadmapId,
            title: 'ISO 27001 Implementation Plan',
            description: 'Detailed implementation plan covering all phases of ISO 27001 certification',
            status: 'in_progress',
            priority: 'high',
            plannedStartDate: new Date('2024-01-15'),
            plannedEndDate: new Date('2024-12-31'),
            budget: 75000,
            estimatedEffortHours: 1200
        };

        let implementationPlanId;
        const existingPlan = await db.query.implementationPlans.findFirst({
            where: and(
                eq(schema.implementationPlans.clientId, 3),
                eq(schema.implementationPlans.roadmapId, roadmapId)
            )
        });

        if (existingPlan) {
            implementationPlanId = existingPlan.id;
            console.log(`✅ Implementation plan already exists with ID: ${implementationPlanId}`);
        } else {
            const [newPlan] = await db.insert(schema.implementationPlans).values(implementationPlanData).returning();
            implementationPlanId = newPlan.id;
            console.log(`✅ Created implementation plan with ID: ${implementationPlanId}`);
        }

        // 4. Create implementation tasks
        console.log('✅ Creating implementation tasks...');
        const tasks = [
            {
                implementationPlanId,
                title: 'Define ISMS Scope',
                description: 'Document scope, boundaries, and applicability statement',
                status: 'completed',
                priority: 'high',
                assignedTo: 1,
                estimatedEffortHours: 40,
                estimatedCost: 5000,
                startDate: new Date('2024-01-15'),
                dueDate: new Date('2024-02-15')
            },
            {
                implementationPlanId,
                title: 'Conduct Risk Assessment',
                description: 'Identify assets, assess risks, and develop treatment plan',
                status: 'in_progress',
                priority: 'high',
                assignedTo: 1,
                estimatedEffortHours: 80,
                estimatedCost: 10000,
                startDate: new Date('2024-02-16'),
                dueDate: new Date('2024-03-31')
            },
            {
                implementationPlanId,
                title: 'Develop Security Policies',
                description: 'Create information security policy and supporting procedures',
                status: 'todo',
                priority: 'medium',
                assignedTo: 1,
                estimatedEffortHours: 120,
                estimatedCost: 15000,
                startDate: new Date('2024-04-01'),
                dueDate: new Date('2024-05-15')
            },
            {
                implementationPlanId,
                title: 'Implement Access Controls',
                description: 'Implement user access management and privilege controls',
                status: 'todo',
                priority: 'high',
                assignedTo: 1,
                estimatedEffortHours: 160,
                estimatedCost: 20000,
                startDate: new Date('2024-05-16'),
                dueDate: new Date('2024-07-31')
            },
            {
                implementationPlanId,
                title: 'Security Awareness Training',
                description: 'Develop and deliver security awareness program',
                status: 'todo',
                priority: 'medium',
                assignedTo: 1,
                estimatedEffortHours: 60,
                estimatedCost: 8000,
                startDate: new Date('2024-08-01'),
                dueDate: new Date('2024-09-15')
            }
        ];

        for (const task of tasks) {
            const existing = await db.query.implementationTasks.findFirst({
                where: and(
                    eq(schema.implementationTasks.implementationPlanId, task.implementationPlanId),
                    eq(schema.implementationTasks.title, task.title)
                )
            });

            if (!existing) {
                await db.insert(schema.implementationTasks).values(task);
                console.log(`✅ Created task: ${task.title}`);
            }
        }

        // 5. Create risks
        console.log('⚠️ Creating risk assessments...');
        const risks = [
            {
                clientId: 3,
                title: 'Unauthorized Access to Systems',
                description: 'Risk of unauthorized access to critical systems and data',
                inherentRisk: 'High',
                residualRisk: 'Medium',
                likelihood: 4,
                impact: 5,
                status: 'open',
                treatmentPlan: 'Implement multi-factor authentication and access reviews'
            },
            {
                clientId: 3,
                title: 'Data Breach',
                description: 'Risk of sensitive data exposure or theft',
                inherentRisk: 'Very High',
                residualRisk: 'High',
                likelihood: 3,
                impact: 5,
                status: 'open',
                treatmentPlan: 'Implement encryption, DLP, and incident response plan'
            },
            {
                clientId: 3,
                title: 'Malware Infection',
                description: 'Risk of malware compromising systems',
                inherentRisk: 'Medium',
                residualRisk: 'Low',
                likelihood: 4,
                impact: 3,
                status: 'mitigated',
                treatmentPlan: 'Implement endpoint protection and regular updates'
            },
            {
                clientId: 3,
                title: 'Insider Threat',
                description: 'Risk of malicious actions by employees',
                inherentRisk: 'Medium',
                residualRisk: 'Medium',
                likelihood: 2,
                impact: 4,
                status: 'open',
                treatmentPlan: 'Implement user monitoring and least privilege access'
            },
            {
                clientId: 3,
                title: 'Third-Party Risk',
                description: 'Risk from vendors and service providers',
                inherentRisk: 'High',
                residualRisk: 'Medium',
                likelihood: 3,
                impact: 4,
                status: 'open',
                treatmentPlan: 'Implement vendor risk management program'
            }
        ];

        for (const risk of risks) {
            const existing = await db.query.riskAssessments.findFirst({
                where: and(
                    eq(schema.riskAssessments.clientId, 3),
                    eq(schema.riskAssessments.title, risk.title)
                )
            });

            if (!existing) {
                await db.insert(schema.riskAssessments).values(risk);
                console.log(`✅ Created risk: ${risk.title}`);
            }
        }

        // 6. Create controls
        console.log('🛡️ Creating security controls...');
        const controls = [
            {
                clientId: 3,
                title: 'Access Control Policy',
                description: 'Formal policy for user access management',
                category: 'Access Control',
                status: 'implemented',
                implementationDate: new Date('2024-02-01'),
                effectiveness: 'High',
                framework: 'ISO 27001',
                controlId: 'A.9.1.1'
            },
            {
                clientId: 3,
                title: 'Multi-Factor Authentication',
                description: 'MFA implementation for all privileged accounts',
                category: 'Access Control',
                status: 'implemented',
                implementationDate: new Date('2024-02-15'),
                effectiveness: 'High',
                framework: 'ISO 27001',
                controlId: 'A.9.4.2'
            },
            {
                clientId: 3,
                title: 'Data Encryption',
                description: 'Encryption of sensitive data at rest and in transit',
                category: 'Cryptography',
                status: 'in_progress',
                implementationDate: null,
                effectiveness: 'Medium',
                framework: 'ISO 27001',
                controlId: 'A.10.1.1'
            },
            {
                clientId: 3,
                title: 'Incident Response Plan',
                description: 'Formal incident response procedures',
                category: 'Operations Security',
                status: 'planned',
                implementationDate: null,
                effectiveness: null,
                framework: 'ISO 27001',
                controlId: 'A.16.1.1'
            },
            {
                clientId: 3,
                title: 'Security Awareness Training',
                description: 'Regular security training for all staff',
                category: 'Human Resource Security',
                status: 'not_started',
                implementationDate: null,
                effectiveness: null,
                framework: 'ISO 27001',
                controlId: 'A.7.2.2'
            },
            {
                clientId: 3,
                title: 'Vendor Risk Assessment',
                description: 'Formal assessment of third-party risks',
                category: 'Supplier Relationships',
                status: 'in_progress',
                implementationDate: null,
                effectiveness: 'Medium',
                framework: 'ISO 27001',
                controlId: 'A.15.1.1'
            }
        ];

        for (const control of controls) {
            const existing = await db.query.controls.findFirst({
                where: and(
                    eq(schema.controls.clientId, 3),
                    eq(schema.controls.title, control.title)
                )
            });

            if (!existing) {
                await db.insert(schema.controls).values(control);
                console.log(`✅ Created control: ${control.title}`);
            }
        }

        // 7. Create policies
        console.log('📄 Creating security policies...');
        const policies = [
            {
                clientId: 3,
                title: 'Information Security Policy',
                description: 'Overall information security policy statement',
                category: 'Governance',
                status: 'approved',
                version: '1.0',
                effectiveDate: new Date('2024-02-01'),
                reviewDate: new Date('2025-02-01'),
                framework: 'ISO 27001'
            },
            {
                clientId: 3,
                title: 'Acceptable Use Policy',
                description: 'Rules for acceptable use of IT resources',
                category: 'Access Control',
                status: 'approved',
                version: '1.0',
                effectiveDate: new Date('2024-02-15'),
                reviewDate: new Date('2025-02-15'),
                framework: 'ISO 27001'
            },
            {
                clientId: 3,
                title: 'Data Classification Policy',
                description: 'Policy for classifying and handling data',
                category: 'Information Security',
                status: 'review',
                version: '0.9',
                effectiveDate: null,
                reviewDate: null,
                framework: 'ISO 27001'
            },
            {
                clientId: 3,
                title: 'Incident Response Policy',
                description: 'Procedures for handling security incidents',
                category: 'Operations Security',
                status: 'draft',
                version: '0.5',
                effectiveDate: null,
                reviewDate: null,
                framework: 'ISO 27001'
            },
            {
                clientId: 3,
                title: 'Remote Access Policy',
                description: 'Policy for secure remote access',
                category: 'Access Control',
                status: 'approved',
                version: '1.0',
                effectiveDate: new Date('2024-03-01'),
                reviewDate: new Date('2025-03-01'),
                framework: 'ISO 27001'
            }
        ];

        for (const policy of policies) {
            const existing = await db.query.clientPolicies.findFirst({
                where: and(
                    eq(schema.clientPolicies.clientId, 3),
                    eq(schema.clientPolicies.title, policy.title)
                )
            });

            if (!existing) {
                await db.insert(schema.clientPolicies).values(policy);
                console.log(`✅ Created policy: ${policy.title}`);
            }
        }

        console.log('\n🎉 Comprehensive test data creation complete!');
        console.log('===========================================');
        console.log('📊 Data Summary for Client 3:');
        console.log(`• Roadmap: ISO 27001:2022 Compliance Roadmap (ID: ${roadmapId})`);
        console.log('• Milestones: 6 strategic milestones');
        console.log(`• Implementation Plan: ISO 27001 Implementation Plan (ID: ${implementationPlanId})`);
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
    } finally {
        await sql.end();
    }
}

// Run the script
createTestData();