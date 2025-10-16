/*
  # Fix Posts Table RLS INSERT Policy

  1. Security Changes
    - Drop all existing policies on posts table
    - Create new INSERT policy allowing users to create posts with their own user_id
    - Create new SELECT policy for reading non-deleted posts
    - Create new UPDATE policy for users to update own posts and admins to update any

  2. Policy Details
    - INSERT: Users can only create posts where user_id matches their auth.uid()
    - SELECT: Anyone can read posts that are not deleted
    - UPDATE: Users can update own posts, admins/moderators can update any
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Admin and moderators can update posts" ON posts;

-- Create new INSERT policy
CREATE POLICY "Users can insert their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create new SELECT policy
CREATE POLICY "Users can read non-deleted posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Create new UPDATE policy
CREATE POLICY "Users can update posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    ))
  )
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    ))
  );