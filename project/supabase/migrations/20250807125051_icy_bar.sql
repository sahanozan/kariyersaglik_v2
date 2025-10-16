/*
  # Fix User Registration and Email Confirmation

  This migration creates the proper user handling system that:
  1. Creates user profiles in the public.users table upon registration
  2. Disables email confirmation requirement
  3. Handles user metadata properly

  1. Tables
    - Updates the handle_new_user function to properly create user profiles
    - Ensures user data from registration is stored in public.users table
  
  2. Security
    - Maintains email confirmation bypass
    - Preserves user data integrity
*/

-- Create or replace the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Automatically confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Insert user data into public.users table using metadata
  INSERT INTO public.users (
    id,
    email,
    name,
    branch,
    city,
    institution,
    role,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution', ''),
    CASE 
      WHEN NEW.email = 'ozansahan@outlook.com' THEN 'admin'
      ELSE 'user'
    END,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();