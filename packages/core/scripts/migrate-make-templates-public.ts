import { getDb } from '../src/db';
import { policyTemplates } from '../src/schema';
import { eq, isNull, and, or } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: '../../.env' });

async function migrateTemplates() {
    console.log('Starting policy template visibility migration...');
    console.log('==============================================\n');

    const db = await getDb();

    // 1. Find all private templates
    const privateTemplates = await db.select().from(policyTemplates).where(eq(policyTemplates.isPublic, false));

    console.log(`Found ${privateTemplates.length} private templates to make public.\n`);

    if (privateTemplates.length === 0) {
        console.log('No private templates found. Already migrated?');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    // 2. Update each template to be public and owned by system (null)
    for (const template of privateTemplates) {
        try {
            await db.update(policyTemplates)
                .set({
                    isPublic: true,
                    ownerId: null // System owned
                })
                .where(eq(policyTemplates.id, template.id));

            successCount++;
            console.log(`✓ Made public: ${template.name} (ID: ${template.id})`);
        } catch (error: any) {
            errorCount++;
            console.error(`✗ Failed to update template ${template.id}:`, error.message);
        }
    }

    console.log('\n==============================================');
    console.log('Migration Summary:');
    console.log(`  Total templates processed: ${privateTemplates.length}`);
    console.log(`  Successfully made public:  ${successCount}`);
    console.log(`  Errors:                     ${errorCount}`);
    console.log('==============================================\n');
}

migrateTemplates()
    .then(() => {
        console.log('Migration completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
