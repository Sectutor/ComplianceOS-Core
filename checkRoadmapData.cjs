// Check roadmap data for Client 3
const postgres = require('postgres');

async function checkRoadmapData() {
    console.log('🔍 Checking roadmap data for Client 3...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // 1. Check all roadmaps for Client 3
        console.log('\n📋 Roadmaps for Client 3:');
        const roadmaps = await sql`SELECT id, title, status, start_date, target_date FROM roadmaps WHERE client_id = 3`;
        
        if (roadmaps.length === 0) {
            console.log('❌ No roadmaps found for Client 3');
        } else {
            roadmaps.forEach(roadmap => {
                console.log(`✅ ID: ${roadmap.id}, Title: "${roadmap.title}", Status: ${roadmap.status}, Dates: ${roadmap.start_date} to ${roadmap.target_date}`);
            });
        }

        // 2. Check roadmap with ID 5 specifically
        console.log('\n🔍 Checking roadmap ID 5:');
        const roadmap5 = await sql`SELECT * FROM roadmaps WHERE id = 5`;
        
        if (roadmap5.length === 0) {
            console.log('❌ Roadmap ID 5 not found');
        } else {
            const roadmap = roadmap5[0];
            console.log(`✅ Found roadmap ID 5:`);
            console.log(`   Title: "${roadmap.title}"`);
            console.log(`   Client ID: ${roadmap.client_id}`);
            console.log(`   Status: ${roadmap.status}`);
            console.log(`   Framework: ${roadmap.framework}`);
            console.log(`   Dates: ${roadmap.start_date} to ${roadmap.target_date}`);
            console.log(`   Created: ${roadmap.created_at}`);
            
            // Show objectives
            if (roadmap.objectives) {
                console.log(`   Objectives: ${JSON.stringify(roadmap.objectives)}`);
            }
        }

        // 3. Check roadmap milestones for roadmap ID 5
        console.log('\n📅 Milestones for roadmap ID 5:');
        const milestones = await sql`SELECT id, title, status, target_date, priority FROM roadmap_milestones WHERE roadmap_id = 5`;
        
        if (milestones.length === 0) {
            console.log('❌ No milestones found for roadmap ID 5');
        } else {
            console.log(`✅ Found ${milestones.length} milestones:`);
            milestones.forEach(milestone => {
                console.log(`   • ${milestone.title} (Status: ${milestone.status}, Date: ${milestone.target_date}, Priority: ${milestone.priority})`);
            });
        }

        // 4. Check implementation plans for roadmap ID 5
        console.log('\n📊 Implementation plans for roadmap ID 5:');
        const plans = await sql`SELECT id, title, status, priority, planned_start_date, planned_end_date FROM implementation_plans WHERE roadmap_id = 5`;
        
        if (plans.length === 0) {
            console.log('❌ No implementation plans found for roadmap ID 5');
        } else {
            plans.forEach(plan => {
                console.log(`✅ Plan ID: ${plan.id}, Title: "${plan.title}", Status: ${plan.status}, Priority: ${plan.priority}`);
                console.log(`   Dates: ${plan.planned_start_date} to ${plan.planned_end_date}`);
            });
        }

        // 5. Check implementation tasks for plan ID 16
        console.log('\n✅ Implementation tasks for plan ID 16:');
        const tasks = await sql`SELECT id, title, status, priority FROM implementation_tasks WHERE implementation_plan_id = 16`;
        
        if (tasks.length === 0) {
            console.log('❌ No tasks found for plan ID 16');
        } else {
            console.log(`✅ Found ${tasks.length} tasks:`);
            tasks.forEach(task => {
                console.log(`   • ${task.title} (Status: ${task.status}, Priority: ${task.priority})`);
            });
        }

        // 6. Check what other data exists for Client 3
        console.log('\n📊 Other data for Client 3:');
        
        // Check risk assessments
        const risks = await sql`SELECT COUNT(*) as count FROM risk_assessments WHERE client_id = 3`;
        console.log(`   Risk Assessments: ${risks[0].count}`);
        
        // Check controls
        const controls = await sql`SELECT COUNT(*) as count FROM controls WHERE client_id = 3`;
        console.log(`   Controls: ${controls[0].count}`);
        
        // Check policies
        const policies = await sql`SELECT COUNT(*) as count FROM client_policies WHERE client_id = 3`;
        console.log(`   Policies: ${policies[0].count}`);

    } catch (error) {
        console.error('❌ Error checking data:', error.message);
    } finally {
        await sql.end();
    }
}

// Run the script
checkRoadmapData();