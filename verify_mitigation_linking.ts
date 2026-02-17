
import 'dotenv/config';
import { appRouter } from './routers';
import { getDb } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Starting Mitigation Linking Verification...');

    const dbConn = await getDb();
    if (!dbConn) throw new Error('Database connection failed');

    // Mock Context
    const ctx = {
        user: { id: 1, role: 'admin', email: 'test@example.com' },
    } as any;

    const caller = appRouter.createCaller(ctx);

    // 1. Setup Data
    console.log('Setting up Test Data...');
    const client = await dbConn.insert(schema.clients).values({
        name: 'Mitigation Test Client',
        industry: 'Tech',
    }).returning();
    const clientId = client[0].id;

    const risk = await dbConn.insert(schema.riskAssessments).values({
        clientId,
        assessmentId: 'R-TEST-MITIGATION',
        category: 'Security',
        riskDescription: 'Test Risk for Mitigation',
        inherentLikelihood: 'High',
        inherentImpact: 'High',
        status: 'draft',
    }).returning();
    const riskId = risk[0].id;

    // Create a Control
    const control = await dbConn.insert(schema.controls).values({
        controlId: 'C-TEST-001-' + Date.now(), // Unique ID
        name: 'Test Control 1',
        description: 'Description 1',
        framework: 'ISO 27001',
    }).returning();
    const controlId = control[0].id;

    // Create Client Control
    const clientControl = await dbConn.insert(schema.clientControls).values({
        clientId,
        controlId,
        clientControlId: 'CC-TEST-001-' + Date.now(),
        status: 'implemented',
    }).returning();
    const clientControlId = clientControl[0].id;

    // 2. Create Treatment
    console.log('Creating Treatment...');
    const treatment = await caller.risks.createRiskTreatment({
        clientId,
        riskAssessmentId: riskId,
        treatmentType: 'mitigate',
        strategy: 'Test Strategy',
    });
    // console.log('Treatment Created Object:', JSON.stringify(treatment));
    console.log('Treatment ID:', treatment.id);
    console.log('Client Control ID:', clientControlId);

    try {
        // 3. Link Control (Initial)
        console.log('Linking Control (Initial - Minimal)...');
        await caller.risks.linkTreatmentControl({
            treatmentId: treatment.id,
            controlId: clientControlId,
            effectiveness: 'partially_effective',
            implementationNotes: 'Initial Notes',
        });

        // 4. Verify Link
        console.log('Verifying Link...');
        const treatments = await caller.risks.getRiskTreatments({ riskAssessmentId: riskId });
        const linked = treatments[0].linkedControls.find((c: any) => c.controlId === clientControlId);

        if (!linked) throw new Error('Control not linked!');
        if (linked.effectiveness !== 'partially_effective') throw new Error(`Wrong effectiveness: ${linked.effectiveness}`);
        if (linked.implementationNotes !== 'Initial Notes') throw new Error(`Wrong notes: ${linked.implementationNotes}`);
        console.log('PASS: Initial Link Verified.');

        // 5. Link Control (Update/Upsert)
        console.log('Linking Control (Update)...');
        await caller.risks.linkTreatmentControl({
            treatmentId: treatment.id,
            controlId: clientControlId,
            effectiveness: 'effective',
            implementationNotes: 'Updated Notes',
        });

        // 6. Verify Update
        console.log('Verifying Update...');
        const treatmentsUpdated = await caller.risks.getRiskTreatments({ riskAssessmentId: riskId });
        const linkedUpdated = treatmentsUpdated[0].linkedControls.find((c: any) => c.controlId === clientControlId);

        if (linkedUpdated.effectiveness !== 'effective') throw new Error(`Update failed! Effectiveness: ${linkedUpdated.effectiveness}`);
        if (linkedUpdated.implementationNotes !== 'Updated Notes') throw new Error(`Update failed! Notes: ${linkedUpdated.implementationNotes}`);
        console.log('PASS: Update Verified.');

    } finally {
        // Cleanup
        console.log('Cleaning up...');
        try {
            await dbConn.delete(schema.treatmentControls).where(eq(schema.treatmentControls.treatmentId, treatment.id));
            await dbConn.delete(schema.riskTreatments).where(eq(schema.riskTreatments.id, treatment.id));
            await dbConn.delete(schema.riskAssessments).where(eq(schema.riskAssessments.id, riskId));
            await dbConn.delete(schema.clientControls).where(eq(schema.clientControls.id, clientControlId));
            await dbConn.delete(schema.controls).where(eq(schema.controls.id, controlId));
            await dbConn.delete(schema.clients).where(eq(schema.clients.id, clientId));
        } catch (e) {
            console.error("Cleanup failed", e);
        }
    }

    console.log('Verification Complete!');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
