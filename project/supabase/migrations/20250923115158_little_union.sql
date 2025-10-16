/*
  # Create approve job listing function

  1. New Functions
    - `approve_job_listing` function to approve job listings
    - Updates is_approved to true
    - Sets approved_by to current user
    - Sets approved_at to current timestamp

  2. Security
    - Only admin and moderator roles can approve jobs
    - Function checks user permissions before approval
*/

CREATE OR REPLACE FUNCTION approve_job_listing(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator') 
    AND is_blocked = false
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can approve job listings';
  END IF;

  -- Update job listing
  UPDATE job_listings 
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job listing not found';
  END IF;
END;
$$;