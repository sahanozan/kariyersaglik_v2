-- 🔥 ACİL: Infinite Recursion Hatası Düzeltmesi
-- Tüm RLS politikalarını temizle ve recursive olmayan basit politikalar oluştur

-- ==============================================
-- 1. TÜM RLS POLİTİKALARINI DEVRE DIŞI BIRAK
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
ALTER TABLE IF EXISTS treatment_algorithms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drugs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. TÜM ESKİ POLİTİKALARI SİL
-- ==============================================

-- Profiles politikaları
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Posts politikaları
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'posts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON posts';
    END LOOP;
END $$;

-- Comments politikaları
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'comments'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON comments';
    END LOOP;
END $$;

-- Job listings politikaları
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'job_listings'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON job_listings';
    END LOOP;
END $$;

-- Friend requests politikaları
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'friend_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON friend_requests';
    END LOOP;
END $$;

-- ==============================================
-- 3. SOFT DELETE SÜTUNLARINI EKLE
-- ==============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deletion_reason') THEN
        ALTER TABLE profiles ADD COLUMN deletion_reason text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_by') THEN
        ALTER TABLE profiles ADD COLUMN deleted_by uuid;
    END IF;
END $$;

-- ==============================================
-- 4. BASIT, RECURSIVE OLMAYAN POLİTİKALAR
-- ==============================================

-- RLS'i tekrar aktifleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES POLİTİKALARI (RECURSIVE YOK!) ==========

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

-- Admin kontrolü için ayrı basit politika (auth.users tablosunu kullan)
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

-- Kendi isteklerini güncelleyebilir
CREATE POLICY "friend_requests_update_own"
    ON friend_requests FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Kendi isteklerini silebilir
CREATE POLICY "friend_requests_delete_own"
    ON friend_requests FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ==============================================
-- 5. SUPABASE RPC FONKSİYONLARI
-- ==============================================

-- soft_delete_user fonksiyonu
CREATE OR REPLACE FUNCTION soft_delete_user(target_user_id uuid, reason text DEFAULT 'Admin tarafından silindi')
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

-- restore_user fonksiyonu
CREATE OR REPLACE FUNCTION restore_user(target_user_id uuid)
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

-- permanently_delete_user fonksiyonu
CREATE OR REPLACE FUNCTION permanently_delete_user(target_user_id uuid)
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

-- get_deleted_users fonksiyonu
CREATE OR REPLACE FUNCTION get_deleted_users()
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

-- block_user_and_cleanup fonksiyonu
CREATE OR REPLACE FUNCTION block_user_and_cleanup(target_user_id uuid)
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
-- Infinite recursion hatası çözüldü
-- Basit, recursive olmayan politikalar oluşturuldu
-- Admin email bazlı kontrol eklendi
-- Tüm RPC fonksiyonları oluşturuldu

