-- Final Survey Fix - Run this in Supabase Dashboard
-- This will ensure the survey system works properly

-- 1. Drop any existing survey tables to start fresh
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS anket_yanıtları CASCADE;

-- 2. Create the survey_responses table with correct structure
CREATE TABLE survey_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    question_index integer NOT NULL,
    question_text text NOT NULL,
    selected_option text,
    rating_value integer,
    answer_text text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Add unique constraint (one response per user per question)
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_user_question 
UNIQUE(post_id, user_id, question_index);

-- 4. Create indexes for performance
CREATE INDEX idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- 5. Disable RLS completely
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 6. Ensure posts table has questions column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 7. Test the table with a sample insert
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-post-123', gen_random_uuid(), 0, 'Test Question', 'Test Option');

-- 8. Verify the insert worked
SELECT COUNT(*) as test_count FROM survey_responses WHERE post_id = 'test-post-123';

-- 9. Clean up test data
DELETE FROM survey_responses WHERE post_id = 'test-post-123';

-- 10. Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT '🎉 Survey system is now ready! You can create and answer surveys.' as final_status;






