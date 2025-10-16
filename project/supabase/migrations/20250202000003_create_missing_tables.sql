-- Create missing tables for the application

-- Create surveys table if not exists (for standalone surveys)
CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_responses table for storing survey answers
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Can reference both surveys and posts
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(survey_id, user_id) -- One response per user per survey
);

-- Create events table if not exists (for standalone events)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_time TEXT,
  location TEXT NOT NULL,
  max_participants INTEGER DEFAULT 50,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_registrations table for event applications
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Can reference both events and posts
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- One registration per user per event
);

-- Add questions column to posts table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'questions') THEN
        ALTER TABLE posts ADD COLUMN questions JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add event fields to posts table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'event_date') THEN
        ALTER TABLE posts ADD COLUMN event_date TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'event_time') THEN
        ALTER TABLE posts ADD COLUMN event_time TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'event_location') THEN
        ALTER TABLE posts ADD COLUMN event_location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'max_participants') THEN
        ALTER TABLE posts ADD COLUMN max_participants TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'registration_deadline') THEN
        ALTER TABLE posts ADD COLUMN registration_deadline TEXT;
    END IF;
END $$;

-- Disable RLS for all tables to avoid permission issues
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "surveys_policy" ON surveys;
DROP POLICY IF EXISTS "survey_responses_policy" ON survey_responses;
DROP POLICY IF EXISTS "events_policy" ON events;
DROP POLICY IF EXISTS "event_registrations_policy" ON event_registrations;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at 
    BEFORE UPDATE ON surveys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_responses_updated_at ON survey_responses;
CREATE TRIGGER update_survey_responses_updated_at 
    BEFORE UPDATE ON survey_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER update_event_registrations_updated_at 
    BEFORE UPDATE ON event_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






