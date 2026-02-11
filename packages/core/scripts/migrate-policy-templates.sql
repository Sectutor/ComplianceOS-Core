-- =====================================================
-- Policy Templates Migration Script
-- =====================================================
-- Purpose: Move policy templates from client_policies to policy_templates
-- Run this in your database client (Supabase SQL Editor, pgAdmin, etc.)
-- =====================================================

BEGIN;

-- Step 1: Preview what will be migrated
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
ORDER BY id;

-- Step 2: Insert templates into policy_templates table
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
ON CONFLICT (template_id) DO NOTHING;

-- Step 3: Verify the migration
SELECT 
  'Templates in policy_templates' as table_name,
  COUNT(*) as count
FROM policy_templates
UNION ALL
SELECT 
  'Templates remaining in client_policies' as table_name,
  COUNT(*) as count
FROM client_policies
WHERE client_id = 714 AND template_id IS NULL;

-- Step 4: Show migrated templates
SELECT 
  id,
  template_id,
  name,
  frameworks,
  is_public,
  created_at
FROM policy_templates
ORDER BY created_at DESC;

-- COMMIT or ROLLBACK
-- Review the results above before committing
-- If everything looks good, uncomment the next line:
-- COMMIT;

-- If something went wrong, uncomment the next line instead:
-- ROLLBACK;
