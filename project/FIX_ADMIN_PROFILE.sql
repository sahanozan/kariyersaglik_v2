-- 🔥 ADMIN PROFİL HATALARINI DÜZELT
-- Bu dosya admin profili yüklenmeme sorununu çözer

-- ==============================================
-- 1. PROFILES TABLOSU SÜTUNLARINI KONTROL ET
-- ==============================================

-- deleted_at sütunu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'profiles.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'profiles.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- role sütunu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
        RAISE NOTICE 'profiles.role sütunu eklendi';
    ELSE
        RAISE NOTICE 'profiles.role sütunu zaten mevcut';
    END IF;
END $$;

-- is_blocked sütunu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false;
        RAISE NOTICE 'profiles.is_blocked sütunu eklendi';
    ELSE
        RAISE NOTICE 'profiles.is_blocked sütunu zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 2. RLS POLİTİKALARINI DÜZELT
-- ==============================================

-- Profiles RLS politikalarını temizle ve yeniden oluştur
DO $$
BEGIN
    -- Mevcut politikaları sil
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_admin_all_access" ON profiles;
    DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
    
    -- RLS'yi etkinleştir
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Basit politikalar oluştur
    CREATE POLICY "profiles_select_own"
        ON profiles FOR SELECT
        TO authenticated
        USING (id = auth.uid());
        
    CREATE POLICY "profiles_insert_own"
        ON profiles FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
        
    CREATE POLICY "profiles_update_own"
        ON profiles FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
        
    CREATE POLICY "profiles_delete_own"
        ON profiles FOR DELETE
        TO authenticated
        USING (id = auth.uid());
        
    -- Admin'ler tüm profilleri görebilir
    CREATE POLICY "profiles_admin_select_all"
        ON profiles FOR SELECT
        TO authenticated
        USING (EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        ));
        
    RAISE NOTICE 'Profiles RLS politikaları oluşturuldu';
END $$;

-- ==============================================
-- 3. ADMIN KULLANICI OLUŞTUR (EĞER YOKSA)
-- ==============================================

-- Admin kullanıcı var mı kontrol et
DO $$
DECLARE
    admin_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE role = 'admin'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE NOTICE 'Admin kullanıcı bulunamadı. Lütfen manuel olarak admin kullanıcı oluşturun.';
    ELSE
        RAISE NOTICE 'Admin kullanıcı mevcut';
    END IF;
END $$;

-- ==============================================
-- 4. DİĞER TABLOLAR İÇİN RLS DÜZELT
-- ==============================================

-- Posts RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "posts_select_all" ON posts;
        DROP POLICY IF EXISTS "posts_insert_own" ON posts;
        DROP POLICY IF EXISTS "posts_update_own" ON posts;
        DROP POLICY IF EXISTS "posts_delete_own" ON posts;
        
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
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "posts_delete_own"
            ON posts FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Posts RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Comments RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "comments_select_all" ON comments;
        DROP POLICY IF EXISTS "comments_insert_own" ON comments;
        DROP POLICY IF EXISTS "comments_update_own" ON comments;
        DROP POLICY IF EXISTS "comments_delete_own" ON comments;
        
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
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "comments_delete_own"
            ON comments FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Comments RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Job listings RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_listings') THEN
        ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "job_listings_select_all" ON job_listings;
        DROP POLICY IF EXISTS "job_listings_insert_own" ON job_listings;
        DROP POLICY IF EXISTS "job_listings_update_own" ON job_listings;
        DROP POLICY IF EXISTS "job_listings_delete_own" ON job_listings;
        
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
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "job_listings_delete_own"
            ON job_listings FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Job listings RLS politikaları oluşturuldu';
    END IF;
END $$;

-- ==============================================
-- 5. PERFORMANCE İNDEXLERİ
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Profiles tablosu sütunları eklendi
-- RLS politikaları düzeltildi
-- Admin erişimi sağlandı
-- Performance indexleri eklendi
-- Artık admin profili yüklenmeli
