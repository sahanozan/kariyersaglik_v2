/*
  # Private Message Deletion RPC Function

  1. RPC Functions
    - `delete_private_message()` - RPC for deleting private messages
    - Users can only delete their own messages
    - Admin and moderators can delete any message

  2. Security
    - Proper authorization checks
    - Users can only delete their own messages
    - Admin and moderators have full access
*/

-- RPC function to delete private messages
CREATE OR REPLACE FUNCTION delete_private_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  message_sender_id uuid;
  message_receiver_id uuid;
BEGIN
  -- Get current user's role and blocked status
  SELECT role, is_blocked INTO current_user_role, current_user_blocked
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists and is not blocked
  IF current_user_role IS NULL OR current_user_blocked = true THEN
    RAISE EXCEPTION 'Unauthorized: User not found or blocked';
  END IF;
  
  -- Get message details
  SELECT sender_id, receiver_id INTO message_sender_id, message_receiver_id
  FROM private_messages 
  WHERE id = message_id;
  
  -- Check if message exists
  IF message_sender_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Check if user can delete this message
  -- Users can delete their own messages, admin and moderators can delete any message
  IF current_user_role NOT IN ('admin', 'moderator') AND 
     auth.uid() NOT IN (message_sender_id, message_receiver_id) THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own messages';
  END IF;
  
  -- Delete the message
  DELETE FROM private_messages WHERE id = message_id;
  
  -- Check if the deletion was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;




