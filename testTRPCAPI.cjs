// Test the tR APIPC endpoint for roadmaps
const http = require('http');

async function testTRPCAPI() {
    console.log('🔍 Testing tRPC API for roadmaps...');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/trpc/roadmap.list?input=%7B%22clientId%22%3A3%7D',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log(`📡 Status: ${res.statusCode}`);
            console.log(`📡 Headers: ${JSON.stringify(res.headers)}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('\n✅ API Response:');
                    console.log(JSON.stringify(result, null, 2));
                    
                    if (result.result?.data) {
                        console.log(`\n📊 Roadmaps returned: ${result.result.data.length}`);
                        result.result.data.forEach((roadmap, index) => {
                            console.log(`   ${index + 1}. ID: ${roadmap.id}, Title: "${roadmap.title}", Status: ${roadmap.status}`);
                        });
                    }
                    resolve(result);
                } catch (error) {
                    console.error('❌ Error parsing response:', error.message);
                    console.log('Raw response:', data);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.end();
    });
}

// Run the test
testTRPCAPI().catch(console.error);