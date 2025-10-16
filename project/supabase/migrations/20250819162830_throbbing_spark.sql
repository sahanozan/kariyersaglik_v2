/*
  # Add about column to profiles table

  1. Changes
    - Add `about` column to `profiles` table
    - Column type: text (nullable)
    - Allows users to add personal information about themselves

  2. Security
    - No changes to existing RLS policies needed
    - Column is optional and can be null
*/

-- Add about column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'about'
  ) THEN
    ALTER TABLE profiles ADD COLUMN about text;
  END IF;
END $$;