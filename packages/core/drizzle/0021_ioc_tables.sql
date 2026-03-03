-- Migration to create IOC (Indicators of Compromise) tables for threat intelligence
-- Run this migration to add IOC management capabilities

-- Create IOC Records table
CREATE TABLE IF NOT EXISTS ioc_records (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    indicator VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reputation VARCHAR(20),
    confidence INTEGER,
    source VARCHAR(100),
    source_ref VARCHAR(500),
    enrichment JSONB,
    cve_ids JSONB,
    mitre_techniques JSONB,
    mitre_groups JSONB,
    tags JSONB,
    category VARCHAR(100),
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    last_enriched TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    is_manual BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Create indexes for IOC Records
CREATE INDEX IF NOT EXISTS idx_ioc_indicator ON ioc_records(indicator);
CREATE INDEX IF NOT EXISTS idx_ioc_type ON ioc_records(type);
CREATE INDEX IF NOT EXISTS idx_ioc_reputation ON ioc_records(reputation);
CREATE INDEX IF NOT EXISTS idx_ioc_client_id ON ioc_records(client_id);
CREATE INDEX IF NOT EXISTS idx_ioc_status ON ioc_records(status);

-- Create IOC Enrichment History table
CREATE TABLE IF NOT EXISTS ioc_enrichment_history (
    id SERIAL PRIMARY KEY,
    ioc_id INTEGER REFERENCES ioc_records(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    result JSONB,
    enriched_at TIMESTAMP DEFAULT NOW()
);

-- Create index for IOC Enrichment History
CREATE INDEX IF NOT EXISTS idx_ioc_enrichment_ioc_id ON ioc_enrichment_history(ioc_id);

-- Create IOC Export History table
CREATE TABLE IF NOT EXISTS ioc_export_history (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    format VARCHAR(20),
    filters JSONB,
    ioc_count INTEGER,
    exported_by INTEGER REFERENCES users(id),
    exported_at TIMESTAMP DEFAULT NOW()
);

-- Create index for IOC Export History
CREATE INDEX IF NOT EXISTS idx_ioc_export_client_id ON ioc_export_history(client_id);

COMMENT ON TABLE ioc_records IS 'Stores Indicators of Compromise (IOCs) for threat intelligence management';
COMMENT ON TABLE ioc_enrichment_history IS 'Tracks enrichment API calls for IOCs';
COMMENT ON TABLE ioc_export_history IS 'Audit log for IOC exports';
