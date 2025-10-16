-- Manual migration to add event columns to posts table
-- Copy and paste this SQL into Supabase Dashboard > SQL Editor

-- 1. Update post_type constraint to include 'etkinlik' and 'anket'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- 2. Add event-related columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;

-- 3. Add survey-related column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date) WHERE post_type = 'etkinlik';
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- 5. Ensure RLS is disabled
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

-- 7. Test query to verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('event_date', 'event_time', 'event_location', 'max_participants', 'registration_deadline', 'questions')
ORDER BY column_name;






