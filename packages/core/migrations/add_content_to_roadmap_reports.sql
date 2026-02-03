-- Migration to add content column to roadmap_reports table
-- This allows reports to have editable HTML content like policies

ALTER TABLE roadmap_reports 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update existing reports with a basic content template
UPDATE roadmap_reports 
SET content = CONCAT(
    '<h1>', title, '</h1>',
    '<p><strong>Version:</strong> ', COALESCE(version, ''draft''), '</p>',
    '<p><strong>Generated:</strong> ', TO_CHAR(generated_at, ''YYYY-MM-DD HH24:MI:SS''), '</p>',
    '<hr>',
    '<h2>Report Content</h2>',
    '<p>This report was generated as a DOCX/PDF file. You can now edit it here in the rich text editor.</p>',
    '<p>Changes you make will be saved as HTML content in the database.</p>',
    '<p>You can still download the original generated file using the "Download Original" button.</p>'
)
WHERE content IS NULL;