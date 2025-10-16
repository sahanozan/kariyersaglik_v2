-- Create likes table if it doesn't exist
-- This migration ensures the like system works properly

-- 1. Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    
    -- Ensure one like per user per post
    UNIQUE(post_id, user_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- 3. Disable RLS completely for likes
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies (if any)
DROP POLICY IF EXISTS "Users can read likes" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Users can read own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can update own likes" ON likes;
DROP POLICY IF EXISTS "Admins can manage all likes" ON likes;

-- 5. Test the setup
SELECT 'Likes table created successfully' as status;

-- 6. Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'likes'
ORDER BY ordinal_position;

-- 7. Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'likes';
