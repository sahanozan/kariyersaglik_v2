/*
  # Create post comments system

  1. New Tables
    - `post_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `parent_id` (uuid, nullable, for replies)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp, nullable)
      - `deleted_by` (uuid, nullable)

  2. Security
    - Enable RLS on `post_comments` table
    - Add policies for authenticated users to read/write comments
    - Add policies for admins/moderators to manage comments
*/

CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_deleted_at ON post_comments(deleted_at);

-- RLS Policies
CREATE POLICY "Users can read non-deleted comments"
  ON post_comments
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can insert their own comments"
  ON post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON post_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin and moderators can manage comments"
  ON post_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_updated_at();