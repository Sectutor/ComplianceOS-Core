
// No import needed for fetch in Node 20

async function testMutation() {
    const body = [
        {
            clientId: 3,
            step: 2,
            data: {
                scope: { orgBoundaries: "Test Agent Bound" }
            }
        }
    ];

    const response = await fetch("http://localhost:3002/api/trpc/readiness.createOrUpdate?batch=1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-debug-auth": "secret"
        },
        body: JSON.stringify({ "0": body[0] })
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));
}

testMutation();
