-- Check if likes table exists and its structure
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Check if table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'likes';

-- 2. If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'likes'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'likes';

-- 4. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'likes';

-- 5. Test insert (will be removed automatically)
INSERT INTO likes (post_id, user_id)
VALUES ('test-123', gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 6. Verify insert worked
SELECT COUNT(*) as test_count FROM likes WHERE post_id = 'test-123';

-- 7. Clean up test data
DELETE FROM likes WHERE post_id = 'test-123';
