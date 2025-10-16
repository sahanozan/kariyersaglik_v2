/*
  # Job Listing Approval System

  1. Database Changes
    - Add `is_approved` column to job_listings table (default false)
    - Add `approved_by` column to track who approved the job
    - Add `approved_at` column to track when it was approved
    - Update RLS policies to only show approved jobs to regular users
    - Allow admins and moderators to see all jobs for approval

  2. Security
    - Only approved jobs are visible to regular users
    - Admins and moderators can see pending jobs for approval
    - Only admins and moderators can approve jobs
*/

-- Add approval columns to job_listings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active job listings" ON job_listings;
DROP POLICY IF EXISTS "Comprehensive job listings update policy" ON job_listings;
DROP POLICY IF EXISTS "Job listings delete policy" ON job_listings;
DROP POLICY IF EXISTS "Users can create job listings" ON job_listings;
DROP POLICY IF EXISTS "Admins and moderators can delete job listings" ON job_listings;

-- Create new policies with approval system
CREATE POLICY "Users can read approved active job listings"
  ON job_listings
  FOR SELECT
  TO authenticated
  USING (is_active = true AND is_approved = true);

CREATE POLICY "Admins and moderators can read all job listings"
  ON job_listings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );

CREATE POLICY "Users can create job listings for approval"
  ON job_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    posted_by = auth.uid() AND
    is_approved = false
  );

CREATE POLICY "Job poster and admins can update job listings"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  )
  WITH CHECK (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );

CREATE POLICY "Job poster and admins can delete job listings"
  ON job_listings
  FOR DELETE
  TO authenticated
  USING (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );

-- Create function to approve job listing
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
    RAISE EXCEPTION 'Only admins and moderators can approve job listings';
  END IF;

  -- Update job listing
  UPDATE job_listings
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = job_id;
END;
$$;