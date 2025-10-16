/*
  # Moderatör Yetkileri Güncellemesi

  Bu migration moderatör yetkilerini genişletir:
  
  1. Moderatörler artık kullanıcı engelleyebilir
  2. Moderatörler chat mesajlarını silebilir  
  3. Moderatörler paylaşımları silebilir
  4. Sadece ana admin (ozansahan@outlook.com) moderatör atayabilir
  
  ## Güvenlik
  - RLS politikaları güncellendi
  - Moderatör yetkileri genişletildi
  - Admin özel yetkileri korundu
*/

-- Chat mesajları için moderatör yetkisi güncelle
DROP POLICY IF EXISTS "Admin and moderators can delete messages" ON chat_messages;

CREATE POLICY "Admin and moderators can delete messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Kullanıcı engelleme için moderatör yetkisi ekle (helper function)
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'moderator')
    AND profiles.is_blocked = false
  );
END;
$$;

-- Sadece ana admin moderatör atayabilir (helper function)
CREATE OR REPLACE FUNCTION is_main_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email = 'ozansahan@outlook.com'
    AND profiles.role = 'admin'
  );
END;
$$;

-- Profiles tablosu için moderatör yetkileri güncelle
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

CREATE POLICY "Admin and moderators can block users"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (can_manage_users())
  WITH CHECK (can_manage_users());

-- Sadece ana admin role değiştirebilir
CREATE POLICY "Only main admin can change roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_main_admin() AND auth.uid() != id)
  WITH CHECK (is_main_admin() AND auth.uid() != id);

-- Posts için moderatör silme yetkisi güncelle
DROP POLICY IF EXISTS "Admins and moderators can delete posts" ON posts;

CREATE POLICY "Admins and moderators can delete posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Chat room members için moderatör yetkisi
CREATE POLICY "Moderators can manage room members"
  ON chat_room_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Friend requests için moderatör yetkisi
CREATE POLICY "Moderators can manage friend requests"
  ON friend_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Friendships için moderatör yetkisi
CREATE POLICY "Moderators can manage friendships"
  ON friendships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );