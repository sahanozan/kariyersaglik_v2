-- 🔥 TÜM HATALARI DÜZELT - Kapsamlı Çözüm
-- Bu dosya tüm sütunları, RLS politikalarını ve fonksiyonları düzeltir

-- ==============================================
-- 1. TÜM GEREKLİ SÜTUNLARI EKLE
-- ==============================================

-- Profiles tablosuna soft delete sütunları
DO $$
BEGIN
    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'profiles.deleted_at sütunu eklendi';
    END IF;

    -- deletion_reason sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deletion_reason') THEN
        ALTER TABLE profiles ADD COLUMN deletion_reason text;
        RAISE NOTICE 'profiles.deletion_reason sütunu eklendi';
    END IF;

    -- deleted_by sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_by') THEN
        ALTER TABLE profiles ADD COLUMN deleted_by uuid;
        RAISE NOTICE 'profiles.deleted_by sütunu eklendi';
    END IF;

    -- is_blocked sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false;
        RAISE NOTICE 'profiles.is_blocked sütunu eklendi';
    END IF;
END $$;

-- Posts tablosuna user_id ve deleted_at sütunları
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'user_id') THEN
        ALTER TABLE posts ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'posts.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'deleted_at') THEN
        ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'posts.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Comments tablosuna user_id ve deleted_at sütunları
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE comments ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'comments.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comments' AND column_name = 'deleted_at') THEN
        ALTER TABLE comments ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'comments.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Job listings tablosuna user_id ve deleted_at sütunları
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_listings' AND column_name = 'user_id') THEN
        ALTER TABLE job_listings ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'job_listings.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_listings' AND column_name = 'deleted_at') THEN
        ALTER TABLE job_listings ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'job_listings.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Likes tablosuna user_id sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'likes' AND column_name = 'user_id') THEN
        ALTER TABLE likes ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'likes.user_id sütunu eklendi';
    END IF;
END $$;

-- Chat messages tablosuna user_id ve deleted_at sütunları
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'user_id') THEN
        ALTER TABLE chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'chat_messages.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE chat_messages ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'chat_messages.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Private messages tablosuna sender_id ve receiver_id sütunları
DO $$
BEGIN
    -- sender_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'private_messages' AND column_name = 'sender_id') THEN
        ALTER TABLE private_messages ADD COLUMN sender_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'private_messages.sender_id sütunu eklendi';
    END IF;

    -- receiver_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'private_messages' AND column_name = 'receiver_id') THEN
        ALTER TABLE private_messages ADD COLUMN receiver_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'private_messages.receiver_id sütunu eklendi';
    END IF;
END $$;

-- Notifications tablosuna user_id sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE notifications ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'notifications.user_id sütunu eklendi';
    END IF;
END $$;

-- Friend requests tablosuna sender_id ve receiver_id sütunları
DO $$
BEGIN
    -- sender_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'friend_requests' AND column_name = 'sender_id') THEN
        ALTER TABLE friend_requests ADD COLUMN sender_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'friend_requests.sender_id sütunu eklendi';
    END IF;

    -- receiver_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'friend_requests' AND column_name = 'receiver_id') THEN
        ALTER TABLE friend_requests ADD COLUMN receiver_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'friend_requests.receiver_id sütunu eklendi';
    END IF;
END $$;

-- CVs tablosuna user_id sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cvs' AND column_name = 'user_id') THEN
        ALTER TABLE cvs ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'cvs.user_id sütunu eklendi';
    END IF;
END $$;

-- ==============================================
-- 2. TÜM RLS POLİTİKALARINI DEVRE DIŞI BIRAK
-- ==============================================

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cvs DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. TÜM ESKİ POLİTİKALARI SİL
-- ==============================================

-- Tüm tablolar için politikaları sil
DO $$ 
DECLARE
    table_name text;
    pol RECORD;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['profiles', 'posts', 'comments', 'likes', 'job_listings', 'chat_messages', 'private_messages', 'notifications', 'friend_requests', 'cvs'])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON ' || table_name;
        END LOOP;
    END LOOP;
END $$;

