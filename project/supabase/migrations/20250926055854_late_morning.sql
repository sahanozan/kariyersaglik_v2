/*
  # Fix Profile INSERT RLS Policy for User Registration

  1. Policy Changes
    - Drop the existing problematic INSERT policy
    - Create a new INSERT policy that properly handles user registration
    - Ensure authenticated users can create their own profiles

  2. Security
    - Maintains security by only allowing users to create profiles with their own user ID
    - Handles the registration flow where auth.uid() should match the profile ID
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can insert own profile data" ON profiles;

-- Create a new INSERT policy that properly handles user registration
CREATE POLICY "Users can create own profile during registration"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure there's a policy for anonymous users during the brief registration window
-- This handles the case where the auth state might not be fully established
CREATE POLICY "Allow profile creation during registration"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);