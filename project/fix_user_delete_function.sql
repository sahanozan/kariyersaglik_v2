-- Drop existing functions first
DROP FUNCTION IF EXISTS block_user_and_cleanup(uuid);
DROP FUNCTION IF EXISTS delete_user_permanently(uuid);

-- Fixed block user and cleanup function
CREATE OR REPLACE FUNCTION block_user_and_cleanup(target_user_id uuid)
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
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz: Kullanıcı bulunamadı';
  END IF;

  IF current_user_blocked = true THEN
    RAISE EXCEPTION 'Yetkisiz: Hesabınız engellenmiş durumda';
  END IF;
  
  -- Check if user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Yetkisiz: Sadece admin ve moderatörler kullanıcı engelleyebilir';
  END IF;
  
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM profiles 
  WHERE id = target_user_id;
  
  -- Check if target user exists
  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Hata: Kullanıcı bulunamadı';
  END IF;
  
  -- Prevent blocking admin users
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION 'Hata: Admin kullanıcılar engellenemez';
  END IF;
  
  -- Block the user
  UPDATE profiles 
  SET 
    is_blocked = true,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Delete all their posts
  DELETE FROM posts WHERE user_id = target_user_id;
  
  -- Delete all their comments
  DELETE FROM comments WHERE user_id = target_user_id;
  
  -- Delete all their likes
  DELETE FROM likes WHERE user_id = target_user_id;
  
  -- Delete all their private messages
  DELETE FROM private_messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete all their chat messages
  UPDATE chat_messages 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid()
  WHERE user_id = target_user_id;
  
  -- Delete all their job applications
  DELETE FROM job_applications WHERE user_id = target_user_id;
  
  -- Delete all their CV data
  DELETE FROM cv_skills WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_experiences WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_educations WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cvs WHERE user_id = target_user_id;
  
  -- Delete all their event registrations
  DELETE FROM event_registrations WHERE user_id = target_user_id;
  
  -- Delete all their survey responses
  DELETE FROM survey_responses WHERE user_id = target_user_id;
  
  -- Delete all their friend requests
  DELETE FROM friend_requests WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete all their notifications
  DELETE FROM notifications WHERE user_id = target_user_id;
  
END;
$$;

-- Fixed delete user permanently function
CREATE OR REPLACE FUNCTION delete_user_permanently(target_user_id uuid)
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
    RAISE EXCEPTION 'Yetkisiz: Kullanıcı bulunamadı veya engellenmiş';
  END IF;
  
  -- Check if user is admin
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Yetkisiz: Sadece adminler kullanıcı silebilir';
  END IF;
  
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM profiles 
  WHERE id = target_user_id;
  
  -- Check if target user exists
  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Hata: Silinecek kullanıcı bulunamadı';
  END IF;
  
  -- Prevent deleting admin users
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION 'Hata: Admin kullanıcılar silinemez';
  END IF;
  
  -- First block and cleanup all content
  PERFORM block_user_and_cleanup(target_user_id);
  
  -- Delete profile
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION block_user_and_cleanup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_permanently(uuid) TO authenticated;
