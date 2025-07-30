-- Add hasChangedPass column to password_storage table
-- This column tracks whether a user has changed their initial password

-- Check if column exists and add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'password_storage' 
        AND column_name = 'hasChangedPass'
    ) THEN
        ALTER TABLE password_storage 
        ADD COLUMN hasChangedPass BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Column hasChangedPass added to password_storage table';
    ELSE
        RAISE NOTICE 'Column hasChangedPass already exists in password_storage table';
    END IF;
END $$;

-- Update existing records to have hasChangedPass = false if they don't have a value
UPDATE password_storage 
SET hasChangedPass = false 
WHERE hasChangedPass IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'password_storage'
ORDER BY ordinal_position;
