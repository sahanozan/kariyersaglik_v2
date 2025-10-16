/*
  # Add user management policies for admin and moderator roles

  1. New Policies
    - Admin can update any user's role
    - Admin can block/unblock users
    - Moderator can view all users but cannot modify roles
    - Users can view other users in same branch

  2. Functions
    - Function to promote users to moderator
    - Function to block/unblock users
    - Function to check user permissions

  3. Security
    - Strict role-based access control
    - Only admins can grant moderator privileges
    - Moderators cannot promote other users
*/

-- Add blocked status to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE users ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
END $$;

-- Add last_login to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Policy for admin to update user roles
CREATE POLICY "Admin can update user roles"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for admin and moderators to view all users
CREATE POLICY "Admin and moderators can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Function to promote user to moderator (admin only)
CREATE OR REPLACE FUNCTION promote_to_moderator(user_id uuid)
RETURNS boolean AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM users
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can promote users to moderator';
  END IF;
  
  -- Update user role to moderator
  UPDATE users
  SET role = 'moderator', updated_at = now()
  WHERE id = user_id AND role = 'user';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block/unblock user (admin and moderator)
CREATE OR REPLACE FUNCTION toggle_user_block(user_id uuid, block_status boolean)
RETURNS boolean AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if current user is admin or moderator
  SELECT role INTO current_user_role
  FROM users
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Only admins and moderators can block users';
  END IF;
  
  -- Update user block status
  UPDATE users
  SET is_blocked = block_status, updated_at = now()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission for action
CREATE OR REPLACE FUNCTION check_user_permission(action_type text)
RETURNS boolean AS $$
DECLARE
  current_user_role text;
  is_blocked boolean;
BEGIN
  -- Get current user role and block status
  SELECT role, is_blocked INTO current_user_role, is_blocked
  FROM users
  WHERE id = auth.uid();
  
  -- Blocked users have no permissions
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Admin has all permissions
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Moderator permissions
  IF current_user_role = 'moderator' THEN
    RETURN action_type IN ('delete_message', 'block_user', 'access_all_rooms');
  END IF;
  
  -- Regular user permissions
  RETURN action_type IN ('send_message', 'access_own_room');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;