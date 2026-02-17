// Populate Roadmap ID 5 with comprehensive, realistic data
const postgres = require('postgres');

async function populateRoadmap5() {
    console.log('🚀 Populating Roadmap ID 5 with realistic data...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // 1. First, update the roadmap with comprehensive JSON data
        console.log('\n📝 Updating roadmap with comprehensive data...');
        
        const comprehensiveData = {
            vision: "Achieve ISO 27001:2022 certification by Q3 2026 while establishing a sustainable information security management system (ISMS) that protects our digital assets and builds customer trust.",
            objectives: [
                "Implement all 93 Annex A controls of ISO 27001:2022",
                "Establish a formal ISMS with documented policies and procedures",
                "Achieve 95% employee security awareness training completion",
                "Reduce security incidents by 80% year-over-year",
                "Pass external certification audit with zero major non-conformities"
            ],
            framework: "ISO 27001:2022",
            targetDate: "2026-09-30",
            kpiTargets: [
                { name: "Control Implementation", target: 100, unit: "%" },
                { name: "Employee Training", target: 95, unit: "%" },
                { name: "Security Incidents", target: 20, unit: "reduction %" },
                { name: "Audit Score", target: 95, unit: "%" },
                { name: "Policy Compliance", target: 90, unit: "%" }
            ],
            scope: "All information assets, systems, and personnel within the European operations division",
            budget: 250000,
            currency: "EUR",
            stakeholders: [
                "CISO - John Smith",
                "Head of IT - Maria Rodriguez",
                "Legal Counsel - David Chen",
                "Data Protection Officer - Sarah Johnson",
                "Board of Directors"
            ],
            assumptions: [
                "Management commitment remains consistent throughout the project",
                "Budget approval is secured for all phases",
                "Key personnel remain available for the duration",
                "No major organizational changes disrupt the timeline"
            ],
            constraints: [
                "Must comply with GDPR requirements",
                "Limited to European operations initially",
                "Budget capped at €250,000",
                "Must complete before Q4 2026 for annual reporting"
            ]
        };

        // Update the roadmap with comprehensive JSON data
        await sql`
            UPDATE roadmaps 
            SET 
                description = ${JSON.stringify(comprehensiveData)},
                updated_at = NOW()
            WHERE id = 5
        `;
        console.log('✅ Updated roadmap with comprehensive JSON data');

        // 2. Add more milestones (we already have 6, let's add more)
        console.log('\n📅 Adding comprehensive milestones...');
        
        const milestones = [
            {
                title: "ISMS Scope Definition",
                description: "Define the scope of the Information Security Management System including boundaries and applicability",
                target_date: "2026-02-15",
                is_gate: true,
                priority: "high",
                status: "completed"
            },
            {
                title: "Risk Assessment Completion",
                description: "Complete comprehensive risk assessment for all in-scope assets and processes",
                target_date: "2026-03-31",
                is_gate: true,
                priority: "critical",
                status: "in_progress"
            },
            {
                title: "Policy Framework Established",
                description: "Develop and approve all required security policies and procedures",
                target_date: "2026-04-30",
                is_gate: false,
                priority: "high",
                status: "pending"
            },
            {
                title: "Control Implementation Phase 1",
                description: "Implement physical and environmental security controls (A.7, A.8)",
                target_date: "2026-05-31",
                is_gate: false,
                priority: "medium",
                status: "pending"
            },
            {
                title: "Control Implementation Phase 2",
                description: "Implement access control and cryptography controls (A.9, A.10)",
                target_date: "2026-06-30",
                is_gate: false,
                priority: "medium",
                status: "pending"
            },
            {
                title: "Internal Audit",
                description: "Conduct first internal audit of the ISMS",
                target_date: "2026-07-15",
                is_gate: true,
                priority: "high",
                status: "pending"
            },
            {
                title: "Management Review",
                description: "First management review of ISMS performance and effectiveness",
                target_date: "2026-07-31",
                is_gate: true,
                priority: "critical",
                status: "pending"
            },
            {
                title: "Remediation Period",
                description: "Address findings from internal audit and management review",
                target_date: "2026-08-15",
                is_gate: false,
                priority: "high",
                status: "pending"
            },
            {
                title: "Stage 1 Certification Audit",
                description: "External auditor reviews documentation and readiness",
                target_date: "2026-08-31",
                is_gate: true,
                priority: "critical",
                status: "pending"
            },
            {
                title: "Stage 2 Certification Audit",
                description: "External auditor assesses implementation effectiveness",
                target_date: "2026-09-15",
                is_gate: true,
                priority: "critical",
                status: "pending"
            },
            {
                title: "Certification Awarded",
                description: "Receive ISO 27001:2022 certification",
                target_date: "2026-09-30",
                is_gate: true,
                priority: "critical",
                status: "pending"
            },
            {
                title: "Continuous Improvement",
                description: "Establish ongoing monitoring and improvement processes",
                target_date: "2026-12-31",
                is_gate: false,
                priority: "medium",
                status: "pending"
            }
        ];

        // Add milestones (skip if they already exist)
        for (const milestone of milestones) {
            await sql`
                INSERT INTO roadmap_milestones 
                (roadmap_id, title, description, target_date, is_gate, priority, status, created_at, updated_at)
                VALUES 
                (5, ${milestone.title}, ${milestone.description}, ${milestone.target_date}, ${milestone.is_gate}, ${milestone.priority}, ${milestone.status}, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `;
        }
        console.log(`✅ Added ${milestones.length} comprehensive milestones`);

        // 3. Update implementation plan with more details
        console.log('\n📋 Enhancing implementation plan...');
        
        // Check if implementation plan exists
        const existingPlan = await sql`SELECT id FROM implementation_plans WHERE roadmap_id = 5 LIMIT 1`;
        
        if (existingPlan.length > 0) {
            const planId = existingPlan[0].id;
            
            // Update the plan with more details
            await sql`
                UPDATE implementation_plans 
                SET 
                    description = 'Comprehensive implementation plan covering all phases of ISO 27001:2022 certification including risk assessment, control implementation, documentation, training, and audit preparation.',
                    status = 'active',
                    priority = 'high',
                    start_date = '2026-01-15',
                    end_date = '2026-09-30',
                    budget = 250000,
                    updated_at = NOW()
                WHERE id = ${planId}
            `;
            console.log('✅ Updated implementation plan with comprehensive details');
        }

        // 4. Add more roadmap items
        console.log('\n📊 Adding detailed roadmap items...');
        
        const roadmapItems = [
            {
                title: "Information Security Policy",
                description: "Develop and approve the overarching information security policy",
                phase: "documentation",
                order: 1,
                status: "completed",
                assigned_to: "CISO Office",
                due_date: "2026-02-28"
            },
            {
                title: "Risk Assessment Methodology",
                description: "Define and document the risk assessment methodology",
                phase: "documentation",
                order: 2,
                status: "in_progress",
                assigned_to: "Risk Management Team",
                due_date: "2026-03-15"
            },
            {
                title: "Asset Inventory",
                description: "Create comprehensive inventory of all information assets",
                phase: "assessment",
                order: 1,
                status: "in_progress",
                assigned_to: "IT Department",
                due_date: "2026-03-31"
            },
            {
                title: "Access Control Policy",
                description: "Develop access control policies and procedures",
                phase: "documentation",
                order: 3,
                status: "pending",
                assigned_to: "IT Security",
                due_date: "2026-04-15"
            },
            {
                title: "Incident Response Plan",
                description: "Create and test incident response procedures",
                phase: "documentation",
                order: 4,
                status: "pending",
                assigned_to: "Security Operations",
                due_date: "2026-04-30"
            },
            {
                title: "Employee Security Training",
                description: "Develop and deliver security awareness training",
                phase: "implementation",
                order: 1,
                status: "pending",
                assigned_to: "HR & Training",
                due_date: "2026-05-31"
            },
            {
                title: "Physical Security Controls",
                description: "Implement physical access controls and monitoring",
                phase: "implementation",
                order: 2,
                status: "pending",
                assigned_to: "Facilities Management",
                due_date: "2026-06-15"
            },
            {
                title: "Technical Security Controls",
                description: "Implement network security and endpoint protection",
                phase: "implementation",
                order: 3,
                status: "pending",
                assigned_to: "IT Security",
                due_date: "2026-06-30"
            }
        ];

        // Add roadmap items
        for (const item of roadmapItems) {
            await sql`
                INSERT INTO roadmap_items 
                (plan_id, title, description, phase, "order", status, assigned_to, due_date, created_at, updated_at)
                VALUES 
                (5, ${item.title}, ${item.description}, ${item.phase}, ${item.order}, ${item.status}, ${item.assigned_to}, ${item.due_date}, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `;
        }
        console.log(`✅ Added ${roadmapItems.length} detailed roadmap items`);

        // 5. Summary
        console.log('\n🎉 Roadmap ID 5 Population Complete!');
        console.log('📊 What was added/updated:');
        console.log('   • Comprehensive JSON data with vision, objectives, KPIs');
        console.log('   • 12 detailed milestones with realistic dates');
        console.log('   • Enhanced implementation plan with budget and timeline');
        console.log('   • 8 detailed roadmap items across phases');
        console.log('\n🚀 Roadmap ID 5 is now a realistic, comprehensive ISO 27001:2022 compliance roadmap!');

    } catch (error) {
        console.error('❌ Error populating data:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sql.end();
    }
}

// Run the population
populateRoadmap5();