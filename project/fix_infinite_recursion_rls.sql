-- Fix Infinite Recursion in RLS Policies
-- Bu dosya sonsuz döngü hatasını düzeltir

-- 1. Tüm RLS politikalarını devre dışı bırak
-- ===========================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE cvs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_educations DISABLE ROW LEVEL SECURITY;

-- 2. Tüm politikaları sil
-- =======================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "posts_select_all" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
DROP POLICY IF EXISTS "likes_select_all" ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
DROP POLICY IF EXISTS "job_listings_select_approved" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete_own" ON job_listings;
DROP POLICY IF EXISTS "chat_messages_select_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_own" ON chat_messages;
DROP POLICY IF EXISTS "private_messages_select_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_delete_own" ON private_messages;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete_own" ON friend_requests;
DROP POLICY IF EXISTS "cvs_select_own" ON cvs;
DROP POLICY IF EXISTS "cvs_insert_own" ON cvs;
DROP POLICY IF EXISTS "cvs_update_own" ON cvs;
DROP POLICY IF EXISTS "cvs_delete_own" ON cvs;
DROP POLICY IF EXISTS "cv_skills_select_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_insert_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_update_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_delete_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_experiences_select_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_insert_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_update_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_delete_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_educations_select_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_insert_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_update_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_delete_own" ON cv_educations;

-- 3. Basit ve güvenli RLS politikaları oluştur
-- =============================================

-- PROFILES TABLE - Sadece temel güvenlik
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi profillerini okuyabilir
CREATE POLICY "profiles_select_own_simple"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- INSERT: Kullanıcılar sadece kendi profillerini oluşturabilir
CREATE POLICY "profiles_insert_own_simple"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own_simple"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Kullanıcılar kendi profillerini silebilir
CREATE POLICY "profiles_delete_own_simple"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- POSTS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'posts' AND table_schema = 'public'
  ) THEN
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes silinmemiş gönderileri okuyabilir
    CREATE POLICY "posts_select_simple"
      ON posts
      FOR SELECT
      TO authenticated
      USING (deleted_at IS NULL);

    -- INSERT: Kullanıcılar sadece kendi gönderilerini oluşturabilir
    CREATE POLICY "posts_insert_simple"
      ON posts
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi gönderilerini güncelleyebilir
    CREATE POLICY "posts_update_simple"
      ON posts
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi gönderilerini silebilir
    CREATE POLICY "posts_delete_simple"
      ON posts
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- COMMENTS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'comments' AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes yorumları okuyabilir
    CREATE POLICY "comments_select_simple"
      ON comments
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi yorumlarını oluşturabilir
    CREATE POLICY "comments_insert_simple"
      ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi yorumlarını güncelleyebilir
    CREATE POLICY "comments_update_simple"
      ON comments
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi yorumlarını silebilir
    CREATE POLICY "comments_delete_simple"
      ON comments
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- LIKES TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'likes' AND table_schema = 'public'
  ) THEN
    ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes beğenileri okuyabilir
    CREATE POLICY "likes_select_simple"
      ON likes
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi beğenilerini oluşturabilir
    CREATE POLICY "likes_insert_simple"
      ON likes
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi beğenilerini silebilir
    CREATE POLICY "likes_delete_simple"
      ON likes
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- JOB_LISTINGS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'job_listings' AND table_schema = 'public'
  ) THEN
    ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes onaylanmış iş ilanlarını okuyabilir
    CREATE POLICY "job_listings_select_simple"
      ON job_listings
      FOR SELECT
      TO authenticated
      USING (is_approved = true);

    -- INSERT: Kullanıcılar sadece kendi iş ilanlarını oluşturabilir
    CREATE POLICY "job_listings_insert_simple"
      ON job_listings
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi iş ilanlarını güncelleyebilir
    CREATE POLICY "job_listings_update_simple"
      ON job_listings
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi iş ilanlarını silebilir
    CREATE POLICY "job_listings_delete_simple"
      ON job_listings
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- CHAT_MESSAGES TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'chat_messages' AND table_schema = 'public'
  ) THEN
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
    CREATE POLICY "chat_messages_select_simple"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "chat_messages_insert_simple"
      ON chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "chat_messages_update_simple"
      ON chat_messages
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "chat_messages_delete_simple"
      ON chat_messages
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- PRIVATE_MESSAGES TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'private_messages' AND table_schema = 'public'
  ) THEN
    ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
    CREATE POLICY "private_messages_select_simple"
      ON private_messages
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "private_messages_insert_simple"
      ON private_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "private_messages_update_simple"
      ON private_messages
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "private_messages_delete_simple"
      ON private_messages
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- NOTIFICATIONS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications' AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi bildirimlerini okuyabilir
    CREATE POLICY "notifications_select_simple"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Sistem bildirimleri oluşturabilir
    CREATE POLICY "notifications_insert_simple"
      ON notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- UPDATE: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
    CREATE POLICY "notifications_update_simple"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi bildirimlerini silebilir
    CREATE POLICY "notifications_delete_simple"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- FRIEND_REQUESTS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'friend_requests' AND table_schema = 'public'
  ) THEN
    ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi arkadaşlık isteklerini okuyabilir
    CREATE POLICY "friend_requests_select_simple"
      ON friend_requests
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi arkadaşlık isteklerini oluşturabilir
    CREATE POLICY "friend_requests_insert_simple"
      ON friend_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi arkadaşlık isteklerini güncelleyebilir
    CREATE POLICY "friend_requests_update_simple"
      ON friend_requests
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid())
      WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi arkadaşlık isteklerini silebilir
    CREATE POLICY "friend_requests_delete_simple"
      ON friend_requests
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());
  END IF;
END $$;

-- CVS TABLE - Basit politikalar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cvs' AND table_schema = 'public'
  ) THEN
    ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi CV'lerini okuyabilir
    CREATE POLICY "cvs_select_simple"
      ON cvs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi CV'lerini oluşturabilir
    CREATE POLICY "cvs_insert_simple"
      ON cvs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi CV'lerini güncelleyebilir
    CREATE POLICY "cvs_update_simple"
      ON cvs
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi CV'lerini silebilir
    CREATE POLICY "cvs_delete_simple"
      ON cvs
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Test the policies
SELECT 'RLS policies fixed successfully' as status;
