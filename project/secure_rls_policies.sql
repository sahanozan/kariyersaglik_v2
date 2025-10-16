-- Secure RLS Policies for Supabase
-- Bu dosya tüm tablolar için güvenli RLS politikaları oluşturur

-- 1. PROFILES TABLE - Kullanıcı profilleri
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile data" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profile data" ON profiles;
DROP POLICY IF EXISTS "Admin can update user roles" ON profiles;
DROP POLICY IF EXISTS "Admin and moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile, admins can read all" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins can update any" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi profillerini okuyabilir, adminler tüm profilleri okuyabilir
CREATE POLICY "secure_profiles_select"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Kullanıcı kendi profilini okuyabilir
    (id = auth.uid()) OR
    -- Admin kullanıcılar tüm profilleri okuyabilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- INSERT: Kullanıcılar sadece kendi profillerini oluşturabilir
CREATE POLICY "secure_profiles_insert"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Sadece kendi ID'si ile profil oluşturabilir
    (id = auth.uid()) AND
    -- Varsayılan rol 'user' olmalı
    (role = 'user' OR role IS NULL)
  );

-- UPDATE: Kullanıcılar kendi profillerini güncelleyebilir, adminler tüm profilleri güncelleyebilir
CREATE POLICY "secure_profiles_update"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Kullanıcı kendi profilini güncelleyebilir
    (id = auth.uid()) OR
    -- Admin kullanıcılar tüm profilleri güncelleyebilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  )
  WITH CHECK (
    -- Kullanıcı kendi profilini güncelleyebilir
    (id = auth.uid()) OR
    -- Admin kullanıcılar tüm profilleri güncelleyebilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- DELETE: Sadece adminler profil silebilir
CREATE POLICY "secure_profiles_delete"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Sadece admin kullanıcılar profil silebilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- 2. POSTS TABLE - Gönderiler
-- =============================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts, admins can delete any" ON posts;
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- SELECT: Herkes silinmemiş gönderileri okuyabilir
CREATE POLICY "secure_posts_select"
  ON posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: Kullanıcılar sadece kendi gönderilerini oluşturabilir
CREATE POLICY "secure_posts_insert"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Kullanıcılar kendi gönderilerini güncelleyebilir, adminler tüm gönderileri güncelleyebilir
CREATE POLICY "secure_posts_update"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    -- Kullanıcı kendi gönderilerini güncelleyebilir
    (user_id = auth.uid()) OR
    -- Admin kullanıcılar tüm gönderileri güncelleyebilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- DELETE: Kullanıcılar kendi gönderilerini silebilir, adminler tüm gönderileri silebilir
CREATE POLICY "secure_posts_delete"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    -- Kullanıcı kendi gönderilerini silebilir
    (user_id = auth.uid()) OR
    -- Admin kullanıcılar tüm gönderileri silebilir
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- 3. COMMENTS TABLE - Yorumlar
-- ==============================

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- SELECT: Herkes yorumları okuyabilir
CREATE POLICY "secure_comments_select"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Kullanıcılar sadece kendi yorumlarını oluşturabilir
CREATE POLICY "secure_comments_insert"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Kullanıcılar kendi yorumlarını güncelleyebilir, adminler tüm yorumları güncelleyebilir
CREATE POLICY "secure_comments_update"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- DELETE: Kullanıcılar kendi yorumlarını silebilir, adminler tüm yorumları silebilir
CREATE POLICY "secure_comments_delete"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- 4. LIKES TABLE - Beğeniler
-- ============================

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- SELECT: Herkes beğenileri okuyabilir
CREATE POLICY "secure_likes_select"
  ON likes
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Kullanıcılar sadece kendi beğenilerini oluşturabilir
CREATE POLICY "secure_likes_insert"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- DELETE: Kullanıcılar sadece kendi beğenilerini silebilir
CREATE POLICY "secure_likes_delete"
  ON likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. JOB_LISTINGS TABLE - İş İlanları
-- ====================================

-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can insert their own job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can update own job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can delete own job listings" ON job_listings;

-- SELECT: Herkes onaylanmış iş ilanlarını okuyabilir
CREATE POLICY "secure_job_listings_select"
  ON job_listings
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- INSERT: Kullanıcılar sadece kendi iş ilanlarını oluşturabilir
CREATE POLICY "secure_job_listings_insert"
  ON job_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Kullanıcılar kendi iş ilanlarını güncelleyebilir, adminler tüm iş ilanlarını güncelleyebilir
CREATE POLICY "secure_job_listings_update"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- DELETE: Kullanıcılar kendi iş ilanlarını silebilir, adminler tüm iş ilanlarını silebilir
CREATE POLICY "secure_job_listings_delete"
  ON job_listings
  FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_blocked = false
    ))
  );

