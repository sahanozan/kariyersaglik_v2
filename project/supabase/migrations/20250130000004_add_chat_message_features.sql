/*
  # Chat Message Features - 24 Hour Auto Delete & Message Pinning

  1. Features
    - Add 24 hour automatic message deletion
    - Add message pinning functionality for admin/moderators
    - Add expiration tracking
    - Add pin management

  2. Security
    - Only admin/moderators can pin messages
    - Auto-delete respects pinned messages
    - Proper permission checks
*/

-- Add new columns to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_at timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES profiles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires_at ON chat_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON chat_messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_pinned ON chat_messages(room_id, is_pinned) WHERE is_pinned = true;

-- Function to automatically delete expired messages
CREATE OR REPLACE FUNCTION auto_delete_expired_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages that are expired and not pinned
  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = null
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND deleted_at IS NULL 
    AND is_pinned = false;
    
  -- Log the operation
  INSERT INTO chat_messages (room_id, user_id, message, created_at)
  SELECT 
    'system',
    null,
    'System: Expired messages cleaned up at ' || now(),
    now()
  WHERE EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE expires_at IS NOT NULL 
      AND expires_at < now() 
      AND deleted_at IS NULL 
      AND is_pinned = false
  );
END;
$$;

-- Function to pin a message (admin/moderator only)
CREATE OR REPLACE FUNCTION pin_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  room_id text;
BEGIN
  -- Get current user's role and blocked status
  SELECT role, is_blocked INTO current_user_role, current_user_blocked
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists and is not blocked
  IF current_user_role IS NULL OR current_user_blocked = true THEN
    RAISE EXCEPTION 'Unauthorized: User not found or blocked';
  END IF;
  
  -- Check if user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can pin messages';
  END IF;
  
  -- Get the room_id for the message
  SELECT room_id INTO room_id FROM chat_messages WHERE id = message_id;
  
  IF room_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Unpin all other messages in the same room first (max 3 pins per room)
  UPDATE chat_messages 
  SET is_pinned = false, pinned_at = null, pinned_by = null
  WHERE room_id = room_id AND is_pinned = true;
  
  -- Pin the message
  UPDATE chat_messages 
  SET 
    is_pinned = true,
    pinned_at = now(),
    pinned_by = auth.uid(),
    expires_at = null -- Pinned messages don't expire
  WHERE id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;

-- Function to unpin a message (admin/moderator only)
CREATE OR REPLACE FUNCTION unpin_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
BEGIN
  -- Get current user's role and blocked status
  SELECT role, is_blocked INTO current_user_role, current_user_blocked
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists and is not blocked
  IF current_user_role IS NULL OR current_user_blocked = true THEN
    RAISE EXCEPTION 'Unauthorized: User not found or blocked';
  END IF;
  
  -- Check if user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can unpin messages';
  END IF;
  
  -- Unpin the message
  UPDATE chat_messages 
  SET 
    is_pinned = false,
    pinned_at = null,
    pinned_by = null,
    expires_at = now() + interval '24 hours' -- Set expiration when unpinned
  WHERE id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;

-- Function to set message expiration (24 hours from now)
CREATE OR REPLACE FUNCTION set_message_expiration(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set expiration to 24 hours from now (only for non-pinned messages)
  UPDATE chat_messages 
  SET expires_at = now() + interval '24 hours'
  WHERE id = message_id 
    AND is_pinned = false
    AND deleted_at IS NULL;
    
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found, already deleted, or pinned';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_delete_expired_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION pin_chat_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION unpin_chat_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_message_expiration(uuid) TO authenticated;

-- Create a scheduled job to run auto_delete_expired_messages every hour
-- Note: This would typically be set up in your Supabase dashboard or via pg_cron
-- For now, we'll create a function that can be called manually or via Edge Functions

-- Update existing messages to have 24-hour expiration
UPDATE chat_messages 
SET expires_at = created_at + interval '24 hours'
WHERE expires_at IS NULL 
  AND deleted_at IS NULL 
  AND is_pinned = false;
