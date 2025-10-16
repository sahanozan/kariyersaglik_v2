-- Simple Survey Table Creation
-- Try running these commands one by one in Supabase Dashboard

-- 1. First, just create the basic table
CREATE TABLE survey_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    question_index integer NOT NULL,
    question_text text NOT NULL,
    selected_option text,
    rating_value integer,
    answer_text text,
    created_at timestamptz DEFAULT now()
);

-- 2. Add the unique constraint (run separately)
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_response 
UNIQUE(post_id, user_id, question_index);

-- 3. Disable RLS (run separately)
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 4. Add questions column to posts (run separately)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';






