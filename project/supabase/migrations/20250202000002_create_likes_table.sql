/*
  # Create Likes Table
  
  1. Problem
    - Likes table is missing in Supabase
    - Posts feature trying to access non-existent table
    - Error: "Could not find the table 'public.likes'"
    
  2. Solution
    - Create likes table with proper structure
    - Add foreign key relationships
    - Disable RLS for consistency
    - Add indexes for performance
*/

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one like per user per post
  UNIQUE(user_id, post_id)
);

-- Disable RLS for consistency with other tables
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Grant permissions
GRANT ALL ON likes TO authenticated;
GRANT ALL ON likes TO anon;

-- Create comments table if it doesn't exist (often used with likes)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Disable RLS for comments too
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);

-- Grant permissions for comments
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comments TO anon;






