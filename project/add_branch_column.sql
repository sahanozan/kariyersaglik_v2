-- Add branch column to profiles table if it doesn't exist
-- This script ensures the branch column exists for user profiles

-- Check if branch column exists, if not add it
DO $$ 
BEGIN
    -- Check if the branch column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'branch'
    ) THEN
        -- Add the branch column
        ALTER TABLE profiles ADD COLUMN branch TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN profiles.branch IS 'User profession/branch (e.g., Doctor, Nurse, etc.)';
        
        -- Create index for better performance on branch searches
        CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch);
        
        RAISE NOTICE 'Branch column added to profiles table';
    ELSE
        RAISE NOTICE 'Branch column already exists in profiles table';
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, UPDATE ON profiles TO anon;

-- Update RLS policies to include branch field
-- Allow users to update their own branch
DROP POLICY IF EXISTS "Allow authenticated users to update own non-sensitive fields" ON profiles;
CREATE POLICY "Allow authenticated users to update own non-sensitive fields"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure sensitive fields are not being changed by the user
  (old.role = new.role) AND
  (old.is_blocked = new.is_blocked) AND
  (old.credits = new.credits) AND
  (old.is_admin = new.is_admin)
);

-- Allow admins to update all fields including branch
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
