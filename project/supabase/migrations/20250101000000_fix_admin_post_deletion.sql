/*
  # Fix Admin Post Deletion RLS Policy

  Problem:
  - Admin users getting "new row violates row-level security policy" error
  - Code: 42501
  - RLS policy not properly allowing admin updates for post deletion

  Solution:
  - Drop conflicting policies
  - Create comprehensive policy that allows admin/moderator post updates
  - Ensure proper WITH CHECK clause for security
*/

-- Drop all existing policies on posts table
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;

-- Create comprehensive policies

-- 1. INSERT policy - Users can create their own posts
CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. SELECT policy - Anyone can read non-deleted posts
CREATE POLICY "Anyone can read non-deleted posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- 3. UPDATE policy - Users can update own posts, admins can update any
CREATE POLICY "Users can update own posts, admins can update any"
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
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
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
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
    ))
  );

-- 4. DELETE policy - Users can delete own posts, admins can delete any
CREATE POLICY "Users can delete own posts, admins can delete any"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    -- Users can delete their own posts
    (auth.uid() = user_id) OR 
    -- Admins and moderators can delete any post
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
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
    AND (is_blocked = false OR is_blocked IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND (is_blocked = false OR is_blocked IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is moderator
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'moderator'
    AND (is_blocked = false OR is_blocked IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function to verify permissions
CREATE OR REPLACE FUNCTION test_post_permissions(post_id uuid)
RETURNS TABLE(
  can_read boolean,
  can_update boolean,
  can_delete boolean,
  user_role text,
  is_owner boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Can read if post is not deleted
    (p.deleted_at IS NULL) as can_read,
    -- Can update if owner or admin/moderator
    (p.user_id = auth.uid() OR can_manage_posts()) as can_update,
    -- Can delete if owner or admin/moderator
    (p.user_id = auth.uid() OR can_manage_posts()) as can_delete,
    -- User role
    COALESCE(prof.role, 'user') as user_role,
    -- Is owner
    (p.user_id = auth.uid()) as is_owner
  FROM posts p
  LEFT JOIN profiles prof ON prof.id = auth.uid()
  WHERE p.id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

