/*
  # Fix registration trigger function

  1. Updates
    - Fix handle_new_user trigger function
    - Ensure proper error handling
    - Add better logging

  2. Security
    - Maintain RLS policies
    - Ensure trigger works with authentication
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger called for user: %', NEW.id;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    branch,
    city,
    institution,
    phone,
    role,
    is_blocked,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution', ''),
    NEW.raw_user_meta_data->>'phone',
    'user',
    false,
    NOW(),
    NOW()
  );
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Don't fail the auth process, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();