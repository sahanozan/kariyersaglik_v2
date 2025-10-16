-- Emergency fix for survey_responses table
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Drop existing table completely (if exists)
DROP TABLE IF EXISTS survey_responses CASCADE;

-- 2. Create survey_responses table from scratch with correct structure
CREATE TABLE survey_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 3. Create unique constraint
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_user_question 
UNIQUE(post_id, user_id, question_index);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- 5. Disable RLS
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 6. Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Test insert (will be removed automatically)
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-123', gen_random_uuid(), 0, 'Test Question', 'Test Option');

-- 8. Verify insert worked
SELECT COUNT(*) as test_count FROM survey_responses WHERE post_id = 'test-123';

-- 9. Clean up test data
DELETE FROM survey_responses WHERE post_id = 'test-123';

-- Success message
SELECT '✅ Survey responses table created successfully!' as status;






