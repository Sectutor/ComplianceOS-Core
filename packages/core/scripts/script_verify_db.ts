
import 'dotenv/config';
import { getDb } from '../src/db';
import { clients } from '../src/schema';
import { desc } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
    try {
        const db = await getDb();
        const allClients = await db.select().from(clients).orderBy(desc(clients.id));

        const logContent = allClients.map((c: any) =>
            `ID: ${c.id}, Name: "${c.name}", PlanTier: "${c.planTier}"`
        ).join('\n');

        fs.writeFileSync('client_verification.txt', logContent);
        console.log('Verification log written to client_verification.txt');

    } catch (e) {
        console.error(e);
        fs.writeFileSync('client_verification.txt', 'Error: ' + JSON.stringify(e));
    }
    process.exit(0);
}

main();
