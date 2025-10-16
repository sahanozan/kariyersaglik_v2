/*
  # Fix Admin and Moderator Functions

  1. Database Functions
    - Create or update `is_admin()` function
    - Create or update `is_main_admin()` function
    - Create or update `can_manage_users()` function
    - Create or update `delete_chat_message()` function

  2. Security
    - Ensure functions work correctly with RLS policies
    - Fix permission checks for admin and moderator operations
*/

-- Create or replace the is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_blocked = false
  );
END;
$$;

-- Create or replace the is_main_admin function
CREATE OR REPLACE FUNCTION is_main_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'ozansahan@outlook.com'
    AND role = 'admin' 
    AND is_blocked = false
  );
END;
$$;

-- Create or replace the can_manage_users function
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
    AND is_blocked = false
  );
END;
$$;

-- Create or replace the delete_chat_message function
CREATE OR REPLACE FUNCTION delete_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT can_manage_users() THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update the message to mark it as deleted
  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = message_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_main_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_chat_message(uuid) TO authenticated;