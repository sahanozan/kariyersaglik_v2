-- Manual Survey Table Creation
-- Run this if no survey response table exists

-- Create the survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
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

-- Add unique constraint
ALTER TABLE survey_responses 
ADD CONSTRAINT IF NOT EXISTS survey_responses_unique_response 
UNIQUE(post_id, user_id, question_index);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- Disable RLS
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-post', gen_random_uuid(), 0, 'Test Question', 'Test Option')
ON CONFLICT (post_id, user_id, question_index) DO NOTHING;

-- Verify
SELECT COUNT(*) as test_count FROM survey_responses WHERE post_id = 'test-post';

-- Clean up test
DELETE FROM survey_responses WHERE post_id = 'test-post';

-- Final verification
SELECT 'Survey responses table ready!' as status;






