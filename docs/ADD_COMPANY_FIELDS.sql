-- Add company name and company email fields to clients table
-- These fields will be optional and not have any RLS constraints

ALTER TABLE clients 
ADD COLUMN company_name text,
ADD COLUMN company_email text;

-- Add comments to document the new fields
COMMENT ON COLUMN clients.company_name IS 'Optional company name for the client';
COMMENT ON COLUMN clients.company_email IS 'Optional company email for the client';

-- Note: No RLS policies are needed as requested
-- These fields are optional and will be NULL by default 