-- Password Storage Migration
-- This script creates a table to store original passwords for clients
-- This replaces the in-memory cache system with a persistent database solution

-- Create password_storage table
CREATE TABLE IF NOT EXISTS password_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- Add unique constraint to ensure one password per client
ALTER TABLE password_storage ADD CONSTRAINT password_storage_client_id_key UNIQUE (client_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_password_storage_client_id ON password_storage(client_id);
CREATE INDEX IF NOT EXISTS idx_password_storage_expires_at ON password_storage(expires_at);

-- Add comments
COMMENT ON TABLE password_storage IS 'Stores original passwords for clients with expiration';
COMMENT ON COLUMN password_storage.client_id IS 'Reference to the client';
COMMENT ON COLUMN password_storage.email IS 'Email address used for login';
COMMENT ON COLUMN password_storage.password_hash IS 'Hashed version of the original password';
COMMENT ON COLUMN password_storage.expires_at IS 'When the password record expires (30 days from creation)';

-- Create function to clean up expired passwords
CREATE OR REPLACE FUNCTION cleanup_expired_passwords()
RETURNS void AS $$
BEGIN
    DELETE FROM password_storage WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired passwords (optional)
-- This would need to be set up in your database scheduler
-- For now, we'll rely on manual cleanup or application-level cleanup 