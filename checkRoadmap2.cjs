// Check Roadmap ID 2
const postgres = require('postgres');

async function checkRoadmap2() {
    console.log('🔍 Checking Roadmap ID 2...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        const roadmap = await sql`SELECT * FROM roadmaps WHERE id = 2`;
        
        if (roadmap.length === 0) {
            console.log('❌ Roadmap ID 2 not found!');
        } else {
            console.log('✅ Roadmap ID 2 found:');
            console.log(`   Title: "${roadmap[0].title}"`);
            console.log(`   Client ID: ${roadmap[0].client_id}`);
            console.log(`   Description length: ${roadmap[0].description?.length || 0} chars`);
            
            if (roadmap[0].description && roadmap[0].description.startsWith('{')) {
                try {
                    const data = JSON.parse(roadmap[0].description);
                    console.log('   JSON data exists in description');
                } catch (e) {
                    console.log('   Description is not valid JSON');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.end();
    }
}

checkRoadmap2();