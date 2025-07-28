-- Branding Settings Table Migration
-- This table stores company branding settings for PDF generation

CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'QWERTY',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  primary_color TEXT NOT NULL DEFAULT '#01303F',
  secondary_color TEXT DEFAULT '#014a5f',
  accent_color TEXT DEFAULT '#059669',
  font_family TEXT DEFAULT 'Arial, sans-serif',
  logo_url TEXT,
  footer_text TEXT DEFAULT 'Thank you for your business!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branding_settings_updated_at
  BEFORE UPDATE ON branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding settings
INSERT INTO branding_settings (
  company_name,
  company_address,
  company_phone,
  company_email,
  company_website,
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  logo_url,
  footer_text
) VALUES (
  'QWERTY',
  '',
  '',
  '',
  '',
  '#01303F',
  '#014a5f',
  '#059669',
  'Arial, sans-serif',
  '',
  'Thank you for your business!'
) ON CONFLICT DO NOTHING;

-- Add RLS (Row Level Security) policies
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read branding settings
CREATE POLICY "Admins can read branding settings" ON branding_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to insert branding settings
CREATE POLICY "Admins can insert branding settings" ON branding_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to update branding settings
CREATE POLICY "Admins can update branding settings" ON branding_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to delete branding settings
CREATE POLICY "Admins can delete branding settings" ON branding_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  ); 