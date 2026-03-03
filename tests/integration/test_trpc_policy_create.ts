import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDb } from './packages/core/src/db';
import { appRouter } from './packages/core/src/routers';

async function run() {
  const db = await getDb();
  
  // Find a user
  const user = await db.query.users.findFirst();
  
  // Find a client
  const client = await db.query.clients.findFirst();
  const clientId = client?.id || 1;
  const template = await db.query.policyTemplates.findFirst();

  console.log(`Using client ${clientId} and user ${user?.email}, template ${template?.id}`);

  const ctx = {
      req: { headers: {}, ip: '127.0.0.1' } as any,
      res: { setHeader: () => {} } as any,
      user,
      clientId,
      aal: 'aal2',
      clientRole: 'admin',
      isPremium: true
  };

  const caller = appRouter.createCaller(ctx as any);

  try {
     console.log("Calling caller.clientPolicies.create...");
     const result = await caller.clientPolicies.create({
         clientId: clientId as number,
         templateId: template?.id as number,
         name: "Test Policy Router",
         status: "draft",
         module: "general",
         tailor: true,
         instruction: "Test generation",
         answers: {}
     });
     console.log("Success! Policy created:", result.id);
  } catch (err) {
      console.error("Error calling trpc:", err);
  }
  process.exit(0);
}

run();
