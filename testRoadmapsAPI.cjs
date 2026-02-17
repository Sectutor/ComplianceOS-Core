// Test the roadmaps API endpoint
const postgres = require('postgres');

async function testRoadmapsAPI() {
    console.log('🔍 Testing roadmaps API for Client 3...');
    
    const connectionString = 'postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const sql = postgres(connectionString);

    try {
        // Direct database query
        console.log('\n📊 Direct database query for Client 3 roadmaps:');
        const roadmaps = await sql`SELECT id, title, status, created_at, updated_at FROM roadmaps WHERE client_id = 3 ORDER BY id`;
        
        if (roadmaps.length === 0) {
            console.log('❌ No roadmaps found in database for Client 3');
        } else {
            console.log(`✅ Found ${roadmaps.length} roadmaps in database:`);
            roadmaps.forEach(roadmap => {
                console.log(`   ID: ${roadmap.id}, Title: "${roadmap.title}", Status: ${roadmap.status}, Created: ${roadmap.created_at}`);
            });
        }

        // Check if there are any roadmaps with ID 5
        console.log('\n🔍 Specifically checking for roadmap ID 5:');
        const roadmap5 = await sql`SELECT * FROM roadmaps WHERE id = 5 AND client_id = 3`;
        
        if (roadmap5.length === 0) {
            console.log('❌ Roadmap ID 5 not found for Client 3');
        } else {
            console.log(`✅ Roadmap ID 5 exists:`);
            console.log(`   Title: "${roadmap5[0].title}"`);
            console.log(`   Client ID: ${roadmap5[0].client_id}`);
            console.log(`   Status: ${roadmap5[0].status}`);
        }

        // Check the API endpoint structure
        console.log('\n🌐 Checking what the frontend might be receiving:');
        console.log('The frontend calls: trpc.roadmap.list.useQuery({ clientId: 3 })');
        console.log('This should return an array of roadmaps.');
        
        // Simulate what the API should return
        const apiResponse = {
            data: roadmaps,
            isLoading: false,
            error: null
        };
        
        console.log('\n📱 Frontend should receive:');
        console.log(`   • Array with ${roadmaps.length} items`);
        console.log(`   • First item ID: ${roadmaps[0]?.id || 'none'}`);
        console.log(`   • Contains ID 5: ${roadmaps.some(r => r.id === 5) ? 'YES' : 'NO'}`);

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    } finally {
        await sql.end();
    }
}

// Run the test
testRoadmapsAPI();