-- Block user and cleanup all their content
-- This function will be called when admin/moderator blocks a user

CREATE OR REPLACE FUNCTION block_user_and_cleanup(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  target_user_role text;
  target_user_name text;
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
  
  -- Get target user info
  SELECT role, first_name || ' ' || last_name INTO target_user_role, target_user_name
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
  
  -- Delete all their private messages (both sent and received)
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
  DELETE FROM cv_certifications WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_educations WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cv_experiences WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = target_user_id);
  DELETE FROM cvs WHERE user_id = target_user_id;
  
  -- Delete all their friend requests
  DELETE FROM friend_requests WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete all their room memberships
  DELETE FROM chat_room_members WHERE user_id = target_user_id;
  
  -- Log the action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    description,
    created_at
  ) VALUES (
    auth.uid(),
    'block_user_cleanup',
    target_user_id,
    target_user_name || ' isimli kullanıcı engellendi ve tüm içerikleri silindi',
    now()
  );
  
END;
$$;

-- Create permanent user deletion function
CREATE OR REPLACE FUNCTION delete_user_permanently(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    target_user_role text;
    target_user_name text;
BEGIN
    -- Get caller's role
    SELECT role INTO caller_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- Check caller's authorization
    IF caller_role IS NULL THEN
        RAISE EXCEPTION 'Yetkisiz: Kullanıcı bulunamadı';
    END IF;

    IF caller_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Yetkisiz: Sadece admin ve moderatörler kullanıcı silebilir';
    END IF;

    -- Get target user info
    SELECT role, first_name || ' ' || last_name 
    INTO target_user_role, target_user_name
    FROM public.profiles 
    WHERE id = target_user_id;

    -- Check target user
    IF target_user_role IS NULL THEN
        RAISE EXCEPTION 'Hata: Silinecek kullanıcı bulunamadı';
    END IF;

    IF target_user_role = 'admin' THEN
        RAISE EXCEPTION 'Hata: Admin kullanıcılar silinemez';
    END IF;

    -- First block and cleanup all content
    PERFORM block_user_and_cleanup(target_user_id);

    -- Delete profile
  -- Delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;

  -- Log the action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    description,
    created_at
  ) VALUES (
    auth.uid(),
    'delete_user_permanent',
    target_user_id,
    target_user_name || ' isimli kullanıcı kalıcı olarak silindi',
    now()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION block_user_and_cleanup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_permanently(UUID) TO authenticated;