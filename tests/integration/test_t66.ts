import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDb } from './packages/core/src/db';
import { policyGenerator } from './packages/core/src/lib/policy/policy-generation';

async function run() {
  const db = await getDb();
  
  // Find a client
  const client = await db.query.clients.findFirst();
  
  console.log(`Using client ${client?.id} for generating template 66`);

  try {
     const start = Date.now();
     const result = await policyGenerator.generate(client?.id as number, 66, {
         tailorToIndustry: true,
         customInstruction: "Make it extremely detailed according to SOC 2 and ISO 27001 requirements",
     });
     console.log(`Success in ${Date.now() - start}ms! Content length:`, result.length);
  } catch (err) {
      console.error("Error generating template:", err);
  }
  process.exit(0);
}

run();
