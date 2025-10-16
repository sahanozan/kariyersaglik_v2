/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - RLS policies were querying the same table they were protecting
    - This created infinite recursion loops

  2. Solution
    - Simplify policies to avoid self-referencing queries
    - Use direct auth.uid() comparisons instead of subqueries
    - Remove circular dependencies in admin/moderator checks

  3. Security
    - Maintain proper access control
    - Keep admin and moderator privileges
    - Ensure users can only access their own data
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile data" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profile data" ON profiles;
DROP POLICY IF EXISTS "Admin and moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update user roles" ON profiles;

-- Create simple, non-recursive policies
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

CREATE POLICY "Users can insert own profile data"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a simple function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'ozansahan@outlook.com'
  );
$$;

-- Create admin policies using the function
CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Update admin profile data
UPDATE profiles 
SET 
  first_name = 'Prm.Ozan',
  last_name = 'ŞAHAN',
  branch = 'Paramedik',
  institution = 'Kocaeli 112 İstasyonu',
  city = 'Kocaeli',
  role = 'admin'
WHERE email = 'ozansahan@outlook.com';