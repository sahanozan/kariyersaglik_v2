-- Add DELETE policy for job_applications table
-- Users should be able to delete their own job applications

CREATE POLICY "Users can delete own job applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (applicant_id = auth.uid());

-- Job posters should also be able to delete applications to their jobs
CREATE POLICY "Job posters can delete applications to their jobs"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_id AND jl.posted_by = auth.uid()
    )
  );

-- Admins and moderators should be able to delete any job application
CREATE POLICY "Admins and moderators can delete any job application"
  ON job_applications
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




