/*
  # Fix Posts RLS Policy for Admin/Moderator Post Deletion

  1. Problem
    - RLS policy is blocking admin/moderator post updates
    - Error: "new row violates row-level security policy for table posts"
    - Code: 42501

  2. Solution
    - Drop existing conflicting policies
    - Create new comprehensive policy that allows admin/moderator updates
    - Ensure proper WITH CHECK clause for security

  3. Security
    - Users can only update their own posts
    - Admins and moderators can update any post
    - Maintain RLS protection
*/

-- Drop all existing policies on posts table
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;

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

-- Create new UPDATE policy that allows admin/moderator updates
CREATE POLICY "Users and admins can update posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own posts
    (auth.uid() = user_id) OR 
    -- Admins and moderators can update any post
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    ))
  )
  WITH CHECK (
    -- Users can update their own posts
    (auth.uid() = user_id) OR 
    -- Admins and moderators can update any post
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    ))
  );

-- Ensure helper functions exist and are up to date
CREATE OR REPLACE FUNCTION can_manage_posts()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
    AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the policy by creating a test function
CREATE OR REPLACE FUNCTION test_post_update_permission(post_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = post_id
    AND (
      p.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'moderator')
        AND profiles.is_blocked = false
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
