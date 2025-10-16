/*
  # Fix post deletion for admins and moderators

  1. Security Updates
    - Update RLS policy to allow admins and moderators to delete posts
    - Ensure proper permissions for post management
    - Add proper WITH CHECK clause for security

  2. Policy Changes
    - Remove old conflicting policies
    - Add comprehensive policy for post updates including deletion
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

-- Create new comprehensive update policy
CREATE POLICY "Users and admins can update posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Ensure the helper functions exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_posts()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;