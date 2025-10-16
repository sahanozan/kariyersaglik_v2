-- Add terms acceptance tracking to profiles table

-- Add new columns for terms acceptance tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_ip_address INET;

-- Add comments for documentation
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted terms and conditions';
COMMENT ON COLUMN profiles.terms_version IS 'Version of terms and conditions accepted by user';
COMMENT ON COLUMN profiles.terms_ip_address IS 'IP address from which terms were accepted';

-- Create index for better performance on terms queries
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at ON profiles(terms_accepted_at) WHERE terms_accepted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_terms_version ON profiles(terms_version) WHERE terms_version IS NOT NULL;

-- Update existing users to have default terms acceptance (optional)
-- Uncomment the following lines if you want to set default values for existing users
-- UPDATE profiles 
-- SET 
--   terms_accepted_at = created_at,
--   terms_version = 'v1.0'
-- WHERE terms_accepted_at IS NULL;
