
import http from 'http';

function check(port) {
    console.log(`Checking port ${port}...`);
    const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/health',
        method: 'GET',
        timeout: 2000
    };

    const req = http.request(options, (res) => {
        console.log(`Port ${port}: Status ${res.statusCode}`);
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (e) => {
        console.error(`Port ${port} error: ${e.message}`);
    });

    req.on('timeout', () => {
        console.error(`Port ${port} timeout`);
        req.destroy();
    });

    req.end();
}

check(3001);
check(3000);
check(5173);
