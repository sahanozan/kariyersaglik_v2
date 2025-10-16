/*
  # Fix Profiles RLS for Admin Stats

  1. Problem
    - Admin stats not showing real data
    - RLS policies might be blocking admin queries
    - Need to ensure admins can read all profiles for statistics

  2. Solution
    - Ensure RLS is disabled on profiles table
    - Add specific policies for admin stats if needed
    - Verify admin can access all profile data
*/

-- Ensure RLS is disabled on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Test if we can count profiles
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as moderator_profiles FROM profiles WHERE role = 'moderator' AND is_blocked = false;
SELECT COUNT(*) as blocked_profiles FROM profiles WHERE is_blocked = true;









