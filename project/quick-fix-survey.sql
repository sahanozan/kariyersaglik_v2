-- Quick fix for survey responses table

-- 1. Create survey_responses table (simple version)
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
    updated_at timestamptz DEFAULT now()
);

-- 2. Create unique constraint (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'survey_responses_unique_response'
    ) THEN
        ALTER TABLE survey_responses 
        ADD CONSTRAINT survey_responses_unique_response 
        UNIQUE(post_id, user_id, question_index);
    END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- 4. Disable RLS
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 5. Also ensure posts table has questions column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 6. Test query
SELECT 'Survey system ready!' as status;

-- 7. Show table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'survey_responses'
ORDER BY ordinal_position;






