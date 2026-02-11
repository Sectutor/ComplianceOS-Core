import { getDb } from '../src/db';
import { clientPolicies, policyTemplates } from '../src/schema';
import { eq, isNull, and } from 'drizzle-orm';

async function migratePolicyTemplates() {
    const db = await getDb();

    console.log('Starting policy template migration...');
    console.log('=====================================\n');

    // Fetch templates from client_policies
    const templates = await db.select()
        .from(clientPolicies)
        .where(and(
            eq(clientPolicies.clientId, 714),
            isNull(clientPolicies.templateId)
        ));

    console.log(`Found ${templates.length} templates to migrate from client_policies (client_id=714, template_id IS NULL)\n`);

    if (templates.length === 0) {
        console.log('No templates found to migrate. Exiting.');
        return;
    }

    // Preview templates
    console.log('Templates to be migrated:');
    console.log('-------------------------');
    templates.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name} (ID: ${t.id})`);
    });
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    // Migrate each template
    for (const template of templates) {
        const templateId = template.clientPolicyId || `POL-${String(template.id).padStart(3, '0')}`;

        // Infer frameworks from name
        let frameworks: string[] = [];
        const nameLower = template.name.toLowerCase();
        if (nameLower.includes('iso 27001') && nameLower.includes('soc 2')) {
            frameworks = ['ISO 27001', 'SOC 2'];
        } else if (nameLower.includes('iso 27001') || nameLower.includes('iso27001')) {
            frameworks = ['ISO 27001'];
        } else if (nameLower.includes('soc 2') || nameLower.includes('soc2')) {
            frameworks = ['SOC 2'];
        }

        try {
            await db.insert(policyTemplates).values({
                templateId,
                name: template.name,
                content: template.content || '',
                ownerId: null,
                isPublic: true,
                sections: null,
                frameworks,
            });

            successCount++;
            console.log(`✓ Migrated: ${template.name} → ${templateId} [${frameworks.join(', ') || 'No framework'}]`);
        } catch (error: any) {
            errorCount++;
            if (error.code === '23505') {
                console.error(`✗ Skipped (already exists): ${template.name}`);
            } else {
                console.error(`✗ Failed to migrate: ${template.name}`, error.message);
            }
        }
    }

    console.log('\n=====================================');
    console.log('Migration Summary:');
    console.log(`  Total templates: ${templates.length}`);
    console.log(`  Successfully migrated: ${successCount}`);
    console.log(`  Errors/Skipped: ${errorCount}`);
    console.log('=====================================\n');

    // Verify migration
    const migratedTemplates = await db.select().from(policyTemplates);
    console.log(`Total templates in policy_templates table: ${migratedTemplates.length}\n`);

    console.log('IMPORTANT: Verify the migration before deleting from client_policies!');
    console.log('1. Check http://localhost:5173/policy-templates');
    console.log('2. Check http://localhost:5173/clients/714/policies (should be empty or show only client policies)');
    console.log('3. Test creating a new policy from a template\n');
}

migratePolicyTemplates()
    .then(() => {
        console.log('Migration script completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
