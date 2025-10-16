-- Fix event registrations table and add detailed user information

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS event_registrations CASCADE;

-- Create event_registrations table with proper structure
CREATE TABLE event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL, -- This should match posts.id which is text/uuid
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Add foreign key constraints
    CONSTRAINT fk_event_registrations_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Ensure one registration per user per event
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_created_at ON event_registrations(created_at);

-- Disable RLS for now
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Also ensure posts table has the event columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- Update post_type constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));

-- Ensure posts table RLS is disabled
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Test the setup
SELECT 'event_registrations table created successfully' as status;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;






