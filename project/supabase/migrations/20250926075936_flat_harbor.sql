/*
  # Admin Account Creation Functions

  1. Functions
    - `promote_to_admin(email)` - Promotes a user to admin role
    - `is_admin()` - Checks if current user is admin
    - `is_main_admin()` - Checks if current user is main admin
    - `can_manage_users()` - Checks if user can manage other users

  2. Security
    - Only main admin can promote other users to admin
    - Admin functions for role management
*/

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is main admin
CREATE OR REPLACE FUNCTION is_main_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND email = 'ozansahan@outlook.com'
    AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage other users
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
    AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (only main admin can do this)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update user role to admin
  UPDATE profiles 
  SET 
    role = 'admin',
    updated_at = now()
  WHERE email = user_email;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to moderator
CREATE OR REPLACE FUNCTION promote_to_moderator(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only admin can promote to moderator
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users to moderator';
  END IF;
  
  UPDATE profiles 
  SET 
    role = 'moderator',
    updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote user to regular user
CREATE OR REPLACE FUNCTION demote_to_user(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only admin can demote users
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Prevent demoting main admin
  IF user_email = 'ozansahan@outlook.com' THEN
    RAISE EXCEPTION 'Cannot demote main admin';
  END IF;
  
  UPDATE profiles 
  SET 
    role = 'user',
    updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;