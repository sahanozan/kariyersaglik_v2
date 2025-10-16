-- Simple fix for branch column
-- Run this in Supabase Dashboard

-- 1. Add branch column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;

-- 2. Add comment
COMMENT ON COLUMN profiles.branch IS 'User profession/branch';

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch);

-- 4. Grant permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, UPDATE ON profiles TO anon;

-- 5. Simple RLS policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
CREATE POLICY "Admins can do everything"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
