
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS brand_primary_color varchar(20),
ADD COLUMN IF NOT EXISTS brand_secondary_color varchar(20),
ADD COLUMN IF NOT EXISTS portal_title varchar(255);
