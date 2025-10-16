-- Complete Survey System Setup for Kariyer Sağlık App
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create survey_responses table
DROP TABLE IF EXISTS survey_responses CASCADE;

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

-- 2. Add constraints and indexes
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_unique_response 
UNIQUE(post_id, user_id, question_index);

CREATE INDEX idx_survey_responses_post_id ON survey_responses(post_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- 3. Disable RLS for survey_responses
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- 4. Ensure posts table has all required columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;

-- 5. Update post_type constraint to include all types
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date) WHERE post_type = 'etkinlik';
CREATE INDEX IF NOT EXISTS idx_posts_questions ON posts USING GIN(questions) WHERE post_type = 'anket';

-- 7. Ensure likes and comments tables exist
CREATE TABLE IF NOT EXISTS likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 8. Disable RLS for all tables
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 9. Create event_registrations table (if needed)
CREATE TABLE IF NOT EXISTS event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 10. Add missing profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title text;

-- 11. Test data insertion (optional - for testing)
-- Insert a sample survey response (you can remove this)
INSERT INTO survey_responses (post_id, user_id, question_index, question_text, selected_option)
VALUES ('test-post-id', (SELECT id FROM profiles LIMIT 1), 0, 'Test Question', 'Test Option')
ON CONFLICT (post_id, user_id, question_index) DO NOTHING;

-- 12. Verify setup
SELECT 
    'survey_responses' as table_name,
    COUNT(*) as row_count
FROM survey_responses
UNION ALL
SELECT 
    'posts with questions' as table_name,
    COUNT(*) as row_count
FROM posts 
WHERE questions IS NOT NULL AND post_type = 'anket'
UNION ALL
SELECT 
    'event_registrations' as table_name,
    COUNT(*) as row_count
FROM event_registrations;

-- 13. Show table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('survey_responses', 'event_registrations', 'posts', 'profiles')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Success message
SELECT '✅ Survey system setup complete!' as status;






