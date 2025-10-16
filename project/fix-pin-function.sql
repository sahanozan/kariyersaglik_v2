-- Fix pin_chat_message function - room_id ambiguous error
CREATE OR REPLACE FUNCTION pin_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  target_room_id text;
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
  
  -- Get the room_id for the message (explicitly specify table)
  SELECT room_id INTO target_room_id 
  FROM chat_messages 
  WHERE id = message_id;
  
  IF target_room_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Unpin all other messages in the same room first (max 3 pins per room)
  UPDATE chat_messages 
  SET is_pinned = false, pinned_at = null, pinned_by = null
  WHERE chat_messages.room_id = target_room_id AND is_pinned = true;
  
  -- Pin the message
  UPDATE chat_messages 
  SET 
    is_pinned = true,
    pinned_at = now(),
    pinned_by = auth.uid(),
    expires_at = null -- Pinned messages don't expire
  WHERE chat_messages.id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;

-- Fix unpin_chat_message function as well
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
  WHERE chat_messages.id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;
