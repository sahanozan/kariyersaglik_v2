/*
  # Fix User Registration System

  1. Database Functions
    - Update handle_new_user function to work with email confirmation disabled
    - Ensure proper profile creation on signup

  2. Security
    - Update RLS policies for profile creation
    - Ensure new users can create their own profiles

  3. Triggers
    - Fix profile creation trigger
*/

-- Update the handle_new_user function to work without email confirmation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    branch,
    city,
    institution,
    phone,
    role,
    is_blocked,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution', ''),
    NEW.raw_user_meta_data->>'phone',
    'user',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policy to allow profile creation during signup
DROP POLICY IF EXISTS "Users can insert own profile data" ON profiles;
CREATE POLICY "Users can insert own profile data"
  ON profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = id) OR 
    (auth.uid() IS NULL AND id IS NOT NULL)
  );

-- Ensure profiles table has proper constraints
ALTER TABLE profiles 
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET DEFAULT '',
  ALTER COLUMN branch SET DEFAULT '',
  ALTER COLUMN city SET DEFAULT '',
  ALTER COLUMN institution SET DEFAULT '';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles(email);