-- ==============================================
-- 4. RLS'İ TEKRAR AKTİFLEŞTİR
-- ==============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. BASIT, RECURSIVE OLMAYAN POLİTİKALAR
-- ==============================================

-- ========== PROFILES POLİTİKALARI ==========

-- Herkes kendi profilini görebilir
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Herkes kendi profilini oluşturabilir
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Herkes kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin kontrolü (email bazlı - recursive değil)
CREATE POLICY "profiles_admin_all"
    ON profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'ozansahan@outlook.com'
        )
    );

-- ========== POSTS POLİTİKALARI ==========

-- Herkes aktif postları görebilir
CREATE POLICY "posts_select_all"
    ON posts FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Herkes kendi postunu oluşturabilir
CREATE POLICY "posts_insert_own"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi postunu güncelleyebilir
CREATE POLICY "posts_update_own"
    ON posts FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi postunu silebilir
CREATE POLICY "posts_delete_own"
    ON posts FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== COMMENTS POLİTİKALARI ==========

-- Herkes aktif yorumları görebilir
CREATE POLICY "comments_select_all"
    ON comments FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Herkes yorum yapabilir
CREATE POLICY "comments_insert_own"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi yorumunu güncelleyebilir
CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi yorumunu silebilir
CREATE POLICY "comments_delete_own"
    ON comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== LIKES POLİTİKALARI ==========

-- Herkes beğenileri görebilir
CREATE POLICY "likes_select_all"
    ON likes FOR SELECT
    TO authenticated
    USING (true);

-- Herkes beğeni yapabilir
CREATE POLICY "likes_insert_own"
    ON likes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi beğenisini silebilir
CREATE POLICY "likes_delete_own"
    ON likes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== JOB LISTINGS POLİTİKALARI ==========

-- Herkes aktif iş ilanlarını görebilir
CREATE POLICY "job_listings_select_all"
    ON job_listings FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Herkes ilan oluşturabilir
CREATE POLICY "job_listings_insert_own"
    ON job_listings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi ilanını güncelleyebilir
CREATE POLICY "job_listings_update_own"
    ON job_listings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi ilanını silebilir
CREATE POLICY "job_listings_delete_own"
    ON job_listings FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== CHAT MESSAGES POLİTİKALARI ==========

-- Herkes aktif mesajları görebilir
CREATE POLICY "chat_messages_select_all"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Herkes mesaj gönderebilir
CREATE POLICY "chat_messages_insert_own"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi mesajını güncelleyebilir
CREATE POLICY "chat_messages_update_own"
    ON chat_messages FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi mesajını silebilir
CREATE POLICY "chat_messages_delete_own"
    ON chat_messages FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== PRIVATE MESSAGES POLİTİKALARI ==========

-- Kendi mesajlarını görebilir
CREATE POLICY "private_messages_select_own"
    ON private_messages FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Mesaj gönderebilir
CREATE POLICY "private_messages_insert_own"
    ON private_messages FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Kendi mesajını güncelleyebilir
CREATE POLICY "private_messages_update_own"
    ON private_messages FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Kendi mesajını silebilir
CREATE POLICY "private_messages_delete_own"
    ON private_messages FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ========== NOTIFICATIONS POLİTİKALARI ==========

-- Kendi bildirimlerini görebilir
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Bildirim oluşturabilir
CREATE POLICY "notifications_insert_own"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi bildirimini güncelleyebilir
CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi bildirimini silebilir
CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========== FRIEND REQUESTS POLİTİKALARI ==========

-- Kendi isteklerini görebilir
CREATE POLICY "friend_requests_select_own"
    ON friend_requests FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Arkadaşlık isteği gönderebilir
CREATE POLICY "friend_requests_insert_own"
    ON friend_requests FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Kendi isteğini güncelleyebilir
CREATE POLICY "friend_requests_update_own"
    ON friend_requests FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Kendi isteğini silebilir
CREATE POLICY "friend_requests_delete_own"
    ON friend_requests FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ========== CVs POLİTİKALARI ==========

-- Kendi CV'lerini görebilir
CREATE POLICY "cvs_select_own"
    ON cvs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- CV oluşturabilir
