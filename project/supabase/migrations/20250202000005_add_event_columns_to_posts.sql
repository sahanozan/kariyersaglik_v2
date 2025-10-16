-- Add event-related columns to posts table

-- First, update the post_type check constraint to include 'etkinlik' and 'anket'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- Add event-related columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;

-- Add survey-related column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date) WHERE post_type = 'etkinlik';
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Update the updated_at timestamp trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure RLS is disabled for posts table (as per previous migrations)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;






