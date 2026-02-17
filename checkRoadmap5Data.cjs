// Check what's in Roadmap ID 5
const postgres = require('postgres');

async function checkRoadmap5Data() {
    console.log('🔍 Checking Roadmap ID 5 data...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // 1. Check the roadmap itself
        console.log('\n📋 Roadmap ID 5 basic info:');
        const roadmap = await sql`SELECT * FROM roadmaps WHERE id = 5`;
        
        if (roadmap.length === 0) {
            console.log('❌ Roadmap ID 5 not found!');
        } else {
            console.log('✅ Roadmap found:');
            console.log(`   Title: "${roadmap[0].title}"`);
            console.log(`   Description: "${roadmap[0].description?.substring(0, 100)}..."`);
            console.log(`   Status: ${roadmap[0].status}`);
            console.log(`   Client ID: ${roadmap[0].client_id}`);
            console.log(`   Created: ${roadmap[0].created_at}`);
            console.log(`   Updated: ${roadmap[0].updated_at}`);
            
            // Check if description is JSON
            if (roadmap[0].description && roadmap[0].description.startsWith('{')) {
                try {
                    const data = JSON.parse(roadmap[0].description);
                    console.log('\n📊 JSON data in description:');
                    console.log(JSON.stringify(data, null, 2));
                } catch (e) {
                    console.log('❌ Could not parse JSON in description');
                }
            }
        }

        // 2. Check related tables
        console.log('\n🔗 Checking related data:');
        
        // Check roadmap_milestones
        const milestones = await sql`SELECT COUNT(*) as count FROM roadmap_milestones WHERE roadmap_id = 5`;
        console.log(`   • Milestones: ${milestones[0].count}`);
        
        // Check roadmap_items
        const items = await sql`SELECT COUNT(*) as count FROM roadmap_items WHERE plan_id = 5`;
        console.log(`   • Roadmap items: ${items[0].count}`);
        
        // Check implementation_plans
        const plans = await sql`SELECT COUNT(*) as count FROM implementation_plans WHERE roadmap_id = 5`;
        console.log(`   • Implementation plans: ${plans[0].count}`);
        
        // Check risks
        const risks = await sql`SELECT COUNT(*) as count FROM risks WHERE roadmap_id = 5`;
        console.log(`   • Risks: ${risks[0].count}`);
        
        // Check controls
        const controls = await sql`SELECT COUNT(*) as count FROM controls WHERE roadmap_id = 5`;
        console.log(`   • Controls: ${controls[0].count}`);
        
        // Check policies
        const policies = await sql`SELECT COUNT(*) as count FROM policies WHERE roadmap_id = 5`;
        console.log(`   • Policies: ${policies[0].count}`);

        // 3. Summary
        console.log('\n📊 Summary of Roadmap ID 5:');
        console.log('   The roadmap exists but likely has minimal data.');
        console.log('   Need to populate with realistic:');
        console.log('   • Vision, objectives, KPIs');
        console.log('   • Milestones with dates');
        console.log('   • Implementation plans');
        console.log('   • Risks, controls, policies');
        console.log('   • Tasks and dependencies');

    } catch (error) {
        console.error('❌ Error checking data:', error.message);
    } finally {
        await sql.end();
    }
}

// Run the check
checkRoadmap5Data();