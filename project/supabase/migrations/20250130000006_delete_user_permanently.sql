-- Delete user permanently and all their content
-- This function will be called when admin wants to permanently delete a user

CREATE OR REPLACE FUNCTION delete_user_permanently(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  target_user_role text;
BEGIN
  -- Get current user's role and blocked status
  SELECT role, is_blocked INTO current_user_role, current_user_blocked
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists and is not blocked
  IF current_user_role IS NULL OR current_user_blocked = true THEN
    RAISE EXCEPTION 'Unauthorized: User not found or blocked';
  END IF;
  
  -- Check if user is admin
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can permanently delete users';
  END IF;
  
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM profiles 
  WHERE id = user_id;
  
  -- Prevent deleting admin users
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete admin users';
  END IF;
  
  -- Delete all their posts
  DELETE FROM posts WHERE user_id = user_id;
  
  -- Delete all their comments
  DELETE FROM comments WHERE user_id = user_id;
  
  -- Delete all their likes
  DELETE FROM likes WHERE user_id = user_id;
  
  -- Delete all their private messages (both sent and received)
  DELETE FROM private_messages WHERE sender_id = user_id OR receiver_id = user_id;
  
  -- Delete all their chat messages
  DELETE FROM chat_messages WHERE user_id = user_id;
  
  -- Delete all their job applications
  DELETE FROM job_applications WHERE user_id = user_id;
  
  -- Delete all their CV data
  DELETE FROM cv_skills WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_certifications WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_educations WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_experiences WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cvs WHERE user_id = user_id;
  
  -- Delete all their friend requests
  DELETE FROM friend_requests WHERE sender_id = user_id OR receiver_id = user_id;
  
  -- Delete all their room memberships
  DELETE FROM chat_room_members WHERE user_id = user_id;
  
  -- Delete all their job listings
  DELETE FROM job_listings WHERE user_id = user_id;
  
  -- Delete all their algorithm submissions
  DELETE FROM algorithm_submissions WHERE user_id = user_id;
  
  -- Delete all their drug submissions
  DELETE FROM drug_submissions WHERE user_id = user_id;
  
  -- Delete all their notifications
  DELETE FROM notifications WHERE user_id = user_id;
  
  -- Finally, delete the user profile
  DELETE FROM profiles WHERE id = user_id;
  
  -- Log the action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    description,
    created_at
  ) VALUES (
    auth.uid(),
    'delete_user_permanently',
    user_id,
    'User permanently deleted',
    now()
  );
  
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user_permanently(uuid) TO authenticated;
