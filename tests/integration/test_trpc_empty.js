import fetch from 'node-fetch'; // if available

async function run() {
  const url = 'http://localhost:3002/api/trpc/clientPolicies.create?batch=1';
  // Mocking the input format for superjson TRPC request
  const body = {
    "0": {
      "json": {
        "clientId": 3,
        "name": "Test",
        "status": "draft",
        "module": "general",
        "templateId": 66,
        "tailor": true,
        "instruction": "Test",
        "answers": {}
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response body (${text.length} chars):`, text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
