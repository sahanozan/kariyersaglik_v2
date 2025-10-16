/*
  # Fix Profiles RLS Policy - Final Solution

  1. Security
    - Drop all existing INSERT policies that might be conflicting
    - Create a single, clear INSERT policy for authenticated users
    - Ensure the policy allows users to create their own profile during registration

  This migration ensures that authenticated users can create their profile
  during the registration process without RLS violations.
*/

-- Drop all existing INSERT policies on profiles table
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile during registration" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous profile creation during registration" ON profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;

-- Create a single, clear INSERT policy for authenticated users
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;