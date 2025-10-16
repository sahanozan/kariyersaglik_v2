-- Simple fix for event registrations without complex foreign keys

-- 1. Drop existing table if it exists
DROP TABLE IF EXISTS event_registrations CASCADE;

-- 2. Create simple event_registrations table
CREATE TABLE event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Simple unique constraint
    UNIQUE(event_id, user_id)
);

-- 3. Create indexes
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);

-- 4. Disable RLS
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 5. Add missing columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- 6. Update post_type constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- 7. Add basic CV columns to profiles (if they don't exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- 8. Ensure posts and profiles RLS is disabled
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 9. Test the setup
SELECT 'Setup completed successfully' as status;

-- 10. Show table structures
SELECT 'event_registrations columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

SELECT 'profiles new columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('title', 'cv_url', 'experience_years', 'specialization', 'education', 'certifications', 'skills')
ORDER BY column_name;

