import 'dotenv/config';
import { getDb } from './packages/core/src/db';

async function testReport() {
    try {
        console.log('[Test] Starting report generation test...');

        const { generateCustomProfessionalReport, generateCustomProfessionalReportDOCX } = await import('./packages/core/src/lib/reporting');

        console.log('[Test] Imported functions successfully');
        console.log('[Test] generateCustomProfessionalReport:', typeof generateCustomProfessionalReport);
        console.log('[Test] generateCustomProfessionalReportDOCX:', typeof generateCustomProfessionalReportDOCX);

        console.log('[Test] Calling PDF generator...');
        const buffer = await generateCustomProfessionalReport(3, {
            title: 'Test Report',
            sections: ['executive_summary'],
            branding: {}
        });

        console.log('[Test] SUCCESS! Buffer length:', buffer.length);
    } catch (error: any) {
        console.error('[Test] FATAL ERROR:', error.message);
        console.error('[Test] Stack:', error.stack);
    }

    process.exit(0);
}

testReport();