CREATE POLICY "cvs_insert_own"
    ON cvs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Kendi CV'sini güncelleyebilir
CREATE POLICY "cvs_update_own"
    ON cvs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi CV'sini silebilir
CREATE POLICY "cvs_delete_own"
    ON cvs FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ==============================================
-- 6. SUPABASE RPC FONKSİYONLARI
-- ==============================================

-- soft_delete_user fonksiyonu (önce eski fonksiyonu sil)
DROP FUNCTION IF EXISTS soft_delete_user(uuid, text);
DROP FUNCTION IF EXISTS soft_delete_user(uuid);

CREATE FUNCTION soft_delete_user(target_user_id uuid, reason text DEFAULT 'Admin tarafından silindi')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Sadece admin silebilir (email kontrolü)
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'ozansahan@outlook.com'
    ) THEN
        RAISE EXCEPTION 'Only admin can delete users';
    END IF;

    UPDATE public.profiles
    SET
        deleted_at = now(),
        deletion_reason = reason,
        deleted_by = auth.uid(),
        is_blocked = TRUE
    WHERE id = target_user_id;
END;
$$;

-- restore_user fonksiyonu (önce eski fonksiyonu sil)
DROP FUNCTION IF EXISTS restore_user(uuid);

CREATE FUNCTION restore_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'ozansahan@outlook.com'
    ) THEN
        RAISE EXCEPTION 'Only admin can restore users';
    END IF;

    UPDATE public.profiles
    SET
        deleted_at = NULL,
        deletion_reason = NULL,
        deleted_by = NULL,
        is_blocked = FALSE
    WHERE id = target_user_id;
END;
$$;

-- permanently_delete_user fonksiyonu (önce eski fonksiyonu sil)
DROP FUNCTION IF EXISTS permanently_delete_user(uuid);

CREATE FUNCTION permanently_delete_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'ozansahan@outlook.com'
    ) THEN
        RAISE EXCEPTION 'Only admin can permanently delete users';
    END IF;

    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- get_deleted_users fonksiyonu (önce eski fonksiyonu sil)
DROP FUNCTION IF EXISTS get_deleted_users();

CREATE FUNCTION get_deleted_users()
RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    branch text,
    city text,
    institution text,
    role text,
    is_blocked boolean,
    created_at timestamptz,
    last_login timestamptz,
    avatar_url text,
    deleted_at timestamptz,
    deletion_reason text,
    deleted_by_name text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        au.email,
        p.first_name,
        p.last_name,
        p.branch,
        p.city,
        p.institution,
        p.role,
        p.is_blocked,
        p.created_at,
        p.last_login,
        p.avatar_url,
        p.deleted_at,
        p.deletion_reason,
        COALESCE(pb.first_name || ' ' || pb.last_name, 'Unknown') AS deleted_by_name
    FROM
        public.profiles p
    JOIN
        auth.users au ON p.id = au.id
    LEFT JOIN
        public.profiles pb ON p.deleted_by = pb.id
    WHERE
        p.deleted_at IS NOT NULL
    ORDER BY
        p.deleted_at DESC;
END;
$$;

-- block_user_and_cleanup fonksiyonu (önce eski fonksiyonu sil)
DROP FUNCTION IF EXISTS block_user_and_cleanup(uuid);

CREATE FUNCTION block_user_and_cleanup(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'ozansahan@outlook.com'
    ) THEN
        RAISE EXCEPTION 'Only admin can block users';
    END IF;

    UPDATE public.profiles SET is_blocked = TRUE WHERE id = target_user_id;
    UPDATE public.posts SET deleted_at = now() WHERE user_id = target_user_id;
    UPDATE public.comments SET deleted_at = now() WHERE user_id = target_user_id;
    UPDATE public.job_listings SET deleted_at = now() WHERE user_id = target_user_id;
END;
$$;

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm sütunlar eklendi
-- Tüm RLS politikaları düzeltildi
-- Tüm RPC fonksiyonları oluşturuldu
-- Infinite recursion hatası çözüldü
-- Artık emülatör düzgün çalışacak
