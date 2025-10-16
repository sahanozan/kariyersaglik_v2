/*
  # Fix job listings RLS policy for admin/moderator updates

  1. Security Updates
    - Drop existing conflicting UPDATE policy
    - Create new policy allowing admins/moderators to update any job listing
    - Allow job posters to update their own listings
*/

-- Drop existing UPDATE policy that might be causing conflicts
DROP POLICY IF EXISTS "Allow job listing updates" ON job_listings;
DROP POLICY IF EXISTS "Users can update job listings" ON job_listings;
DROP POLICY IF EXISTS "Admins and moderators can update job listings" ON job_listings;

-- Create comprehensive UPDATE policy
CREATE POLICY "Allow job listing updates by owner or admin/moderator"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = posted_by) OR 
    (EXISTS ( 
      SELECT 1 
      FROM profiles 
      WHERE (profiles.id = auth.uid()) 
        AND (profiles.role IN ('admin', 'moderator'))
        AND (profiles.is_blocked = false)
    ))
  )
  WITH CHECK (
    (auth.uid() = posted_by) OR 
    (EXISTS ( 
      SELECT 1 
      FROM profiles 
      WHERE (profiles.id = auth.uid()) 
        AND (profiles.role IN ('admin', 'moderator'))
        AND (profiles.is_blocked = false)
    ))
  );