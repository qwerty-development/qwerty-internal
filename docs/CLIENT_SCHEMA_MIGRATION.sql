-- Client Schema Migration
-- This script modifies the clients and quotations tables to support the new client structure
-- with Company Name as main identifier, Contact Person fields, and MOF Number

-- Step 1: Modify clients table
-- First, we need to handle the unique constraint on 'name' before renaming
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_name_key;

-- Rename existing columns
ALTER TABLE clients RENAME COLUMN name TO company_name;
ALTER TABLE clients RENAME COLUMN contact_email TO company_email;

-- Add new columns
ALTER TABLE clients ADD COLUMN contact_person_name text;
ALTER TABLE clients ADD COLUMN contact_person_email text;
ALTER TABLE clients ADD COLUMN mof_number text;

-- Add unique constraint on company_name
ALTER TABLE clients ADD CONSTRAINT clients_company_name_key UNIQUE (company_name);

-- Step 2: Modify quotations table
-- Add terms and conditions field
ALTER TABLE quotations ADD COLUMN terms_and_conditions text;

-- Update client-related fields to match new structure
-- First, we'll add the new fields
ALTER TABLE quotations ADD COLUMN company_name text;
ALTER TABLE quotations ADD COLUMN company_email text;
ALTER TABLE quotations ADD COLUMN contact_person_name text;
ALTER TABLE quotations ADD COLUMN contact_person_email text;
ALTER TABLE quotations ADD COLUMN mof_number text;

-- We'll keep the existing client_* fields for backward compatibility during migration
-- but we'll add comments to indicate they're deprecated

-- Add comments to document the changes
COMMENT ON COLUMN clients.company_name IS 'Main company name (previously "name")';
COMMENT ON COLUMN clients.company_email IS 'Main company email (previously "contact_email")';
COMMENT ON COLUMN clients.contact_person_name IS 'Name of the primary contact person';
COMMENT ON COLUMN clients.contact_person_email IS 'Email of the primary contact person';
COMMENT ON COLUMN clients.mof_number IS 'MOF (Ministry of Finance) registration number';

COMMENT ON COLUMN quotations.terms_and_conditions IS 'Terms and conditions for the quotation';
COMMENT ON COLUMN quotations.company_name IS 'Company name from quotation (matches clients.company_name)';
COMMENT ON COLUMN quotations.company_email IS 'Company email from quotation (matches clients.company_email)';
COMMENT ON COLUMN quotations.contact_person_name IS 'Contact person name from quotation';
COMMENT ON COLUMN quotations.contact_person_email IS 'Contact person email from quotation';
COMMENT ON COLUMN quotations.mof_number IS 'MOF number from quotation';

-- Add comments to existing deprecated fields
COMMENT ON COLUMN quotations.client_name IS 'DEPRECATED: Use company_name instead';
COMMENT ON COLUMN quotations.client_email IS 'DEPRECATED: Use company_email instead';
COMMENT ON COLUMN quotations.client_contact_email IS 'DEPRECATED: Use contact_person_email instead'; 