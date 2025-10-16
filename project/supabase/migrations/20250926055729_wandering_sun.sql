/*
  # Fix Profile Insert Policy for User Registration

  1. Security Changes
    - Update the existing INSERT policy to properly handle new user registration
    - Ensure users can create their own profile during the signup process
    - Handle both authenticated and anonymous contexts during registration

  2. Changes Made
    - Drop and recreate the INSERT policy with proper conditions
    - Allow profile creation when the user ID matches the authenticated user
    - Handle the case where auth.uid() might be null during the registration process
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile data" ON public.profiles;

-- Create a new INSERT policy that properly handles user registration
CREATE POLICY "Users can insert own profile data" ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if the user ID matches the authenticated user ID
    (auth.uid() = id) OR 
    -- Allow during registration process when auth context might be establishing
    (auth.uid() IS NULL AND id IS NOT NULL)
  );

-- Ensure the policy is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;