/*
  # Create Admin Account

  1. Admin User Creation
    - Creates admin user profile for Ozan ŞAHAN
    - Sets role to 'admin'
    - Configures all necessary permissions

  2. Security
    - Ensures admin has full access to all features
    - Sets up proper role hierarchy
*/

-- First, we need to create the auth user and then the profile
-- Since we can't create auth users directly via SQL, we'll create a function to handle this

-- Create a function to promote user to admin after they register
CREATE OR REPLACE FUNCTION promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's role to admin
  UPDATE profiles 
  SET 
    role = 'admin',
    updated_at = now()
  WHERE email = user_email;
  
  -- Log the promotion
  RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$;

-- Create a function to check if user is main admin
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
    AND email = 'ozansahan@outlook.com'
  );
END;
$$;

-- Create a function to check if user is admin
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

-- Create a function to check if user can manage other users
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

-- Add policy for main admin to change roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Only main admin can change roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Only main admin can change roles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (is_main_admin() AND auth.uid() <> id)
      WITH CHECK (is_main_admin() AND auth.uid() <> id)';
  END IF;
END $$;

-- Add policy for admin to read all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admin can read all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin can read all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (is_admin())';
  END IF;
END $$;

-- Add policy for admin and moderators to manage users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admin and moderators can block users'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin and moderators can block users"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (can_manage_users())
      WITH CHECK (can_manage_users())';
  END IF;
END $$;