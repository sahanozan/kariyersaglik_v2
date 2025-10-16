-- Add questions column to posts table
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add questions column to posts table if not exists
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 2. Update post_type constraint to include anket
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- 3. Create index for questions column
CREATE INDEX IF NOT EXISTS idx_posts_questions ON posts USING GIN(questions) WHERE post_type = 'anket';

-- 4. Verify posts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
    AND table_schema = 'public'
    AND column_name IN ('questions', 'post_type', 'id')
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Posts table updated for surveys!' as status;






