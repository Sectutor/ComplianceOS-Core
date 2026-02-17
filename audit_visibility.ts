
import 'dotenv/config';
import { getDb } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();

    // 1. Check all plans
    const plans = await db.select().from(schema.implementationPlans);
    console.log(`Total plans in DB: ${plans.length}`);

    // 2. Check the GDPR plan specifically
    const gdprPlan = plans.find(p => p.id === 18);
    if (gdprPlan) {
        console.log("Found Plan 18:");
        console.log(JSON.stringify(gdprPlan, null, 2));
    } else {
        console.log("❌ Plan 18 NOT FOUND!");
        // List last 5 plans
        console.log("Last 5 plans:");
        plans.slice(-5).forEach(p => console.log(` - [ID: ${p.id}] '${p.title}' (Client: ${p.clientId}, User: ${p.createdById})`));
    }

    // 3. Find the current user if possible
    const users = await db.select().from(schema.users).limit(5);
    console.log("Users in DB:");
    users.forEach(u => console.log(` - [ID: ${u.id}] ${u.name} (${u.email})`));

    process.exit(0);
}

main();
