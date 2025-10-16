-- RPC function to cancel job application
CREATE OR REPLACE FUNCTION cancel_job_application(job_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  current_user_id uuid;
  application_exists boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;
  
  -- Check if application exists
  SELECT EXISTS(
    SELECT 1 FROM job_applications 
    WHERE job_id = job_id_param 
    AND applicant_id = current_user_id
  ) INTO application_exists;
  
  IF NOT application_exists THEN
    RAISE EXCEPTION 'Application not found or already canceled';
  END IF;
  
  -- Delete the application
  DELETE FROM job_applications 
  WHERE job_id = job_id_param 
  AND applicant_id = current_user_id;
  
  -- Check if deletion was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to cancel application';
  END IF;
END;
$func$;
