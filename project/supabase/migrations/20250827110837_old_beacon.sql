/*
  # Fix job deletion permissions for admins and moderators

  1. Security Updates
    - Update RLS policies for job_listings table
    - Allow admins and moderators to delete/deactivate job listings
    - Ensure proper permission checks

  2. Policy Changes
    - Add admin/moderator deletion rights
    - Update existing policies for better permission handling
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Admins and moderators can manage job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can update own job listings" ON job_listings;

-- Create comprehensive policy for admins and moderators
CREATE POLICY "Admins and moderators can manage all job listings"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );

-- Allow users to update their own job listings
CREATE POLICY "Users can update own job listings"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- Ensure admins and moderators can also delete
CREATE POLICY "Admins and moderators can delete job listings"
  ON job_listings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );