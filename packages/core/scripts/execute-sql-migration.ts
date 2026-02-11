import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function executeSqlMigration() {
    const db = await getDb();

    console.log('Starting SQL migration...');
    console.log('=====================================\n');

    try {
        // Step 1: Preview what will be migrated
        console.log('Step 1: Previewing templates to migrate...\n');
        const preview = await db.execute(sql`
      SELECT 
        id,
        client_id,
        name,
        COALESCE(client_policy_id, 'POL-' || LPAD(id::text, 3, '0')) as template_id,
        CASE 
          WHEN name ILIKE '%ISO 27001%' AND name ILIKE '%SOC 2%' THEN '["ISO 27001", "SOC 2"]'
          WHEN name ILIKE '%ISO 27001%' THEN '["ISO 27001"]'
          WHEN name ILIKE '%SOC 2%' THEN '["SOC 2"]'
          ELSE '[]'
        END as inferred_frameworks
      FROM client_policies
      WHERE client_id = 714
        AND template_id IS NULL
      ORDER BY id
    `);

        console.log(`Found ${preview.rows.length} templates to migrate:`);
        preview.rows.forEach((row: any, i: number) => {
            console.log(`  ${i + 1}. ${row.name} (ID: ${row.id}) → ${row.template_id} [${row.inferred_frameworks}]`);
        });
        console.log('');

        if (preview.rows.length === 0) {
            console.log('No templates found to migrate. Exiting.');
            return;
        }

        // Step 2: Insert templates into policy_templates
        console.log('Step 2: Migrating templates to policy_templates table...\n');
        const result = await db.execute(sql`
      INSERT INTO policy_templates (
        template_id,
        name,
        content,
        owner_id,
        is_public,
        sections,
        frameworks,
        created_at
      )
      SELECT 
        COALESCE(
          cp.client_policy_id,
          'POL-' || LPAD(cp.id::text, 3, '0')
        ) as template_id,
        cp.name,
        cp.content,
        NULL as owner_id,
        true as is_public,
        NULL as sections,
        CASE 
          WHEN cp.name ILIKE '%ISO 27001%' AND cp.name ILIKE '%SOC 2%' THEN '["ISO 27001", "SOC 2"]'::jsonb
          WHEN cp.name ILIKE '%ISO 27001%' THEN '["ISO 27001"]'::jsonb
          WHEN cp.name ILIKE '%SOC 2%' THEN '["SOC 2"]'::jsonb
          ELSE '[]'::jsonb
        END as frameworks,
        cp.created_at
      FROM client_policies cp
      WHERE cp.client_id = 714
        AND cp.template_id IS NULL
      ON CONFLICT (template_id) DO NOTHING
    `);

        console.log(`✓ Migration completed successfully\n`);

        // Step 3: Verify the migration
        console.log('Step 3: Verifying migration...\n');
        const verification = await db.execute(sql`
      SELECT 
        'Templates in policy_templates' as table_name,
        COUNT(*) as count
      FROM policy_templates
      UNION ALL
      SELECT 
        'Templates remaining in client_policies' as table_name,
        COUNT(*) as count
      FROM client_policies
      WHERE client_id = 714 AND template_id IS NULL
    `);

        verification.rows.forEach((row: any) => {
            console.log(`  ${row.table_name}: ${row.count}`);
        });
        console.log('');

        // Step 4: Show migrated templates
        console.log('Step 4: Migrated templates:\n');
        const migrated = await db.execute(sql`
      SELECT 
        id,
        template_id,
        name,
        frameworks,
        is_public,
        created_at
      FROM policy_templates
      ORDER BY created_at DESC
      LIMIT 20
    `);

        migrated.rows.forEach((row: any, i: number) => {
            const frameworks = Array.isArray(row.frameworks) ? row.frameworks.join(', ') : 'None';
            console.log(`  ${i + 1}. ${row.name}`);
            console.log(`     Template ID: ${row.template_id}`);
            console.log(`     Frameworks: ${frameworks}`);
            console.log(`     Public: ${row.is_public}`);
            console.log('');
        });

        console.log('=====================================');
        console.log('Migration Summary:');
        console.log(`  Templates migrated: ${preview.rows.length}`);
        console.log(`  Total templates in policy_templates: ${migrated.rows.length}`);
        console.log('=====================================\n');

        console.log('✓ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Check http://localhost:5173/policy-templates');
        console.log('2. Check http://localhost:5173/clients/714/policies (should be empty)');
        console.log('3. Test creating a new policy from a template\n');

    } catch (error: any) {
        console.error('Migration failed:', error.message);
        throw error;
    }
}

executeSqlMigration()
    .then(() => {
        console.log('Migration script completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
