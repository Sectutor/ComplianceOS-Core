import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

export const createMigrationRouter = (t: any, publicProcedure: any, isAuthed: any) => {
    return t.router({
        migratePolicyTemplates: publicProcedure
            .use(isAuthed)
            .mutation(async ({ ctx }: any) => {
                const db = await getDb();

                try {
                    // Step 1: Preview what will be migrated
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

                    const templatesToMigrate = preview.rows;

                    if (templatesToMigrate.length === 0) {
                        return {
                            success: true,
                            message: 'No templates found to migrate',
                            templatesMigrated: 0,
                            templates: []
                        };
                    }

                    // Step 2: Insert templates into policy_templates
                    await db.execute(sql`
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

                    // Step 3: Verify the migration
                    const verification = await db.execute(sql`
                        SELECT 
                            COUNT(*) as count
                        FROM policy_templates
                    `);

                    const totalTemplates = verification.rows[0]?.count || 0;

                    // Step 4: Get migrated templates
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

                    return {
                        success: true,
                        message: `Successfully migrated ${templatesToMigrate.length} templates`,
                        templatesMigrated: templatesToMigrate.length,
                        totalTemplates,
                        templates: migrated.rows
                    };

                } catch (error: any) {
                    console.error('Migration error:', error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Migration failed: ${error.message}`
                    });
                }
            }),
    });
};
