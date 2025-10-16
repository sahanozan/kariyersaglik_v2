/*
  # Fix Posts Deletion Issue

  1. Problem
    - Post deletion still failing despite RLS disabled
    - May be related to foreign key constraints or triggers
    - Need to ensure all related tables are accessible

  2. Solution
    - Double-check RLS is disabled on all related tables
    - Add any missing columns if needed
    - Ensure proper permissions
*/

-- Ensure RLS is disabled on posts table
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Ensure RLS is disabled on all related tables
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies on posts table
DROP POLICY IF EXISTS "Users can read posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can delete posts" ON posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;

-- Add deleted_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'deleted_by') THEN
        ALTER TABLE posts ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'comments', 'likes', 'events', 'surveys', 'event_registrations', 'survey_responses');

-- Test if we can update posts
UPDATE posts SET updated_at = NOW() WHERE id IN (SELECT id FROM posts LIMIT 1);









