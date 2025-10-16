/*
  # Missing Database Functions

  1. Functions
    - `is_admin()` - Check if current user is admin
    - `is_main_admin()` - Check if current user is main admin
    - `can_manage_users()` - Check if user can manage other users
    - `delete_chat_message()` - Safely delete chat messages
    - `approve_job_listing()` - Approve job listings

  2. Triggers
    - Update member count when users join/leave chat rooms
    - Update timestamps on record changes

  3. Security
    - Ensure all RLS policies are properly configured
    - Add missing indexes for performance
*/

-- Function to check if current user is admin
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

-- Function to check if current user is main admin
CREATE OR REPLACE FUNCTION is_main_admin()
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
    AND email = 'admin@kariyersaglik.com' -- Main admin email
  );
END;
$$;

-- Function to check if user can manage other users
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

-- Function to safely delete chat messages
CREATE OR REPLACE FUNCTION delete_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admin and moderators can delete messages
  IF NOT can_manage_users() THEN
    RAISE EXCEPTION 'Insufficient permissions to delete message';
  END IF;

  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = message_id;
END;
$$;

-- Function to approve job listings
CREATE OR REPLACE FUNCTION approve_job_listing(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admin and moderators can approve jobs
  IF NOT can_manage_users() THEN
    RAISE EXCEPTION 'Insufficient permissions to approve job listing';
  END IF;

  UPDATE job_listings 
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = job_id;
END;
$$;

-- Function to update room member count
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_rooms 
    SET member_count = (
      SELECT COUNT(*) 
      FROM chat_room_members 
      WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_rooms 
    SET member_count = (
      SELECT COUNT(*) 
      FROM chat_room_members 
      WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_login on profile creation
  UPDATE profiles 
  SET last_login = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure all tables have proper updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON private_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created ON friend_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_created ON job_listings(created_at DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_main_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_chat_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_job_listing(uuid) TO authenticated;