-- Clean and Create RLS Policies
-- Bu dosya mevcut politikaları temizleyip yenilerini oluşturur

-- 1. PROFILES TABLE - Mevcut politikaları temizle
-- =============================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
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
DROP POLICY IF EXISTS "secure_profiles_select" ON profiles;
DROP POLICY IF EXISTS "secure_profiles_insert" ON profiles;
DROP POLICY IF EXISTS "secure_profiles_update" ON profiles;
DROP POLICY IF EXISTS "secure_profiles_delete" ON profiles;

-- 2. POSTS TABLE - Mevcut politikaları temizle
-- ============================================
DROP POLICY IF EXISTS "posts_select_all" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts, admins can delete any" ON posts;
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;
DROP POLICY IF EXISTS "Users can read all posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can delete posts" ON posts;
DROP POLICY IF EXISTS "secure_posts_select" ON posts;
DROP POLICY IF EXISTS "secure_posts_insert" ON posts;
DROP POLICY IF EXISTS "secure_posts_update" ON posts;
DROP POLICY IF EXISTS "secure_posts_delete" ON posts;

-- 3. COMMENTS TABLE - Mevcut politikaları temizle
-- ===============================================
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
DROP POLICY IF EXISTS "Users can read comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "secure_comments_select" ON comments;
DROP POLICY IF EXISTS "secure_comments_insert" ON comments;
DROP POLICY IF EXISTS "secure_comments_update" ON comments;
DROP POLICY IF EXISTS "secure_comments_delete" ON comments;

-- 4. LIKES TABLE - Mevcut politikaları temizle
-- ============================================
DROP POLICY IF EXISTS "likes_select_all" ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
DROP POLICY IF EXISTS "Users can read likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "secure_likes_select" ON likes;
DROP POLICY IF EXISTS "secure_likes_insert" ON likes;
DROP POLICY IF EXISTS "secure_likes_delete" ON likes;

-- 5. JOB_LISTINGS TABLE - Mevcut politikaları temizle
-- ==================================================
DROP POLICY IF EXISTS "job_listings_select_approved" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete_own" ON job_listings;
DROP POLICY IF EXISTS "Users can read job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can insert their own job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can update own job listings" ON job_listings;
DROP POLICY IF EXISTS "Users can delete own job listings" ON job_listings;
DROP POLICY IF EXISTS "secure_job_listings_select" ON job_listings;
DROP POLICY IF EXISTS "secure_job_listings_insert" ON job_listings;
DROP POLICY IF EXISTS "secure_job_listings_update" ON job_listings;
DROP POLICY IF EXISTS "secure_job_listings_delete" ON job_listings;

-- 6. CHAT_MESSAGES TABLE - Mevcut politikaları temizle
-- ==================================================
DROP POLICY IF EXISTS "chat_messages_select_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_own" ON chat_messages;
DROP POLICY IF EXISTS "Users can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "secure_chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "secure_chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "secure_chat_messages_update" ON chat_messages;
DROP POLICY IF EXISTS "secure_chat_messages_delete" ON chat_messages;

-- 7. PRIVATE_MESSAGES TABLE - Mevcut politikaları temizle
-- =====================================================
DROP POLICY IF EXISTS "private_messages_select_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update_own" ON private_messages;
DROP POLICY IF EXISTS "private_messages_delete_own" ON private_messages;
DROP POLICY IF EXISTS "Users can read own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can insert private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can update own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can delete own private messages" ON private_messages;
DROP POLICY IF EXISTS "secure_private_messages_select" ON private_messages;
DROP POLICY IF EXISTS "secure_private_messages_insert" ON private_messages;
DROP POLICY IF EXISTS "secure_private_messages_update" ON private_messages;
DROP POLICY IF EXISTS "secure_private_messages_delete" ON private_messages;

-- 8. NOTIFICATIONS TABLE - Mevcut politikaları temizle
-- ====================================================
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "secure_notifications_select" ON notifications;
DROP POLICY IF EXISTS "secure_notifications_insert" ON notifications;
DROP POLICY IF EXISTS "secure_notifications_update" ON notifications;
DROP POLICY IF EXISTS "secure_notifications_delete" ON notifications;

-- 9. FRIEND_REQUESTS TABLE - Mevcut politikaları temizle
-- ====================================================
DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete_own" ON friend_requests;
DROP POLICY IF EXISTS "Users can read own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "secure_friend_requests_select" ON friend_requests;
DROP POLICY IF EXISTS "secure_friend_requests_insert" ON friend_requests;
DROP POLICY IF EXISTS "secure_friend_requests_update" ON friend_requests;
DROP POLICY IF EXISTS "secure_friend_requests_delete" ON friend_requests;

-- 10. CVS TABLE - Mevcut politikaları temizle
-- ===========================================
DROP POLICY IF EXISTS "cvs_select_own" ON cvs;
DROP POLICY IF EXISTS "cvs_insert_own" ON cvs;
DROP POLICY IF EXISTS "cvs_update_own" ON cvs;
DROP POLICY IF EXISTS "cvs_delete_own" ON cvs;
DROP POLICY IF EXISTS "Users can read own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;
DROP POLICY IF EXISTS "secure_cvs_select" ON cvs;
DROP POLICY IF EXISTS "secure_cvs_insert" ON cvs;
DROP POLICY IF EXISTS "secure_cvs_update" ON cvs;
DROP POLICY IF EXISTS "secure_cvs_delete" ON cvs;

-- 11. CV_SKILLS TABLE - Mevcut politikaları temizle
-- =================================================
DROP POLICY IF EXISTS "cv_skills_select_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_insert_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_update_own" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_delete_own" ON cv_skills;
DROP POLICY IF EXISTS "secure_cv_skills_select" ON cv_skills;
DROP POLICY IF EXISTS "secure_cv_skills_insert" ON cv_skills;
DROP POLICY IF EXISTS "secure_cv_skills_update" ON cv_skills;
DROP POLICY IF EXISTS "secure_cv_skills_delete" ON cv_skills;

