import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { policyGenerator } from './packages/core/src/lib/policy/policy-generation';
import { getDb } from './packages/core/src/db';

async function testPolicyGen() {
    try {
        console.log('--- Policy Generation Logic Test ---');
        const db = await getDb();
        
        // Find a client with industry data if possible
        const client = await db.query.clients.findFirst({
            where: (clients, { isNotNull }) => isNotNull(clients.industry)
        }) || await db.query.clients.findFirst();

        if (!client) {
            console.error('No clients found in database.');
            return;
        }

        // Find a template
        const template = await db.query.policyTemplates.findFirst();
        if (!template) {
            console.error('No policy templates found in database.');
            return;
        }

        console.log(`Testing with Client: ${client.name} (ID: ${client.id}, Industry: ${client.industry})`);
        console.log(`Using Template: ${template.name} (ID: ${template.id})`);

        console.log('Calling policyGenerator.generate()...');
        const startTime = Date.now();
        
        const content = await policyGenerator.generate(client.id, template.id, {
            tailorToIndustry: true,
            customInstruction: "Make it professional and brief for testing purposes."
        });

        const duration = Date.now() - startTime;
        console.log(`--- Generation Complete in ${duration}ms ---`);
        console.log(`Content Length: ${content.length}`);
        console.log('Preview (first 200 chars):');
        console.log(content.substring(0, 200));
        console.log('--- End of Test ---');

    } catch (error: any) {
        console.error('--- Generation Failed ---');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testPolicyGen();
