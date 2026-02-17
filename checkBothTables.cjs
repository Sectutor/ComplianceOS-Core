// Check both roadmaps and remediationPlans tables
const postgres = require('postgres');

async function checkBothTables() {
    console.log('🔍 Checking both tables for Client 3 data...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // 1. Check roadmaps table (where we created data)
        console.log('\n📋 Table: roadmaps');
        const roadmaps = await sql`SELECT id, title, client_id, status, created_at FROM roadmaps WHERE client_id = 3 ORDER BY id`;
        
        if (roadmaps.length === 0) {
            console.log('❌ No data in roadmaps table for Client 3');
        } else {
            console.log(`✅ Found ${roadmaps.length} records in roadmaps table:`);
            roadmaps.forEach(roadmap => {
                console.log(`   ID: ${roadmap.id}, Title: "${roadmap.title}", Client: ${roadmap.client_id}, Status: ${roadmap.status}`);
            });
        }

        // 2. Check remediationPlans table (what the API queries)
        console.log('\n📋 Table: remediationPlans');
        const remediationPlans = await sql`SELECT id, title, client_id, status, created_at FROM remediation_plans WHERE client_id = 3 ORDER BY id`;
        
        if (remediationPlans.length === 0) {
            console.log('❌ No data in remediation_plans table for  Client3');
        } else {
            console.log(`✅ Found ${remediationPlans.length} records in remediation_plans table:`);
            remediationPlans.forEach(plan => {
                console.log(`   ID: ${plan.id}, Title: "${plan.title}", Client: ${plan.client_id}, Status: ${plan.status}`);
            });
        }

        // 3. Summary
        console.log('\n📊 Summary:');
        console.log(`   • roadmaps table: ${roadmaps.length} records`);
        console.log(`   • remediation_plans table: ${remediationPlans.length} records`);
        console.log(`   • Frontend calls: roadmap.list (queries remediation_plans)`);
        console.log(`   • We created data in: roadmaps table`);
        console.log('\n🎯 The Problem:');
        console.log('   The frontend is looking for data in remediation_plans table,');
        console.log('   but we created our test data in the roadmaps table.');
        console.log('   These are two different tables!');

    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
    } finally {
        await sql.end();
    }
}

// Run the check
checkBothTables();