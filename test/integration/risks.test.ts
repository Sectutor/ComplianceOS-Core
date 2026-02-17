import { describe, it, expect, vi } from 'vitest';
import { withTestTransaction, createCaller } from '../utils';
import { riskAssessments } from '../../schema';
import { eq } from 'drizzle-orm';

describe('Risk Management Workflow', () => {

    it('should create a risk assessment with correct default values', async () => {
        await withTestTransaction(async (tx, ctx) => {
            const caller = createCaller(ctx);

            // 1. Create a dummy client for the test (if not exists)
            // Or assume existing client ID 1 for simplicity if data is seeded. 
            // Better: Create a client inside transaction.
            // But we need to use 'tx' to insert it.
            // Since we mocked getDb(), simple db calls must use 'tx'.
            // OR we can rely on seed IDs if we trust them. Let's try creating a client first.

            // To properly test, we should construct a fresh client.
            // We can't use caller.clients.create because it calls `db.insert...` but `getDb` is mocked to `tx`.
            // So calling router procedures is safe!

            const client = await caller.clients.create({
                name: 'Test Client ' + Date.now(),
                industry: 'Technology',
                size: '1-10'
            });

            // 2. Create Risk Assessment
            const riskInput = {
                clientId: client.id,
                title: 'Test Risk Integration 1',
                likelihood: 3,
                impact: 4,
                status: 'draft' as const,
                threatDescription: 'Test Threat Description'
            };

            const risk = await caller.risks.createRiskAssessment(riskInput);

            expect(risk).toBeDefined();
            expect(risk.id).toBeGreaterThan(0);
            expect(risk.title).toBe(riskInput.title);
            expect(risk.inherentScore).toBe(12); // 3 * 4
            expect(risk.inherentRisk).toBe('Medium'); // Assuming 12 maps to Medium (Check lib logic)
            expect(risk.status).toBe('draft');
            expect(risk.assessmentId).toMatch(/^RA-\d{4}-\d+/); // Format RA-YYYY-XXXX

        });
    });

    it('should update risk assessment and recalculate scores', async () => {
        await withTestTransaction(async (tx, ctx) => {
            const caller = createCaller(ctx);
            const client = await caller.clients.create({ name: 'Risk Test Client 2' });

            // Create initial risk
            const risk = await caller.risks.createRiskAssessment({
                clientId: client.id,
                title: 'Risk to Update',
                likelihood: 2,
                impact: 2
            });

            expect(risk.inherentScore).toBe(4);

            // Update with higher impact
            const updated = await caller.risks.updateRiskAssessment({
                id: risk.id,
                clientId: client.id,
                impact: 5,
                // likelihood should persist as 2 from DB fetch logic in router
            });

            // Verify recalculation
            // Router logic: fetches current likelihood if not provided.
            // 2 * 5 = 10
            expect(Number(updated!.impact)).toBe(5);
            expect(updated!.inherentScore).toBe(10);
        });
    });

    it('should forbid viewers from creating risks', async () => {
        await withTestTransaction(async (tx, ctx) => {
            // Override context to be a viewer
            ctx.clientRole = 'viewer';
            // Note: The router checks ctx.clientRole. 
            // My createMockContext sets 'role' on user, but middleware sets 'clientRole' on ctx?
            // Let's check router.ts middleware. 
            // It runs `checkClientAccess` which sets `ctx.clientRole`.
            // Testing the router directly bypasses middleware usually unless we use `createCallerFactory` properly or manually simulate middleware effects on context.
            // The `createCaller` calls the router directly. 
            // If I want to test authorization, I should manually pass `clientRole` in the context if the router expects it.

            // looking at risks.ts: `if (ctx.clientRole === 'viewer')`
            // So I just need to add clientRole to my mock context.
            ctx.clientRole = 'viewer';

            const caller = createCaller(ctx);

            // Should fail
            await expect(caller.risks.createRiskAssessment({
                clientId: 1, // Doesn't matter
                title: 'Should Fail',
                likelihood: 1,
                impact: 1
            })).rejects.toThrow('Viewers cannot create risk assessments');

        }, { role: 'user' }); // Passing user overrides if needed
    });

});
