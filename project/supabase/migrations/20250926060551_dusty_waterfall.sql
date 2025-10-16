/*
  # Fix Profiles RLS Policy for User Registration

  1. Security Changes
    - Drop all existing INSERT policies on profiles table
    - Create a comprehensive INSERT policy that allows authenticated users to create their own profiles
    - Ensure the policy works during the registration flow

  2. Policy Details
    - Allow authenticated users to insert profiles where auth.uid() matches the id
    - Handle edge cases during registration process
*/

-- Drop all existing INSERT policies on profiles table
DROP POLICY IF EXISTS "Allow profile creation during registration" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile during registration" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous profile creation during registration" ON profiles;

-- Create a comprehensive INSERT policy for authenticated users
CREATE POLICY "authenticated_users_can_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;