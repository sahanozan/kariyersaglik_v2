-- Complete Survey System Fix
-- Copy and paste this entire code into Supabase Dashboard > SQL Editor
-- Then click "Run" button

-- ========================================
-- STEP 1: Fix Posts Table
-- ========================================

-- Add questions column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- Update post_type constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- ========================================
-- STEP 2: Create Survey Responses Table
-- ========================================

-- Drop existing table if exists
DROP TABLE IF EXISTS survey_responses CASCADE;

-- Create new table with correct structure
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

-- ========================================
-- STEP 3: Add Constraints and Indexes
-- ========================================

-- Unique constraint (one response per user per question)
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_user_question 
UNIQUE(post_id, user_id, question_index);

-- Performance indexes
CREATE INDEX idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- Posts table index for questions
CREATE INDEX IF NOT EXISTS idx_posts_questions ON posts USING GIN(questions) WHERE post_type = 'anket';

-- ========================================
-- STEP 4: Disable RLS (Row Level Security)
-- ========================================

ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: Test the Setup
-- ========================================

-- Test insert
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-post-123', gen_random_uuid(), 0, 'Test Question', 'Test Option');

-- Verify it worked
SELECT COUNT(*) as test_records FROM survey_responses WHERE post_id = 'test-post-123';

-- Clean up test data
DELETE FROM survey_responses WHERE post_id = 'test-post-123';

-- ========================================
-- STEP 6: Verification
-- ========================================

-- Show survey_responses table structure
SELECT 
    'survey_responses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show posts table has questions column
SELECT 
    'posts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
    AND table_schema = 'public'
    AND column_name = 'questions';

-- Final success message
SELECT '🎉 Survey system is ready! You can now create and answer surveys.' as final_status;






