-- Create survey responses table for storing user answers

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL, -- References posts.id where post_type = 'anket'
    user_id uuid NOT NULL,
    question_index integer NOT NULL, -- Index of the question in the questions array
    question_text text NOT NULL,
    answer_text text, -- For text answers
    selected_option text, -- For multiple choice answers
    rating_value integer, -- For rating answers (1-5)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure one response per user per question per post
    UNIQUE(post_id, user_id, question_index)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_index ON survey_responses(question_index);

-- Disable RLS for now
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
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

-- Test the setup
SELECT 'survey_responses table created successfully' as status;

-- Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'survey_responses'
ORDER BY ordinal_position;






