-- 🚨 ACİL DÜZELTME - Infinite Recursion Hatası
-- Bu dosya sonsuz döngü hatasını hemen düzeltir

-- ==============================================
-- 1. TÜM RLS POLİTİKALARINI KALDIR
-- ==============================================

-- Profiles tablosu için tüm politikaları kaldır
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Profiles tablosu için tüm politikaları kaldır
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON profiles';
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
    
    -- RLS'yi geçici olarak devre dışı bırak
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Profiles RLS devre dışı bırakıldı';
END $$;

-- Diğer tablolar için de politikaları kaldır
DO $$
DECLARE
    table_name text;
    policy_name text;
BEGIN
    FOR table_name IN (SELECT relname FROM pg_class WHERE relkind = 'r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        -- Her tablo için politikaları kaldır
        FOR policy_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON ' || quote_ident(table_name);
        END LOOP;
        
        -- RLS'yi devre dışı bırak
        EXECUTE 'ALTER TABLE ' || quote_ident(table_name) || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Table % RLS disabled', table_name;
    END LOOP;
END $$;

-- ==============================================
-- 2. GÜVENLİ RLS POLİTİKALARI OLUŞTUR
-- ==============================================

-- Profiles için basit politikalar
DO $$
BEGIN
    -- RLS'yi etkinleştir
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Sadece kendi profilini görebilir
    CREATE POLICY "profiles_select_own"
        ON profiles FOR SELECT
        TO authenticated
        USING (id = auth.uid());
        
    -- Sadece kendi profilini güncelleyebilir
    CREATE POLICY "profiles_update_own"
        ON profiles FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
        
    -- Sadece kendi profilini silebilir
    CREATE POLICY "profiles_delete_own"
        ON profiles FOR DELETE
        TO authenticated
        USING (id = auth.uid());
        
    -- Yeni profil oluşturabilir
    CREATE POLICY "profiles_insert_own"
        ON profiles FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
        
    RAISE NOTICE 'Profiles için güvenli RLS politikaları oluşturuldu';
END $$;

-- Posts için basit politikalar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        -- Herkes tüm postları görebilir
        CREATE POLICY "posts_select_all"
            ON posts FOR SELECT
            TO authenticated
            USING (true);
            
        -- Sadece kendi postunu oluşturabilir
        CREATE POLICY "posts_insert_own"
            ON posts FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi postunu güncelleyebilir
        CREATE POLICY "posts_update_own"
            ON posts FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi postunu silebilir
        CREATE POLICY "posts_delete_own"
            ON posts FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Posts için güvenli RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Comments için basit politikalar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
        
        -- Herkes tüm yorumları görebilir
        CREATE POLICY "comments_select_all"
            ON comments FOR SELECT
            TO authenticated
            USING (true);
            
        -- Sadece kendi yorumunu oluşturabilir
        CREATE POLICY "comments_insert_own"
            ON comments FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi yorumunu güncelleyebilir
        CREATE POLICY "comments_update_own"
            ON comments FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi yorumunu silebilir
        CREATE POLICY "comments_delete_own"
            ON comments FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Comments için güvenli RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Job listings için basit politikalar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_listings') THEN
        ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
        
        -- Herkes tüm iş ilanlarını görebilir
        CREATE POLICY "job_listings_select_all"
            ON job_listings FOR SELECT
            TO authenticated
            USING (true);
            
        -- Sadece kendi iş ilanını oluşturabilir
        CREATE POLICY "job_listings_insert_own"
            ON job_listings FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi iş ilanını güncelleyebilir
        CREATE POLICY "job_listings_update_own"
            ON job_listings FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi iş ilanını silebilir
        CREATE POLICY "job_listings_delete_own"
            ON job_listings FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Job listings için güvenli RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Friend requests için basit politikalar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_requests') THEN
        ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
        
        -- Sadece kendi arkadaşlık isteklerini görebilir
        CREATE POLICY "friend_requests_select_own"
            ON friend_requests FOR SELECT
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        -- Sadece kendi arkadaşlık isteğini oluşturabilir
        CREATE POLICY "friend_requests_insert_own"
            ON friend_requests FOR INSERT
            TO authenticated
            WITH CHECK (sender_id = auth.uid());
            
        -- Sadece kendi arkadaşlık isteğini güncelleyebilir
        CREATE POLICY "friend_requests_update_own"
            ON friend_requests FOR UPDATE
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid())
            WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        -- Sadece kendi arkadaşlık isteğini silebilir
        CREATE POLICY "friend_requests_delete_own"
            ON friend_requests FOR DELETE
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        RAISE NOTICE 'Friend requests için güvenli RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Chat messages için basit politikalar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        
        -- Herkes tüm mesajları görebilir
        CREATE POLICY "chat_messages_select_all"
            ON chat_messages FOR SELECT
            TO authenticated
            USING (true);
            
        -- Sadece kendi mesajını oluşturabilir
        CREATE POLICY "chat_messages_insert_own"
            ON chat_messages FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi mesajını güncelleyebilir
        CREATE POLICY "chat_messages_update_own"
            ON chat_messages FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        -- Sadece kendi mesajını silebilir
        CREATE POLICY "chat_messages_delete_own"
            ON chat_messages FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'Chat messages için güvenli RLS politikaları oluşturuldu';
    END IF;
END $$;

-- ==============================================
-- 3. JOB_APPLICATIONS TABLOSU OLUŞTUR
-- ==============================================

-- Job applications tablosu oluştur
CREATE TABLE IF NOT EXISTS job_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    job_listing_id uuid REFERENCES job_listings(id) NOT NULL,
    cover_letter text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    applied_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Job applications RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_applications_select_own"
    ON job_applications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "job_applications_insert_own"
    ON job_applications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "job_applications_update_own"
    ON job_applications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "job_applications_delete_own"
    ON job_applications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ==============================================
-- 4. GET_FRIEND_COUNT FONKSİYONU OLUŞTUR
-- ==============================================

DROP FUNCTION IF EXISTS get_friend_count(uuid);

CREATE FUNCTION get_friend_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM friend_requests
        WHERE (sender_id = user_id OR receiver_id = user_id)
        AND status = 'accepted'
    );
END;
$$;

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm RLS politikaları kaldırıldı
-- Güvenli politikalar oluşturuldu
-- Sonsuz döngü hatası düzeltildi
-- Job applications tablosu oluşturuldu
-- get_friend_count fonksiyonu oluşturuldu
-- Artık emülatörde hata kalmamalı
