-- Quotations Table Cleanup Script
-- This script migrates data from old fields to new fields and removes redundant fields

-- Step 1: Migrate data from old fields to new fields
UPDATE quotations 
SET 
    company_name = client_name,
    company_email = client_email,
    contact_person_email = client_contact_email
WHERE 
    (company_name IS NULL AND client_name IS NOT NULL)
    OR (company_email IS NULL AND client_email IS NOT NULL)
    OR (contact_person_email IS NULL AND client_contact_email IS NOT NULL);

-- Step 2: Remove redundant columns from quotations table
-- We'll remove the old client_* fields since we now have the new structure

ALTER TABLE quotations DROP COLUMN IF EXISTS client_name;
ALTER TABLE quotations DROP COLUMN IF EXISTS client_email;
ALTER TABLE quotations DROP COLUMN IF EXISTS client_contact_email;
ALTER TABLE quotations DROP COLUMN IF EXISTS client_contact_phone;

-- Step 3: Rename client_phone to contact_phone for consistency
ALTER TABLE quotations RENAME COLUMN client_phone TO contact_phone;

-- Step 4: Rename client_address to address for consistency
ALTER TABLE quotations RENAME COLUMN client_address TO address;

-- Step 5: Rename client_notes to notes for consistency
ALTER TABLE quotations RENAME COLUMN client_notes TO notes;

-- Step 6: Add comments to document the final structure
COMMENT ON COLUMN quotations.company_name IS 'Company name from quotation (matches clients.company_name)';
COMMENT ON COLUMN quotations.company_email IS 'Company email from quotation (matches clients.company_email)';
COMMENT ON COLUMN quotations.contact_person_name IS 'Contact person name from quotation';
COMMENT ON COLUMN quotations.contact_person_email IS 'Contact person email from quotation';
COMMENT ON COLUMN quotations.contact_phone IS 'Contact phone number from quotation';
COMMENT ON COLUMN quotations.mof_number IS 'MOF number from quotation';
COMMENT ON COLUMN quotations.address IS 'Address from quotation';
COMMENT ON COLUMN quotations.notes IS 'Notes from quotation';
COMMENT ON COLUMN quotations.terms_and_conditions IS 'Terms and conditions for the quotation';

-- Step 7: Verify the migration worked
-- This will show us the current structure after cleanup
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND table_schema = 'public'
AND column_name IN (
    'company_name', 'company_email', 'contact_person_name', 'contact_person_email',
    'contact_phone', 'mof_number', 'address', 'notes', 'terms_and_conditions'
)
ORDER BY column_name; 