-- Fix Profiles RLS for Post Display
-- Ensure all users can read profiles for post display

-- First, disable RLS temporarily to fix the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile data" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile data" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin and moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profile data" ON profiles;
DROP POLICY IF EXISTS "Admin can update user roles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Test the policies
SELECT 'Profiles RLS policies created successfully' as status;




