/*
  # Missing Database Functions and RPC

  1. Database Functions
    - `is_admin()` - Check if user is admin
    - `is_main_admin()` - Check if user is main admin
    - `can_manage_users()` - Check if user can manage other users
    - `update_updated_at_column()` - Trigger function for updating timestamps
    - `update_private_messages_updated_at()` - Trigger function for private messages

  2. RPC Functions
    - `delete_chat_message()` - RPC for deleting chat messages

  3. Security
    - All functions use proper authentication checks
    - RPC functions include proper authorization
*/

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to check if user is main admin
CREATE OR REPLACE FUNCTION is_main_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin' AND email = 'ozansahan@outlook.com'
  );
$$;

-- Function to check if user can manage other users
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

-- Generic trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Specific trigger function for private messages
CREATE OR REPLACE FUNCTION update_private_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- RPC function to delete chat messages (for admin/moderator use)
CREATE OR REPLACE FUNCTION delete_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT can_manage_users() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and moderators can delete messages';
  END IF;

  -- Soft delete the message
  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = message_id;
END;
$$;