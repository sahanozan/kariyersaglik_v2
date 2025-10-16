-- Simple user block and delete functions

-- Drop existing functions
DROP FUNCTION IF EXISTS block_user_and_cleanup(uuid);
DROP FUNCTION IF EXISTS delete_user_permanently(uuid);

-- Block user function
CREATE FUNCTION block_user_and_cleanup(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if user is admin or moderator
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Yetkisiz: Sadece admin ve moderatörler kullanıcı engelleyebilir';
  END IF;
  
  -- Block the user
  UPDATE profiles 
  SET 
    is_blocked = true,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Delete their posts
  DELETE FROM posts WHERE user_id = target_user_id;
  
  -- Delete their comments
  DELETE FROM comments WHERE user_id = target_user_id;
  
  -- Delete their likes
  DELETE FROM likes WHERE user_id = target_user_id;
  
  -- Delete their private messages
  DELETE FROM private_messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete their chat messages
  UPDATE chat_messages 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid()
  WHERE user_id = target_user_id;
  
  -- Delete their job applications
  DELETE FROM job_applications WHERE user_id = target_user_id;
  
  -- Delete their CV data
  DELETE FROM cv_skills WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_experiences WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_educations WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cvs WHERE user_id = target_user_id;
  
  -- Delete their event registrations
  DELETE FROM event_registrations WHERE user_id = target_user_id;
  
  -- Delete their survey responses
  DELETE FROM survey_responses WHERE user_id = target_user_id;
  
  -- Delete their friend requests
  DELETE FROM friend_requests WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete their notifications
  DELETE FROM notifications WHERE user_id = target_user_id;
  
END;
$$;

-- Delete user function
CREATE FUNCTION delete_user_permanently(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if user is admin
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Yetkisiz: Sadece adminler kullanıcı silebilir';
  END IF;
  
  -- First block and cleanup
  PERFORM block_user_and_cleanup(target_user_id);
  
  -- Delete profile
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;
