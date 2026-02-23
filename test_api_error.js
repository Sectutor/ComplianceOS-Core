const { createCaller } = require('./packages/core/src/server/routers/app');
const { appRouter } = require('./packages/core/src/server/routers/app');
const { getDb } = require('./packages/core/src/db');
const { z } = require('zod');

async function run() {
    try {
        const caller = appRouter.createCaller({ user: { id: 1, email: 'test@example.com' } });

        console.log('Testing listSSPs...');
        try { await caller.federal.listSSPs({ clientId: 3, fismaSystemId: 1 }); } catch (e) { console.error('listSSPs error', e.message); }

        console.log('Testing listSARs...');
        try { await caller.federal.listSARs({ clientId: 3, fismaSystemId: 1 }); } catch (e) { console.error('listSARs error', e.message); }

        console.log('Testing createSSP...');
        try {
            const ssp = await caller.federal.createSSP({ clientId: 3, fismaSystemId: 1, title: 'Test SSP', framework: 'NIST' });
            console.log('Created SSP:', ssp.id);

            console.log('Testing updateSSP...');
            await caller.federal.updateSSP({ clientId: 3, id: ssp.id, content: '{}' });

            console.log('Testing saveSspControls...');
            await caller.federal.saveSspControls({ clientId: 3, sspId: ssp.id, controls: [{ controlId: 'AC-1' }] });
        } catch (e) { console.error('SSP write error:', e.message); }

        console.log('Testing getSspControls...');
        try { await caller.federal.getSspControls({ clientId: 3, sspId: 1 }); } catch (e) { console.error('getSspControls error:', e.message); }

        console.log('Testing createSAR...');
        try {
            const sar = await caller.federal.createSAR({ clientId: 3, fismaSystemId: 1, title: 'Test SAR', framework: 'NIST' });

            console.log('Testing saveSarFinding...');
            await caller.federal.saveSarFinding({ clientId: 3, sarId: sar.id, controlId: 'AC-1', result: 'Satisfied' });

            console.log('Testing getSarFindings...');
            await caller.federal.getSarFindings({ clientId: 3, sarId: sar.id });
        } catch (e) { console.error('SAR error:', e.message); }

        console.log('Finished tests.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
