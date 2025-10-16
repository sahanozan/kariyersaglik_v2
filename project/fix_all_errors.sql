-- Fix All Emulator Errors
-- Bu dosya emülatörde görülen tüm hataları düzeltir
-- Çalıştırma: Supabase SQL Editor'de bu dosyayı çalıştırın

-- ==============================================
-- 1. Soft Delete Fonksiyonlarını Oluştur
-- ==============================================

-- soft_delete_user fonksiyonu
CREATE OR REPLACE FUNCTION soft_delete_user(target_user_id uuid, reason text DEFAULT 'Admin tarafından silindi')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    admin_user_id := auth.uid();

    -- Admin/moderator kontrolü
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role IN ('admin', 'moderator')) THEN
        RAISE EXCEPTION 'Insufficient permissions: Only admins or moderators can soft delete users.';
    END IF;

    -- Admin kullanıcılarını silme engeli
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot soft delete an admin user.';
    END IF;

    -- Kullanıcıyı soft delete yap
    UPDATE public.profiles
    SET
        deleted_at = now(),
        deletion_reason = reason,
        deleted_by = admin_user_id,
        is_blocked = TRUE
    WHERE id = target_user_id;
END;
$$;

-- restore_user fonksiyonu
CREATE OR REPLACE FUNCTION restore_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    admin_user_id := auth.uid();

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role IN ('admin', 'moderator')) THEN
        RAISE EXCEPTION 'Insufficient permissions: Only admins or moderators can restore users.';
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
DECLARE
    admin_user_id uuid;
BEGIN
    admin_user_id := auth.uid();

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role IN ('admin', 'moderator')) THEN
        RAISE EXCEPTION 'Insufficient permissions: Only admins or moderators can permanently delete users.';
    END IF;

    -- Admin kullanıcılarını silme engeli
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot permanently delete an admin user.';
    END IF;

    -- Önce profiles tablosundan sil (CASCADE ile ilişkili tablolar da silinir)
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- Auth tablosundan da sil
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
        pb.first_name || ' ' || pb.last_name AS deleted_by_name
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

-- ==============================================
-- 2. Block User Fonksiyonunu Oluştur
-- ==============================================

CREATE OR REPLACE FUNCTION block_user_and_cleanup(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    admin_user_id := auth.uid();

    -- Admin/moderator kontrolü
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role IN ('admin', 'moderator')) THEN
        RAISE EXCEPTION 'Insufficient permissions: Only admins or moderators can block users.';
    END IF;

    -- Admin kullanıcılarını bloklama engeli
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot block an admin user.';
    END IF;

    -- Kullanıcıyı blokla
    UPDATE public.profiles
    SET is_blocked = TRUE
    WHERE id = target_user_id;

    -- İlgili içerikleri temizle (opsiyonel)
    UPDATE public.posts SET deleted_at = now() WHERE user_id = target_user_id;
    UPDATE public.comments SET deleted_at = now() WHERE user_id = target_user_id;
    UPDATE public.job_listings SET deleted_at = now() WHERE user_id = target_user_id;
END;
$$;

-- ==============================================
-- 3. Profiles Tablosuna Gerekli Sütunları Ekle
-- ==============================================

DO $$
BEGIN
    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
    END IF;

    -- deletion_reason sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deletion_reason') THEN
        ALTER TABLE profiles ADD COLUMN deletion_reason text;
    END IF;

    -- deleted_by sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_by') THEN
        ALTER TABLE profiles ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- ==============================================
-- 4. Basit RLS Politikaları (Recursive hata engelleme)
-- ==============================================

-- Profiles için basit politikalar
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Kullanıcılar kendi profillerini oluşturabilir
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ==============================================
-- 5. Admin Fonksiyonu (Recursive engelleme)
-- ==============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
        AND (is_blocked = false OR is_blocked IS NULL)
        AND (deleted_at IS NULL)
    );
$$;

-- Admin için ek politika
DROP POLICY IF EXISTS "profiles_admin_access" ON profiles;
CREATE POLICY "profiles_admin_access"
    ON profiles FOR ALL
    TO authenticated
    USING (is_admin());

-- ==============================================
-- 6. Posts için Basit RLS
-- ==============================================

DROP POLICY IF EXISTS "posts_select_all" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_all"
    ON posts FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "posts_insert_own"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own"
    ON posts FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "posts_delete_own"
    ON posts FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- ==============================================
-- 7. Comments için Basit RLS
-- ==============================================

DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all"
    ON comments FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "comments_insert_own"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "comments_delete_own"
    ON comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- ==============================================
-- 8. Job Listings için Basit RLS
-- ==============================================

DROP POLICY IF EXISTS "job_listings_select_all" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update_own" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete_own" ON job_listings;

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_listings_select_all"
    ON job_listings FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "job_listings_insert_own"
    ON job_listings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "job_listings_update_own"
    ON job_listings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "job_listings_delete_own"
    ON job_listings FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- ==============================================
-- Tamamlandı!
-- ==============================================
-- Bu script tüm temel hataları düzeltir
-- Supabase Dashboard > SQL Editor'de çalıştırın

