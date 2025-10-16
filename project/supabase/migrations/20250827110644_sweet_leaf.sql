/*
  # Fix job deletion permissions for admins and moderators

  1. Security Updates
    - Update RLS policy to allow admins and moderators to delete job listings
    - Ensure proper permissions for job management

  2. Changes
    - Modified job listings UPDATE policy to allow admin/moderator deletion
    - Added proper role checking for job deactivation
*/

-- Update the job listings policy to allow admins and moderators to deactivate jobs
DROP POLICY IF EXISTS "Admins and moderators can deactivate job listings" ON job_listings;

CREATE POLICY "Admins and moderators can manage job listings"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own job listings OR admins/moderators can manage any job listing
    (posted_by = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    ))
  )
  WITH CHECK (
    -- Same condition for WITH CHECK
    (posted_by = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    ))
  );