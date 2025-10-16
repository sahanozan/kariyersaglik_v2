-- Add push_token column to profiles table for push notifications

-- Add push_token column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.push_token IS 'Expo push token for mobile notifications';


