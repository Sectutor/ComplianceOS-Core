
import 'dotenv/config';
import { appRouter } from './routers';
import { getDb } from './db';
import { riskAssessments, clientPolicies, riskPolicyMappings, riskTreatments } from './schema';
import { eq } from 'drizzle-orm';

async function run() {
    console.log('Starting Risk-Policy Integration Verification (Hybrid Mode)...');

    const db = await getDb();
    if (!db) throw new Error("DB connection failed");

    // Mock Context
    const ctx = {
        user: { id: 1, role: 'admin', email: 'test@admin.com' }
    };

    const caller = appRouter.createCaller(ctx as any);

    const timestamp = Date.now();
    const CLIENT_ID = 1;

    try {
        // 1. Create High Risk (Direct DB)
        console.log('Creating Test Risk (DB)...');
        // Set params to avoid other Gaps:
        // - Treatment exists (Added step 2)
        // - Not overdue (reviewDueDate tomorrow)
        // - Residual Risk Low (controlEffectiveness Effective)
        const [newRisk] = await db.insert(riskAssessments).values({
            clientId: CLIENT_ID,
            assessmentId: `RA-TEST-${timestamp}`,
            threatDescription: 'Test High Risk for Policy Gap',
            vulnerabilityDescription: 'No policy defined',
            inherentRisk: 'High',
            likelihood: '4',
            impact: '4',
            status: 'draft',
            treatmentOption: 'Mitigate',
            controlEffectiveness: 'Effective',
            residualRisk: 'Low',
            reviewDueDate: new Date(Date.now() + 86400000),
            nextReviewDate: new Date(Date.now() + 86400000)
        }).returning();
        console.log(`Risk Created: ${newRisk.id} (${newRisk.inherentRisk} -> Residual: ${newRisk.residualRisk})`);

        // 2. Create Dummy Treatment (Direct DB)
        console.log('Creating Dummy Treatment (DB)...');
        await db.insert(riskTreatments).values({
            clientId: CLIENT_ID,
            riskAssessmentId: newRisk.id,
            treatmentType: 'mitigate',
            strategy: 'Dummy treatment to clear gap',
            status: 'planned'
        });

        // 3. Create Policy (Direct DB)
        console.log('Creating Test Policy (DB)...');
        // Updated to use 'name' instead of 'title' and version as int
        const [newPolicy] = await db.insert(clientPolicies).values({
            clientId: CLIENT_ID,
            name: `Policy for Risk ${timestamp}`,
            content: 'Policy content',
            status: 'draft',
            version: 1
        }).returning();
        console.log(`Policy Created: ${newPolicy.id}`);

        // 4. Check Gap Analysis (Should show Policy Gap)
        console.log('Checking Gap Analysis for Policy Gap...');
        let gaps = await caller.risks.getGapAnalysis({ clientId: CLIENT_ID });
        let policyGap = gaps.find((g: any) => g.riskId === newRisk.id && g.recommendation.includes('policy'));

        if (policyGap) {
            console.log('PASS: Policy Gap found:', policyGap.recommendation);
        } else {
            console.error('FAIL: No Policy Gap found.');
            console.log('Gaps for this risk:', gaps.filter((g: any) => g.riskId === newRisk.id));
        }

        // 5. Link Risk to Policy (API)
        console.log('Linking Risk to Policy (API)...');
        await caller.clientPolicies.linkRisk({
            policyId: newPolicy.id,
            riskId: newRisk.id
        });
        console.log('Linked.');

        // 6. Verify Policy Count (API)
        console.log('Verifying Policy Count (API)...');
        const risks = await caller.risks.getRiskAssessments({ clientId: CLIENT_ID });
        const riskWithCount = risks.find((r: any) => r.id === newRisk.id);

        if (riskWithCount && riskWithCount.policyCount === 1) {
            console.log('PASS: Policy Count is 1.');
        } else {
            console.error('FAIL: Policy Count mismatch.', riskWithCount?.policyCount);
        }

        // 7. Verify Gap is Gone (API)
        console.log('Verifying Gap is resolved...');
        gaps = await caller.risks.getGapAnalysis({ clientId: CLIENT_ID });
        policyGap = gaps.find((g: any) => g.riskId === newRisk.id && g.recommendation.includes('policy'));

        if (!policyGap) {
            console.log('PASS: Policy Gap resolved.');
        } else {
            console.error('FAIL: Policy Gap still exists.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await db.delete(riskPolicyMappings).where(eq(riskPolicyMappings.riskAssessmentId, newRisk.id));
        await db.delete(riskTreatments).where(eq(riskTreatments.riskAssessmentId, newRisk.id));
        await db.delete(riskAssessments).where(eq(riskAssessments.id, newRisk.id));
        await db.delete(clientPolicies).where(eq(clientPolicies.id, newPolicy.id));
        console.log('Cleanup done.');

    } catch (error: any) {
        console.error("Verification Loop Failed:");
        console.error(JSON.stringify(error, null, 2));
        if (error.cause) console.error("Cause (JSON):", JSON.stringify(error.cause, null, 2));
    }
}

run();
