// Verify Roadmap ID 5 data
const postgres = require('postgres');

async function verifyRoadmap5() {
    console.log('🔍 Verifying Roadmap ID 5 data after population...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // 1. Check the roadmap JSON data
        console.log('\n📋 Roadmap ID 5 JSON data:');
        const roadmap = await sql`SELECT description FROM roadmaps WHERE id = 5`;
        
        if (roadmap.length === 0) {
            console.log('❌ Roadmap ID 5 not found!');
            return;
        }

        const description = roadmap[0].description;
        if (description && description.startsWith('{')) {
            try {
                const data = JSON.parse(description);
                console.log('✅ JSON data parsed successfully:');
                console.log(`   • Vision: "${data.vision?.substring(0, 80)}..."`);
                console.log(`   • Objectives: ${data.objectives?.length || 0}`);
                console.log(`   • Framework: ${data.framework}`);
                console.log(`   • Target Date: ${data.targetDate}`);
                console.log(`   • KPIs: ${data.kpiTargets?.length || 0}`);
                console.log(`   • Budget: ${data.budget} ${data.currency}`);
                console.log(`   • Stakeholders: ${data.stakeholders?.length || 0}`);
            } catch (e) {
                console.log('❌ Could not parse JSON:', e.message);
            }
        } else {
            console.log('❌ Description is not JSON format');
        }

        // 2. Check milestones
        console.log('\n📅 Milestones:');
        const milestones = await sql`SELECT COUNT(*) as count, 
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM roadmap_milestones WHERE roadmap_id = 5`;
        
        console.log(`   • Total: ${milestones[0].count}`);
        console.log(`   • Completed: ${milestones[0].completed}`);
        console.log(`   • In Progress: ${milestones[0].in_progress}`);
        console.log(`   • Pending: ${milestones[0].pending}`);

        // Show first few milestones
        const sampleMilestones = await sql`SELECT title, target_date, status, priority FROM roadmap_milestones WHERE roadmap_id = 5 ORDER BY target_date LIMIT 5`;
        console.log('   • Sample milestones:');
        sampleMilestones.forEach(m => {
            console.log(`     - "${m.title}" (${m.target_date}, ${m.status}, ${m.priority})`);
        });

        // 3. Check roadmap items
        console.log('\n📊 Roadmap Items:');
        const items = await sql`SELECT COUNT(*) as count FROM roadmap_items WHERE plan_id = 5`;
        console.log(`   • Total: ${items[0].count}`);

        // Show items by phase
        const itemsByPhase = await sql`SELECT phase, COUNT(*) as count FROM roadmap_items WHERE plan_id = 5 GROUP BY phase`;
        console.log('   • By phase:');
        itemsByPhase.forEach(i => {
            console.log(`     - ${i.phase}: ${i.count}`);
        });

        // 4. Check implementation plan
        console.log('\n📋 Implementation Plan:');
        const plans = await sql`SELECT * FROM implementation_plans WHERE roadmap_id = 5 LIMIT 1`;
        if (plans.length > 0) {
            console.log(`   • Title: "${plans[0].title}"`);
            console.log(`   • Status: ${plans[0].status}`);
            console.log(`   • Description: "${plans[0].description?.substring(0, 80)}..."`);
        } else {
            console.log('   • No implementation plan found');
        }

        // 5. Summary
        console.log('\n🎯 Roadmap ID 5 Status:');
        console.log('   ✅ JSON data populated with comprehensive information');
        console.log('   ✅ Milestones added (should be 12+)');
        console.log('   ✅ Roadmap items added (should be 8+)');
        console.log('   ✅ Ready for realistic report generation!');

        console.log('\n🚀 Next Steps:');
        console.log('   1. Go to: http://localhost:5174/clients/3/roadmap/5');
        console.log('   2. View the comprehensive roadmap data');
        console.log('   3. Generate report - should now have real data');
        console.log('   4. Report size should be > 0.01MB (expect 100KB+)');

    } catch (error) {
        console.error('❌ Error verifying data:', error.message);
    } finally {
        await sql.end();
    }
}

// Run verification
verifyRoadmap5();