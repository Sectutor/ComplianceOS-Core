
import { appRouter } from './routers';
import { db } from './db';
import { getDb } from './db';

async function main() {
    console.log('Verifying Custom Control Creation...');

    // Create a mock context with an admin user
    const ctx = {
        user: { id: 1, role: 'admin', email: 'test@example.com' },
        req: {} as any,
        res: {} as any
    };

    const caller = appRouter.createCaller(ctx);

    const customName = `Test Control ${Date.now()}`;

    try {
        const result = await caller.clientControls.createCustom({
            clientId: 3,
            name: customName,
            description: "Created via verification script",
            framework: "Test Framework"
        });

        console.log('Control Created Successfully:', result);

        if (result.clientControl.clientId === 3) {
            console.log('PASS: Client Control linked correctly to client 3.');
        } else {
            console.error('FAIL: Client ID mismatch. Expected 3, got', result.clientControl.clientId);
            process.exit(1);
        }

    } catch (error) {
        console.error('FAIL: Error creating custom control:', error);
        process.exit(1);
    }
}

main().catch(console.error);
