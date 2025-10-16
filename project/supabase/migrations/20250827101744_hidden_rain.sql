/*
  # Admin ve moderatörlerin paylaşım silme yetkisi

  1. Güncellenen Politikalar
    - Admin ve moderatörler tüm paylaşımları silebilir (UPDATE yetkisi)
    - Kullanıcılar kendi paylaşımlarını güncelleyebilir
  
  2. Güvenlik
    - RLS korunuyor
    - Sadece yetkili kişiler silme işlemi yapabilir
*/

-- Mevcut admin/moderatör UPDATE politikasını kaldır
DROP POLICY IF EXISTS "Admins and moderators can delete posts" ON posts;

-- Yeni admin/moderatör UPDATE politikası ekle
CREATE POLICY "Admins and moderators can update and delete posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    -- Admin veya moderatör ise tüm paylaşımları güncelleyebilir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
    OR 
    -- Kullanıcı kendi paylaşımını güncelleyebilir
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Admin veya moderatör ise tüm paylaşımları güncelleyebilir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
    OR 
    -- Kullanıcı kendi paylaşımını güncelleyebilir
    user_id = auth.uid()
  );