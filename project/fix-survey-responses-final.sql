-- Final fix for survey responses system
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Drop existing table if exists
DROP TABLE IF EXISTS survey_responses CASCADE;

-- 2. Create survey_responses table with correct structure
CREATE TABLE survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    question_index integer NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    selected_option text,
    rating_value integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create unique constraint (one response per user per question)
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_response 
UNIQUE(post_id, user_id, question_index);

-- 4. Create indexes for performance
CREATE INDEX idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- 5. Disable RLS for survey_responses
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 6. Ensure posts table has questions column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 7. Create a function to get survey results
CREATE OR REPLACE FUNCTION get_survey_results(survey_post_id text)
RETURNS TABLE (
    question_index integer,
    question_text text,
    option_text text,
    response_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.question_index,
        sr.question_text,
        COALESCE(sr.selected_option, sr.rating_value::text, 'Text Response') as option_text,
        COUNT(*) as response_count
    FROM survey_responses sr
    WHERE sr.post_id = survey_post_id
    GROUP BY sr.question_index, sr.question_text, sr.selected_option, sr.rating_value
    ORDER BY sr.question_index, response_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Test the setup
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-post', (SELECT id FROM profiles LIMIT 1), 0, 'Test Question', 'Test Option')
ON CONFLICT (post_id, user_id, question_index) DO NOTHING;

-- 9. Verify the setup
SELECT 
    'survey_responses table' as component,
    COUNT(*) as record_count
FROM survey_responses
UNION ALL
SELECT 
    'posts with questions' as component,
    COUNT(*) as record_count
FROM posts 
WHERE questions IS NOT NULL AND post_type = 'anket';

-- 10. Show table structure
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
SELECT '✅ Survey responses system ready!' as status;






