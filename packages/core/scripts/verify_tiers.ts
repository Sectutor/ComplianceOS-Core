
import * as db from '../src/db';
import * as schema from '../src/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
dotenv.config({ path: join(__dirname, '../../../.env') });

async function main() {
    console.log('--- User Tier Verification ---');

    const d = await db.getDb();

    // 1. Create a test user with limit 1 (easier to test)
    const testEmail = `test_limit_${Date.now()}@example.com`;
    console.log(`\n[Test 1] Creating test user with limit 1: ${testEmail}`);

    const [user] = await d.insert(schema.users).values({
        email: testEmail,
        name: 'Test Limit User',
        openId: `test:${testEmail}`,
        role: 'user',
        maxClients: 1
    }).returning();

    console.log(`User created with ID: ${user.id}, role: ${user.role}, maxClients: ${user.maxClients}`);

    // Mocking the creation check from clients.ts
    const checkLimit = async (userId: number, role: string) => {
        const fullUser = await db.getUserById(userId);
        const userOrgs = await d.select({ count: sql<number>`count(*)` })
            .from(schema.userClients)
            .where(and(
                eq(schema.userClients.userId, userId),
                eq(schema.userClients.role, 'owner')
            ));

        const currentCount = Number(userOrgs[0]?.count || 0);
        const limit = fullUser?.maxClients || 2;

        console.log(`   - Check: Current=${currentCount}, Limit=${limit}, Role=${role}`);

        // This is the logic we implemented in clients.ts
        if (currentCount >= limit && role !== 'super_admin' && role !== 'owner') {
            return false;
        }
        return true;
    };

    const createMockOrg = async (userId: number, name: string) => {
        const [client] = await d.insert(schema.clients).values({ name }).returning();
        await d.insert(schema.userClients).values({
            userId,
            clientId: client.id,
            role: 'owner'
        });
        console.log(`   + Org Created: ${name}`);
    };

    // Test Case: Limit Reach
    console.log('\n[Test 2] Testing limit enforcement...');
    if (await checkLimit(user.id, user.role)) {
        await createMockOrg(user.id, 'Test Org 1');
    }

    if (await checkLimit(user.id, user.role)) {
        await createMockOrg(user.id, 'Test Org 2');
        console.log('   FAIL: Should not have been allowed to create 2nd org');
    } else {
        console.log('   SUCCESS: Correctly blocked 2nd org (Limit hit)');
    }

    // Test Case: Upgrade
    console.log('\n[Test 3] Testing tier upgrade...');
    await d.update(schema.users).set({ maxClients: 10 }).where(eq(schema.users.id, user.id));
    console.log('   - Upgraded user to 10 orgs');

    if (await checkLimit(user.id, user.role)) {
        await createMockOrg(user.id, 'Test Org 2');
        console.log('   SUCCESS: Allowed to create 2nd org after upgrade');
    } else {
        console.log('   FAIL: Still blocked after upgrade');
    }

    // Test Case: Super Admin Bypass
    console.log('\n[Test 4] Testing Super Admin bypass...');
    const saEmail = `sa_${Date.now()}@example.com`;
    const [superAdmin] = await d.insert(schema.users).values({
        email: saEmail,
        name: 'Test Super Admin',
        openId: `test:${saEmail}`,
        role: 'super_admin',
        maxClients: 0 // Even with 0 limit
    }).returning();
    console.log(`Super Admin created with ID: ${superAdmin.id}, role: ${superAdmin.role}`);

    if (await checkLimit(superAdmin.id, superAdmin.role)) {
        await createMockOrg(superAdmin.id, 'SA Org 1');
        console.log('   SUCCESS: Super Admin bypassed limit');
    } else {
        console.log('   FAIL: Super Admin blocked');
    }

    console.log('\n--- Cleaning up test data ---');
    // We'll leave it in for now as manual check if needed, or we can delete.
    // To be clean:
    // This is optional since it's a test DB usually, but good practice.

    console.log('\nVerification Complete.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
