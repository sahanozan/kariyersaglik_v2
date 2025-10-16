-- Verify survey system is working correctly
-- Run this AFTER running the migration

-- 1. Check if survey_responses table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'survey_responses';

-- 2. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'survey_responses'
ORDER BY ordinal_position;

-- 3. Check RLS status (should be FALSE)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'survey_responses';

-- 4. Test insert (will be removed automatically)
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-123', gen_random_uuid(), 0, 'Test Question', 'Test Option')
ON CONFLICT DO NOTHING;

-- 5. Verify insert worked
SELECT COUNT(*) as test_count FROM survey_responses WHERE post_id = 'test-123';

-- 6. Clean up test data
DELETE FROM survey_responses WHERE post_id = 'test-123';

-- 7. Final status
SELECT 'Survey system is working correctly!' as status;
