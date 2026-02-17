
import 'dotenv/config';

async function verifyAll() {
    console.log("--- Verifying Readiness API ---");

    const headers = {
        "Content-Type": "application/json",
        "x-debug-auth": "secret"
    };

    // 1. Test fetch health
    const health = await fetch("http://localhost:3002/health").then(r => r.json());
    console.log("Health Check:", health.status);

    // 2. Test getState
    const state = await fetch("http://localhost:3002/api/trpc/readiness.getState?batch=1&input=%7B%220%22%3A%7B%22clientId%22%3A3%2C%22standardId%22%3A%22ISO27001%22%7D%7D", { headers }).then(r => r.json());
    console.log("getState Status:", state[0].result.data ? "OK" : "Error");

    // 3. Test createOrUpdate (Step 6)
    const mutation = await fetch("http://localhost:3002/api/trpc/readiness.createOrUpdate?batch=1", {
        method: "POST",
        headers,
        body: JSON.stringify({
            "0": {
                clientId: 3,
                standardId: "ISO27001",
                step: 6,
                data: {
                    scope: { orgBoundaries: "Verified Bound" },
                    scopingReport: "This is a verified test report."
                }
            }
        })
    }).then(r => r.json());
    console.log("createOrUpdate Status:", mutation[0].result.data ? "OK" : "Error");

    // 4. Test baseline (Final)
    const baseline = await fetch("http://localhost:3002/api/trpc/readiness.baseline?batch=1", {
        method: "POST",
        headers,
        body: JSON.stringify({
            "0": {
                clientId: 3,
                standardId: "ISO27001"
            }
        })
    }).then(r => r.json());
    console.log("baseline Status:", baseline[0].result.data ? "OK" : "Error");

    console.log("--- All tests completed ---");
}

verifyAll();
