/*
  # Fix delete_chat_message function

  1. Functions
    - Update delete_chat_message function to properly handle message deletion
    - Add proper error handling and return type

  2. Security
    - Ensure only admin and moderators can delete messages
    - Add proper permission checks
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_chat_message(uuid);

-- Create the delete_chat_message function
CREATE OR REPLACE FUNCTION delete_chat_message(message_id uuid)
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
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can delete messages';
  END IF;
  
  -- Update the message to mark it as deleted
  UPDATE chat_messages 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;