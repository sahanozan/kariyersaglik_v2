/*
  # Fix posts deletion for admin and moderators

  1. Security Updates
    - Drop existing conflicting policies
    - Create new comprehensive policies for posts table
    - Add helper functions for role checking
    - Enable proper UPDATE permissions for soft deletion

  2. Policy Changes
    - Users can read all non-deleted posts
    - Users can create their own posts
    - Users can update their own posts
    - Admins and moderators can update any post (for deletion)
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can read all posts" ON posts;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage posts
CREATE OR REPLACE FUNCTION can_manage_posts()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for reading posts
CREATE POLICY "Anyone can read non-deleted posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy for creating posts
CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for updating posts (including soft deletion)
CREATE POLICY "Users can update own posts, admins can update any"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR can_manage_posts()
  )
  WITH CHECK (
    user_id = auth.uid() OR can_manage_posts()
  );