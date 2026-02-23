-- Migration to add missing columns to federal_fisma_systems table
-- Run this migration to add acronym, owner, controlsCount, and assetsCount columns

ALTER TABLE federal_fisma_systems 
ADD COLUMN IF NOT EXISTS acronym VARCHAR(20),
ADD COLUMN IF NOT EXISTS owner VARCHAR(255),
ADD COLUMN IF NOT EXISTS controls_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assets_count INTEGER DEFAULT 0;
