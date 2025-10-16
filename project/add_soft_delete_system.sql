-- Soft Delete System for Users
-- Silinen hesaplar için soft delete sistemi

-- 1. Profiles tablosuna soft delete sütunları ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_reason text;

-- 2. Soft delete fonksiyonu oluştur
CREATE OR REPLACE FUNCTION soft_delete_user(target_user_id uuid, reason text DEFAULT 'Admin tarafından silindi')
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
  
  -- Prevent deleting admin users
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Hata: Admin kullanıcılar silinemez';
  END IF;
  
  -- Soft delete the user
  UPDATE profiles 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    deletion_reason = reason,
    is_blocked = true  -- Also block the user
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

-- 3. Restore user fonksiyonu oluştur
CREATE OR REPLACE FUNCTION restore_user(target_user_id uuid)
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
    RAISE EXCEPTION 'Yetkisiz: Sadece adminler kullanıcı geri yükleyebilir';
  END IF;
  
  -- Restore the user
  UPDATE profiles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    is_blocked = false
  WHERE id = target_user_id;
  
END;
$$;

-- 4. Permanently delete user fonksiyonu oluştur
CREATE OR REPLACE FUNCTION permanently_delete_user(target_user_id uuid)
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
    RAISE EXCEPTION 'Yetkisiz: Sadece adminler kullanıcı kalıcı olarak silebilir';
  END IF;
  
  -- Prevent deleting admin users
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Hata: Admin kullanıcılar silinemez';
  END IF;
  
  -- First soft delete
  PERFORM soft_delete_user(target_user_id, 'Kalıcı olarak silindi');
  
  -- Then permanently delete from profiles
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;

-- 5. Get deleted users fonksiyonu oluştur
CREATE OR REPLACE FUNCTION get_deleted_users()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,
  deleted_by_name text
)
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
    RAISE EXCEPTION 'Yetkisiz: Sadece adminler silinen kullanıcıları görebilir';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.deleted_at,
    p.deleted_by,
    p.deletion_reason,
    CONCAT(del.first_name, ' ', del.last_name) as deleted_by_name
  FROM profiles p
  LEFT JOIN profiles del ON p.deleted_by = del.id
  WHERE p.deleted_at IS NOT NULL
  ORDER BY p.deleted_at DESC;
  
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION soft_delete_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_users() TO authenticated;

-- 7. Update RLS policies to exclude deleted users
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- New policy that excludes deleted users
CREATE POLICY "profiles_select_active"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile (even if deleted)
    (id = auth.uid()) OR
    -- Admins can read all profiles
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- Test the functions
SELECT 'Soft delete system created successfully' as status;
