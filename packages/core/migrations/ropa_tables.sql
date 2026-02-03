-- ROPA Tables Migration
-- GDPR Article 30 - Records of Processing Activities

-- Create processing_activities table
CREATE TABLE IF NOT EXISTS processing_activities (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Basic Info
  activity_name TEXT NOT NULL,
  activity_id TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Controller/Processor Info
  role VARCHAR(50) NOT NULL,
  controller_name TEXT,
  controller_contact TEXT,
  dpo_name TEXT,
  dpo_contact TEXT,
  representative_name TEXT,
  representative_contact TEXT,
  
  -- Processing Details
  purposes JSON NOT NULL DEFAULT '[]',
  legal_basis VARCHAR(100) NOT NULL,
  
  -- Data Categories
  data_categories JSON NOT NULL DEFAULT '[]',
  data_subject_categories JSON NOT NULL DEFAULT '[]',
  special_categories JSON DEFAULT '[]',
  
  -- Recipients
  recipients JSON NOT NULL DEFAULT '[]',
  recipient_categories JSON DEFAULT '[]',
  
  -- International Transfers
  has_international_transfers BOOLEAN DEFAULT FALSE,
  transfer_countries JSON DEFAULT '[]',
  transfer_safeguards TEXT,
  transfer_details TEXT,
  
  -- Retention
  retention_period TEXT,
  retention_criteria TEXT,
  deletion_procedure TEXT,
  
  -- Security Measures
  technical_measures JSON DEFAULT '[]',
  organizational_measures JSON DEFAULT '[]',
  security_description TEXT,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  last_review_date TIMESTAMP,
  next_review_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pa_client ON processing_activities(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pa_activity_id ON processing_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_pa_status ON processing_activities(status);

-- Create processing_activity_vendors linking table
CREATE TABLE IF NOT EXISTS processing_activity_vendors (
  id SERIAL PRIMARY KEY,
  processing_activity_id INTEGER NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pav_pa ON processing_activity_vendors(processing_activity_id);
CREATE INDEX IF NOT EXISTS idx_pav_vendor ON processing_activity_vendors(vendor_id);

-- Create processing_activity_assets linking table
CREATE TABLE IF NOT EXISTS processing_activity_assets (
  id SERIAL PRIMARY KEY,
  processing_activity_id INTEGER NOT NULL REFERENCES processing_activities(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paa_pa ON processing_activity_assets(processing_activity_id);
CREATE INDEX IF NOT EXISTS idx_paa_asset ON processing_activity_assets(asset_id);
