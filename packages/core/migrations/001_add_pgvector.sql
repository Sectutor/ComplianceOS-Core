-- Migration: Add pgvector extension and migrate embeddings to vector type
-- Run this migration with appropriate database admin privileges

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure table has required columns (sync with schema.ts)
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS client_id integer;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS doc_id varchar(100);
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS doc_type varchar(50);
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Step 2: Add new vector column to embeddings table
ALTER TABLE embeddings 
ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Step 3: Migrate existing JSON data to vector format
-- This assumes embedding_data contains JSON arrays of floats
UPDATE embeddings 
SET embedding_vector = embedding_data::text::vector
WHERE embedding_data IS NOT NULL 
  AND embedding_vector IS NULL;

-- Step 4: Create indexes for vector similarity search
-- Using IVFFlat for good balance of speed and accuracy
CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
ON embeddings 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (better recall, more memory)
-- CREATE INDEX IF NOT EXISTS embeddings_vector_hnsw_idx 
-- ON embeddings 
-- USING hnsw (embedding_vector vector_cosine_ops);

-- Step 5: Add index on common query patterns
CREATE INDEX IF NOT EXISTS embeddings_client_type_idx 
ON embeddings (client_id, doc_type);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN embeddings.embedding_vector IS 'Vector embedding for semantic search (1536 dimensions for OpenAI text-embedding-ada-002)';
COMMENT ON INDEX embeddings_vector_idx IS 'IVFFlat index for fast cosine similarity search on embeddings';

-- Step 7: Verify migration
-- Run this to check the migration worked:
-- SELECT COUNT(*) as total, 
--        COUNT(embedding_vector) as migrated,
--        COUNT(*) - COUNT(embedding_vector) as pending
-- FROM embeddings;