-- 12. CV_EXPERIENCES TABLE - Mevcut politikaları temizle
-- ====================================================
DROP POLICY IF EXISTS "cv_experiences_select_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_insert_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_update_own" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_delete_own" ON cv_experiences;
DROP POLICY IF EXISTS "secure_cv_experiences_select" ON cv_experiences;
DROP POLICY IF EXISTS "secure_cv_experiences_insert" ON cv_experiences;
DROP POLICY IF EXISTS "secure_cv_experiences_update" ON cv_experiences;
DROP POLICY IF EXISTS "secure_cv_experiences_delete" ON cv_experiences;

-- 13. CV_EDUCATIONS TABLE - Mevcut politikaları temizle
-- ====================================================
DROP POLICY IF EXISTS "cv_educations_select_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_insert_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_update_own" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_delete_own" ON cv_educations;
DROP POLICY IF EXISTS "secure_cv_educations_select" ON cv_educations;
DROP POLICY IF EXISTS "secure_cv_educations_insert" ON cv_educations;
DROP POLICY IF EXISTS "secure_cv_educations_update" ON cv_educations;
DROP POLICY IF EXISTS "secure_cv_educations_delete" ON cv_educations;

-- Şimdi yeni politikaları oluştur
-- ===============================

-- 1. PROFILES TABLE - Yeni politikalar
-- ====================================
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

-- 2. POSTS TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- =============================================================
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
    CREATE POLICY "posts_select_all"
      ON posts
      FOR SELECT
      TO authenticated
      USING (deleted_at IS NULL);

    -- INSERT: Kullanıcılar sadece kendi gönderilerini oluşturabilir
    CREATE POLICY "posts_insert_own"
      ON posts
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi gönderilerini güncelleyebilir
    CREATE POLICY "posts_update_own"
      ON posts
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi gönderilerini silebilir
    CREATE POLICY "posts_delete_own"
      ON posts
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 3. COMMENTS TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- ================================================================
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
    CREATE POLICY "comments_select_all"
      ON comments
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi yorumlarını oluşturabilir
    CREATE POLICY "comments_insert_own"
      ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi yorumlarını güncelleyebilir
    CREATE POLICY "comments_update_own"
      ON comments
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi yorumlarını silebilir
    CREATE POLICY "comments_delete_own"
      ON comments
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 4. LIKES TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- =============================================================
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
    CREATE POLICY "likes_select_all"
      ON likes
      FOR SELECT
      TO authenticated
      USING (true);

    -- INSERT: Kullanıcılar sadece kendi beğenilerini oluşturabilir
    CREATE POLICY "likes_insert_own"
      ON likes
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi beğenilerini silebilir
    CREATE POLICY "likes_delete_own"
      ON likes
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 5. JOB_LISTINGS TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- ====================================================================
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
    CREATE POLICY "job_listings_select_approved"
      ON job_listings
      FOR SELECT
      TO authenticated
      USING (is_approved = true);

    -- INSERT: Kullanıcılar sadece kendi iş ilanlarını oluşturabilir
    CREATE POLICY "job_listings_insert_own"
      ON job_listings
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi iş ilanlarını güncelleyebilir
    CREATE POLICY "job_listings_update_own"
      ON job_listings
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi iş ilanlarını silebilir
    CREATE POLICY "job_listings_delete_own"
      ON job_listings
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 6. CHAT_MESSAGES TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- ====================================================================
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
    CREATE POLICY "chat_messages_select_own"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "chat_messages_insert_own"
      ON chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "chat_messages_update_own"
      ON chat_messages
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "chat_messages_delete_own"
      ON chat_messages
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 7. PRIVATE_MESSAGES TABLE - Yeni politikalar (eğer sender_id sütunu varsa)
-- =========================================================================
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
    CREATE POLICY "private_messages_select_own"
      ON private_messages
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi mesajlarını oluşturabilir
    CREATE POLICY "private_messages_insert_own"
      ON private_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi mesajlarını güncelleyebilir
    CREATE POLICY "private_messages_update_own"
      ON private_messages
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi mesajlarını silebilir
    CREATE POLICY "private_messages_delete_own"
      ON private_messages
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- 8. NOTIFICATIONS TABLE - Yeni politikalar (eğer user_id sütunu varsa)
-- ====================================================================
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
    CREATE POLICY "notifications_select_own"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT: Sistem bildirimleri oluşturabilir
    CREATE POLICY "notifications_insert_all"
      ON notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- UPDATE: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
    CREATE POLICY "notifications_update_own"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi bildirimlerini silebilir
    CREATE POLICY "notifications_delete_own"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 9. FRIEND_REQUESTS TABLE - Yeni politikalar (eğer sender_id sütunu varsa)
-- =========================================================================
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
    CREATE POLICY "friend_requests_select_own"
      ON friend_requests
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- INSERT: Kullanıcılar sadece kendi arkadaşlık isteklerini oluşturabilir
    CREATE POLICY "friend_requests_insert_own"
      ON friend_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid());

    -- UPDATE: Kullanıcılar sadece kendi arkadaşlık isteklerini güncelleyebilir
    CREATE POLICY "friend_requests_update_own"
      ON friend_requests
      FOR UPDATE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid())
      WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

    -- DELETE: Kullanıcılar sadece kendi arkadaşlık isteklerini silebilir
    CREATE POLICY "friend_requests_delete_own"
      ON friend_requests
      FOR DELETE
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());
  END IF;
END $$;

-- Test the policies
SELECT 'RLS policies cleaned and recreated successfully' as status;
