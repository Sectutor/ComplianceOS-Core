
async function testBaseline() {
    const body = {
        clientId: 3,
        standardId: "ISO27001"
    };

    const response = await fetch("http://localhost:3002/api/trpc/readiness.baseline?batch=1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-debug-auth": "secret"
        },
        body: JSON.stringify({ "0": body })
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));
}

testBaseline();
