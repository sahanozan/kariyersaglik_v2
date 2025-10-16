-- Create survey_responses table if it doesn't exist
-- This migration ensures the survey system works properly

-- 1. Create survey_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    question_index integer NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    selected_option text,
    rating_value integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure one response per user per question per post
    UNIQUE(post_id, user_id, question_index)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_index ON survey_responses(question_index);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);

-- 3. Disable RLS completely for survey_responses
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies (if any)
DROP POLICY IF EXISTS "Users can read own responses" ON survey_responses;
DROP POLICY IF EXISTS "Survey creators can read responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can create responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can read survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can insert survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can update own survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can delete own survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Admins can manage all survey responses" ON survey_responses;

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_survey_responses_updated_at ON survey_responses;
CREATE TRIGGER update_survey_responses_updated_at
    BEFORE UPDATE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Test the setup
SELECT 'Survey responses table created successfully' as status;

-- 7. Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'survey_responses'
ORDER BY ordinal_position;

-- 8. Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'survey_responses';
