-- Fix branch column in profiles table
-- This script adds the branch column if it doesn't exist

-- 1. Check if branch column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'branch'
AND table_schema = 'public';

-- 2. Add branch column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'branch'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN branch TEXT;
        RAISE NOTICE 'Branch column added to profiles table';
    ELSE
        RAISE NOTICE 'Branch column already exists';
    END IF;
END $$;

-- 3. Update RLS policies to allow branch updates
DROP POLICY IF EXISTS "Allow authenticated users to update own non-sensitive fields" ON profiles;
CREATE POLICY "Allow authenticated users to update own non-sensitive fields"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow admins to update all fields
DROP POLICY IF EXISTS "Admins have full access" ON profiles;
CREATE POLICY "Admins have full access"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
