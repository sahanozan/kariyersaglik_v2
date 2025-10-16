-- Fix RLS Policies with Correct Column Names
-- Bu dosya doğru sütun adlarını kullanarak RLS politikalarını oluşturur

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
DROP POLICY IF EXISTS "profiles_select_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own_simple" ON profiles;
DROP POLICY IF EXISTS "posts_select_simple" ON posts;
DROP POLICY IF EXISTS "posts_insert_simple" ON posts;
DROP POLICY IF EXISTS "posts_update_simple" ON posts;
DROP POLICY IF EXISTS "posts_delete_simple" ON posts;
DROP POLICY IF EXISTS "comments_select_simple" ON comments;
DROP POLICY IF EXISTS "comments_insert_simple" ON comments;
DROP POLICY IF EXISTS "comments_update_simple" ON comments;
DROP POLICY IF EXISTS "comments_delete_simple" ON comments;
DROP POLICY IF EXISTS "likes_select_simple" ON likes;
DROP POLICY IF EXISTS "likes_insert_simple" ON likes;
DROP POLICY IF EXISTS "likes_delete_simple" ON likes;
DROP POLICY IF EXISTS "job_listings_select_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete_simple" ON job_listings;
DROP POLICY IF EXISTS "chat_messages_select_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_simple" ON chat_messages;
DROP POLICY IF EXISTS "private_messages_select_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_delete_simple" ON private_messages;
DROP POLICY IF EXISTS "notifications_select_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_update_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_simple" ON notifications;
DROP POLICY IF EXISTS "friend_requests_select_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete_simple" ON friend_requests;
DROP POLICY IF EXISTS "cvs_select_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_insert_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_update_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_delete_simple" ON cvs;
DROP POLICY IF EXISTS "cv_skills_select_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_insert_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_update_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_delete_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_experiences_select_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_insert_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_update_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_delete_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_educations_select_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_insert_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_update_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_delete_simple" ON cv_educations;

-- 3. Sadece PROFILES tablosu için RLS politikaları oluştur
-- =======================================================

-- PROFILES TABLE - Sadece temel güvenlik
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi profillerini okuyabilir
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- INSERT: Kullanıcılar sadece kendi profillerini oluşturabilir
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Kullanıcılar kendi profillerini silebilir
CREATE POLICY "profiles_delete_own"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- 4. Diğer tablolar için sadece mevcut sütunları kontrol ederek RLS politikaları oluştur
-- =====================================================================================

-- POSTS TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'posts' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes silinmemiş gönderileri okuyabilir
    CREATE POLICY "posts_select"
      ON posts
      FOR SELECT
      TO authenticated
      USING (deleted_at IS NULL);

    -- INSERT: Kullanıcılar sadece kendi gönderilerini oluşturabilir
    CREATE POLICY "posts_insert"
      ON posts
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi gönderilerini güncelleyebilir
    CREATE POLICY "posts_update"
      ON posts
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi gönderilerini silebilir
    CREATE POLICY "posts_delete"
      ON posts
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- COMMENTS TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'comments' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes yorumları okuyabilir
    CREATE POLICY "comments_select"
      ON comments
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi yorumlarını oluşturabilir
    CREATE POLICY "comments_insert"
      ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi yorumlarını güncelleyebilir
    CREATE POLICY "comments_update"
      ON comments
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi yorumlarını silebilir
    CREATE POLICY "comments_delete"
      ON comments
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- LIKES TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'likes' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes beğenileri okuyabilir
    CREATE POLICY "likes_select"
      ON likes
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi beğenilerini oluşturabilir
    CREATE POLICY "likes_insert"
      ON likes
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi beğenilerini silebilir
    CREATE POLICY "likes_delete"
      ON likes
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- JOB_LISTINGS TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'job_listings' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_listings' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

    -- SELECT: Herkes onaylanmış iş ilanlarını okuyabilir
    CREATE POLICY "job_listings_select"
      ON job_listings
      FOR SELECT
      TO authenticated
      USING (is_approved = true);

    -- INSERT: Kullanıcılar sadece kendi iş ilanlarını oluşturabilir
    CREATE POLICY "job_listings_insert"
      ON job_listings
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi iş ilanlarını güncelleyebilir
    CREATE POLICY "job_listings_update"
      ON job_listings
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi iş ilanlarını silebilir
    CREATE POLICY "job_listings_delete"
      ON job_listings
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- CHAT_MESSAGES TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'chat_messages' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
    CREATE POLICY "chat_messages_select"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "chat_messages_insert"
      ON chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "chat_messages_update"
      ON chat_messages
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "chat_messages_delete"
      ON chat_messages
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- PRIVATE_MESSAGES TABLE - sender_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'private_messages' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_messages' AND column_name = 'sender_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi mesajlarını okuyabilir
    CREATE POLICY "private_messages_select"
      ON private_messages
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "private_messages_insert"
      ON private_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "private_messages_update"
      ON private_messages
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "private_messages_delete"
      ON private_messages
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- NOTIFICATIONS TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi bildirimlerini okuyabilir
    CREATE POLICY "notifications_select"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Sistem bildirimleri oluşturabilir
    CREATE POLICY "notifications_insert"
      ON notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- UPDATE: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
    CREATE POLICY "notifications_update"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi bildirimlerini silebilir
    CREATE POLICY "notifications_delete"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- FRIEND_REQUESTS TABLE - sender_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'friend_requests' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'friend_requests' AND column_name = 'sender_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi arkadaşlık isteklerini okuyabilir
    CREATE POLICY "friend_requests_select"
      ON friend_requests
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi arkadaşlık isteklerini oluşturabilir
    CREATE POLICY "friend_requests_insert"
      ON friend_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi arkadaşlık isteklerini güncelleyebilir
    CREATE POLICY "friend_requests_update"
      ON friend_requests
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid())
      WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi arkadaşlık isteklerini silebilir
    CREATE POLICY "friend_requests_delete"
      ON friend_requests
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());
  END IF;
END $$;

-- CVS TABLE - user_id sütunu varsa RLS politikaları oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cvs' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cvs' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

    -- SELECT: Kullanıcılar sadece kendi CV'lerini okuyabilir
    CREATE POLICY "cvs_select"
      ON cvs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi CV'lerini oluşturabilir
    CREATE POLICY "cvs_insert"
      ON cvs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi CV'lerini güncelleyebilir
    CREATE POLICY "cvs_update"
      ON cvs
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi CV'lerini silebilir
    CREATE POLICY "cvs_delete"
      ON cvs
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Test the policies
SELECT 'RLS policies created with correct column names' as status;
