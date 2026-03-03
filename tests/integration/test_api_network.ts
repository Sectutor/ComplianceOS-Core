import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const url = 'http://127.0.0.1:3002/api/trpc/clientPolicies.create?batch=1';
  
  const body = {
    "0": {
      "json": {
        "clientId": 3,
        "name": "Test generated policy via network",
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
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`Duration: ${Date.now() - start}ms`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Length: ${text.length}`);
    try {
        const json = JSON.parse(text);
        console.log("Valid JSON returned!");
    } catch {
        console.error("INVALID JSON! First 200 chars:", text.substring(0, 200));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
