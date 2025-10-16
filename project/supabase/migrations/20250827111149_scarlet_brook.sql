/*
  # Fix job listings RLS policy for UPDATE operations

  1. Policy Updates
    - Drop existing conflicting UPDATE policy
    - Create new comprehensive UPDATE policy that allows:
      - Job owners to update their own listings
      - Admin and moderator users to update any listing
  
  2. Security
    - Maintains RLS protection
    - Allows proper admin/moderator management
    - Prevents unauthorized updates
*/

-- Drop existing UPDATE policy that might be causing conflicts
DROP POLICY IF EXISTS "Allow job listing updates by owner or admin/moderator" ON job_listings;

-- Create comprehensive UPDATE policy
CREATE POLICY "job_listings_update_policy" ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow job owner to update their own listing
    (posted_by = auth.uid())
    OR
    -- Allow admin and moderator users to update any listing
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    ))
  )
  WITH CHECK (
    -- Same conditions for the updated row
    (posted_by = auth.uid())
    OR
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    ))
  );