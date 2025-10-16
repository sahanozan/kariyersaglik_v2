/*
  # Post Approval System for Events

  1. Database Changes
    - Add `is_approved` column to posts table (default true for non-events, false for events)
    - Add `approved_by` column to track who approved the post
    - Add `approved_at` column to track when it was approved
    - Update RLS policies to only show approved posts to regular users
    - Allow admins and moderators to see all posts for approval

  2. Security
    - Only approved posts are visible to regular users
    - Admins and moderators can see pending posts for approval
    - Only admins and moderators can approve posts
    - Events require approval, other posts are auto-approved
*/

-- Add approval columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_approved boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Update existing posts to be approved (except events)
UPDATE posts 
SET is_approved = true, approved_at = created_at
WHERE post_type != 'etkinlik' OR post_type IS NULL;

-- Set events to require approval
UPDATE posts 
SET is_approved = false, approved_at = NULL
WHERE post_type = 'etkinlik';

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

-- Create new policies with approval system
CREATE POLICY "Users can read approved posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    is_approved = true 
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins and moderators can read all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      (post_type != 'etkinlik' AND is_approved = true) OR
      (post_type = 'etkinlik' AND is_approved = false)
    )
  );

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    deleted_at IS NULL
  )
  WITH CHECK (
    user_id = auth.uid() AND
    deleted_at IS NULL
  );

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    deleted_at IS NULL
  );

CREATE POLICY "Admins can delete any post"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
    AND deleted_at IS NULL
  );

-- Create function to approve post
CREATE OR REPLACE FUNCTION approve_post(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND is_blocked = false
  ) THEN
    RAISE EXCEPTION 'Only admins and moderators can approve posts';
  END IF;

  -- Update post
  UPDATE posts
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Create function to reject post
CREATE OR REPLACE FUNCTION reject_post(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND is_blocked = false
  ) THEN
    RAISE EXCEPTION 'Only admins and moderators can reject posts';
  END IF;

  -- Soft delete the post
  UPDATE posts
  SET 
    deleted_at = now(),
    deleted_by = auth.uid()
  WHERE id = post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;
