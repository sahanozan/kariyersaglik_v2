/*
  # Fix Chat Room Members RLS Policy

  1. Security Updates
    - Add UPDATE policy for chat_room_members table
    - Allow users to update their own membership records (last_seen timestamp)
    
  2. Changes
    - Users can now update their own records in chat_room_members table
    - This fixes the RLS violation when updating last_seen timestamp
*/

-- Add UPDATE policy for chat_room_members
CREATE POLICY "Users can update own membership records"
  ON chat_room_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);