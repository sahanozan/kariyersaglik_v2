/*
  # Fix job listings RLS policy for admin/moderator updates

  1. Policy Updates
    - Drop existing conflicting UPDATE policies on job_listings table
    - Create new comprehensive UPDATE policy that allows:
      - Users to update their own job listings
      - Admins and moderators to update any job listing
    - Ensure proper role checking from profiles table

  2. Security
    - Maintain security for regular users (can only update own listings)
    - Grant admin/moderator privileges for job management
*/

-- Drop existing UPDATE policies that might be conflicting
DROP POLICY IF EXISTS "Users can update own job listings" ON job_listings;
DROP POLICY IF EXISTS "Admins and moderators can manage all job listings" ON job_listings;

-- Create comprehensive UPDATE policy
CREATE POLICY "Allow job listing updates"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update their own job listing
    posted_by = auth.uid()
    OR
    -- Admin or moderator can update any job listing
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
      AND is_blocked = false
    )
  )
  WITH CHECK (
    -- Same conditions for the updated row
    posted_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
      AND is_blocked = false
    )
  );