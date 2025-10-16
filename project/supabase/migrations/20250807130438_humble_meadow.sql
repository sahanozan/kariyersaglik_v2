/*
  # Rename users table to profiles

  1. Table Changes
    - Rename `users` table to `profiles`
    - Update all RLS policies to use new table name
    - Update all functions to use new table name
    - Maintain all existing data and structure

  2. Security
    - Preserve all existing RLS policies
    - Update function references
    - Maintain admin and moderator permissions

  3. Data Migration
    - All existing user data will be preserved
    - No data loss during rename operation
*/

-- First, drop existing policies on users table
DROP POLICY IF EXISTS "Admin and moderators can view all users" ON users;
DROP POLICY IF EXISTS "Admin can read all data" ON users;
DROP POLICY IF EXISTS "Admin can update user roles" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop existing functions that reference users table
DROP FUNCTION IF EXISTS promote_to_moderator(uuid);
DROP FUNCTION IF EXISTS toggle_user_block(uuid, boolean);

-- Rename users table to profiles
ALTER TABLE IF EXISTS users RENAME TO profiles;

-- Re-enable RLS on the renamed table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate all RLS policies for profiles table
CREATE POLICY "Admin and moderators can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admin can read all profile data"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin can update user roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can read own profile data"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile data"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Recreate admin functions for profiles table
CREATE OR REPLACE FUNCTION promote_to_moderator(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can promote users to moderator';
  END IF;

  -- Update user role to moderator
  UPDATE profiles 
  SET role = 'moderator', updated_at = now()
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_user_block(user_id uuid, block_status boolean DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Only admins and moderators can block users';
  END IF;

  -- Toggle block status or set specific status
  IF block_status IS NULL THEN
    UPDATE profiles 
    SET is_blocked = NOT is_blocked, updated_at = now()
    WHERE id = user_id;
  ELSE
    UPDATE profiles 
    SET is_blocked = block_status, updated_at = now()
    WHERE id = user_id;
  END IF;
END;
$$;

-- Update the trigger function to use profiles table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    branch,
    city,
    institution,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution', ''),
    CASE 
      WHEN NEW.email = 'ozansahan@outlook.com' THEN 'admin'
      ELSE 'user'
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update admin profile data
UPDATE profiles 
SET 
  first_name = 'Prm.Ozan',
  last_name = 'ŞAHAN',
  branch = 'paramedik',
  city = 'Kocaeli',
  institution = 'Kocaeli 112 İstasyonu',
  role = 'admin',
  updated_at = now()
WHERE email = 'ozansahan@outlook.com';