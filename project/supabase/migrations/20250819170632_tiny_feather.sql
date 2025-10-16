/*
  # Private Messages System

  1. New Tables
    - `private_messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `receiver_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `conversation_id` (text, for grouping messages)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `private_messages` table
    - Add policies for users to read/write their own messages
    - Add indexes for performance
*/

CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  conversation_id text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Policies for private messages
CREATE POLICY "Users can read their own messages"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON private_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_id ON private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_private_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_private_messages_updated_at
  BEFORE UPDATE ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_private_messages_updated_at();