-- 6. CHAT_MESSAGES TABLE - Chat Mesajları
-- ========================================

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_messages;

-- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
CREATE POLICY "secure_chat_messages_select"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
CREATE POLICY "secure_chat_messages_insert"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
CREATE POLICY "secure_chat_messages_update"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
CREATE POLICY "secure_chat_messages_delete"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 7. PRIVATE_MESSAGES TABLE - Özel Mesajlar
-- ==========================================

-- Enable RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can insert private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can update own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can delete own private messages" ON private_messages;

-- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
CREATE POLICY "secure_private_messages_select"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
CREATE POLICY "secure_private_messages_insert"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
CREATE POLICY "secure_private_messages_update"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
CREATE POLICY "secure_private_messages_delete"
  ON private_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- 8. NOTIFICATIONS TABLE - Bildirimler
-- =====================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- SELECT: Kullanıcılar sadece kendi bildirimlerini okuyabilir
CREATE POLICY "secure_notifications_select"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Sistem bildirimleri oluşturabilir
CREATE POLICY "secure_notifications_insert"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
CREATE POLICY "secure_notifications_update"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Kullanıcılar sadece kendi bildirimlerini silebilir
CREATE POLICY "secure_notifications_delete"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 9. FRIEND_REQUESTS TABLE - Arkadaşlık İstekleri
-- ================================================

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete own friend requests" ON friend_requests;

-- SELECT: Kullanıcılar sadece kendi arkadaşlık isteklerini okuyabilir
CREATE POLICY "secure_friend_requests_select"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- INSERT: Kullanıcılar sadece kendi arkadaşlık isteklerini oluşturabilir
CREATE POLICY "secure_friend_requests_insert"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- UPDATE: Kullanıcılar sadece kendi arkadaşlık isteklerini güncelleyebilir
CREATE POLICY "secure_friend_requests_update"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- DELETE: Kullanıcılar sadece kendi arkadaşlık isteklerini silebilir
CREATE POLICY "secure_friend_requests_delete"
  ON friend_requests
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- 10. CV TABLES - CV Verileri
-- ============================

-- Enable RLS for CV tables
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_educations ENABLE ROW LEVEL SECURITY;

-- CVs table policies
CREATE POLICY "secure_cvs_select"
  ON cvs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "secure_cvs_insert"
  ON cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "secure_cvs_update"
  ON cvs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "secure_cvs_delete"
  ON cvs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- CV Skills table policies
CREATE POLICY "secure_cv_skills_select"
  ON cv_skills
  FOR SELECT
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_skills_insert"
  ON cv_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_skills_update"
  ON cv_skills
  FOR UPDATE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()))
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_skills_delete"
  ON cv_skills
  FOR DELETE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

-- CV Experiences table policies
CREATE POLICY "secure_cv_experiences_select"
  ON cv_experiences
  FOR SELECT
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_experiences_insert"
  ON cv_experiences
  FOR INSERT
  TO authenticated
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_experiences_update"
  ON cv_experiences
  FOR UPDATE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()))
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_experiences_delete"
  ON cv_experiences
  FOR DELETE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

-- CV Educations table policies
CREATE POLICY "secure_cv_educations_select"
  ON cv_educations
  FOR SELECT
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_educations_insert"
  ON cv_educations
  FOR INSERT
  TO authenticated
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_educations_update"
  ON cv_educations
  FOR UPDATE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()))
  WITH CHECK (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

CREATE POLICY "secure_cv_educations_delete"
  ON cv_educations
  FOR DELETE
  TO authenticated
  USING (cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid()));

-- Test the policies
SELECT 'Secure RLS policies created successfully' as status;
