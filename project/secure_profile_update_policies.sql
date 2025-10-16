-- Secure Profile Update Policies
-- Prevent users from updating sensitive fields directly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON profiles;

-- Create secure update policy that only allows safe fields
CREATE POLICY "Users can update safe profile fields only"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Explicitly exclude sensitive fields from being updated
    (NEW.role IS NULL OR NEW.role = OLD.role) AND
    (NEW.is_blocked IS NULL OR NEW.is_blocked = OLD.is_blocked) AND
    (NEW.credits IS NULL OR NEW.credits = OLD.credits) AND
    (NEW.isAdmin IS NULL OR NEW.isAdmin = OLD.isAdmin) AND
    (NEW.admin IS NULL OR NEW.admin = OLD.admin) AND
    (NEW.permissions IS NULL OR NEW.permissions = OLD.permissions) AND
    (NEW.access_level IS NULL OR NEW.access_level = OLD.access_level)
  );

-- Create admin-only policy for sensitive field updates
CREATE POLICY "Admins can update all profile fields"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND p.is_blocked = false
    )
  );

-- Test the policies
SELECT 'Secure profile update policies created successfully' as status;
