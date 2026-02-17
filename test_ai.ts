
async function testAIStream() {
    const body = {
        feature: 'scoping_report',
        standardId: 'ISO27001',
        data: {
            scope: { orgBoundaries: "Test Agent Bound" },
            stakeholders: { "Leadership / Sponsor": "emmanuel@gmail.com" },
            existingPolicies: { informationSecurityPolicy: true },
            context: { businessModel: "SaaS" },
            expectations: { targetMaturity: "Level 3" }
        }
    };

    console.log("Requesting AI stream...");
    const response = await fetch("http://localhost:3002/api/ai/generate-stream", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-debug-auth": "secret"
        },
        body: JSON.stringify(body)
    });

    console.log("Response Status:", response.status);
    if (!response.ok) {
        const text = await response.text();
        console.error("Error Response:", text);
        return;
    }

    // No import needed for fetch in Node 20
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        console.error("No reader available");
        return;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
    }
    console.log("\nStream completed.");
}

testAIStream();
