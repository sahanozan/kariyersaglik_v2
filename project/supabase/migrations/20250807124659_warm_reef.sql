/*
  # Disable Email Confirmation Requirement

  This migration disables the email confirmation requirement for user registration
  to allow immediate login after signup without needing email verification.

  1. Configuration Changes
    - Disables email confirmation requirement
    - Allows users to login immediately after registration
  
  2. Security Notes
    - Email confirmation is disabled for easier development/testing
    - Can be re-enabled later in production if needed
*/

-- Disable email confirmation requirement
-- This allows users to login immediately after registration
-- without needing to confirm their email address

-- Note: This setting is typically configured in the Supabase dashboard
-- under Authentication > Settings > Email confirmation
-- Since we cannot modify dashboard settings via SQL, we'll handle this
-- in the application logic by ensuring proper user creation flow

-- Create a function to handle user signup without email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Automatically confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm emails on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();