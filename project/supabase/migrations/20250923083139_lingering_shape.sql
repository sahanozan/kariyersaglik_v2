/*
  # Add phone number to profiles table

  1. Schema Changes
    - Add `phone` column to `profiles` table
    - Column is nullable to support existing users
    - New registrations will require phone number

  2. Security
    - No changes to RLS policies needed
    - Phone number follows same access rules as other profile data
*/

-- Add phone column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;