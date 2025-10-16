/*
  # Etkinlik organizasyonu, anket sistemi ve iş başvuru sistemi

  1. New Tables
    - `events` - Etkinlik organizasyonu için
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `event_date` (timestamp)
      - `location` (text)
      - `max_participants` (integer)
      - `registration_deadline` (timestamp)
      - `created_at` (timestamp)
    - `event_registrations` - Etkinlik katılım istekleri
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `user_id` (uuid, foreign key to profiles)
      - `status` (text: pending, approved, rejected)
      - `created_at` (timestamp)
    - `surveys` - Anket sistemi
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `questions` (jsonb)
      - `is_active` (boolean)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
    - `survey_responses` - Anket cevapları
      - `id` (uuid, primary key)
      - `survey_id` (uuid, foreign key to surveys)
      - `user_id` (uuid, foreign key to profiles)
      - `responses` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
    - Users can create events and surveys
    - Users can register for events and respond to surveys
    - Admin/moderators can manage all content

  3. Indexes
    - Add performance indexes for common queries
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  max_participants integer DEFAULT 50,
  registration_deadline timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  questions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can read active events"
  ON events
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all events"
  ON events
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.is_blocked = false
  ));

-- Event registrations policies
CREATE POLICY "Users can read own registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Event creators can read registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_registrations.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can create registrations"
  ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event creators can update registrations"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_registrations.event_id
    AND events.user_id = auth.uid()
  ));

-- Surveys policies
CREATE POLICY "Users can read active surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create surveys"
  ON surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own surveys"
  ON surveys
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all surveys"
  ON surveys
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.is_blocked = false
  ));

-- Survey responses policies
CREATE POLICY "Users can read own responses"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Survey creators can read responses"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM surveys
    WHERE surveys.id = survey_responses.survey_id
    AND surveys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create responses"
  ON survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own responses"
  ON survey_responses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();