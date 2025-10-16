/*
  # Fix posts table INSERT policy

  1. Security Updates
    - Drop existing INSERT policy for posts table
    - Create new INSERT policy that properly allows authenticated users to create posts
    - Ensure the policy checks that user_id matches auth.uid()

  2. Changes
    - Remove any conflicting INSERT policies
    - Add comprehensive INSERT policy for authenticated users
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;

-- Create new INSERT policy that allows authenticated users to create posts
CREATE POLICY "Users can insert their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);