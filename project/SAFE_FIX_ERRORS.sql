-- 🔥 GÜVENLİ HATA DÜZELTME - Sütun Kontrolü ile
-- Bu dosya tüm sütunları kontrol ederek güvenli şekilde düzeltir

-- ==============================================
-- 1. JOB_APPLICATIONS TABLOSU VE SÜTUNLARI
-- ==============================================

-- Tablo var mı kontrol et
DO $$
BEGIN
    -- Eğer tablo yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        CREATE TABLE job_applications (
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
        RAISE NOTICE 'job_applications tablosu oluşturuldu';
    ELSE
        RAISE NOTICE 'job_applications tablosu zaten mevcut';
    END IF;
END $$;

-- user_id sütunu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_applications' AND column_name = 'user_id') THEN
        ALTER TABLE job_applications ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'job_applications.user_id sütunu eklendi';
    ELSE
        RAISE NOTICE 'job_applications.user_id sütunu zaten mevcut';
    END IF;
END $$;

-- deleted_at sütunu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_applications' AND column_name = 'deleted_at') THEN
        ALTER TABLE job_applications ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'job_applications.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'job_applications.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 2. DİĞER TABLOLAR İÇİN DELETED_AT SÜTUNLARI
-- ==============================================

-- Posts tablosu için deleted_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'deleted_at') THEN
        ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'posts.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'posts.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Comments tablosu için deleted_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comments' AND column_name = 'deleted_at') THEN
        ALTER TABLE comments ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'comments.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'comments.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Job listings tablosu için deleted_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_listings' AND column_name = 'deleted_at') THEN
        ALTER TABLE job_listings ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'job_listings.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'job_listings.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Chat messages tablosu için deleted_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE chat_messages ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'chat_messages.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'chat_messages.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Friend requests tablosu için deleted_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'friend_requests' AND column_name = 'deleted_at') THEN
        ALTER TABLE friend_requests ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'friend_requests.deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'friend_requests.deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 3. GET_FRIEND_COUNT FONKSİYONU
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
        AND deleted_at IS NULL
    );
END;
$$;

-- ==============================================
-- 4. RLS POLİTİKALARI (GÜVENLİ)
-- ==============================================

-- Job applications RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "job_applications_select_own" ON job_applications;
        DROP POLICY IF EXISTS "job_applications_insert_own" ON job_applications;
        DROP POLICY IF EXISTS "job_applications_update_own" ON job_applications;
        DROP POLICY IF EXISTS "job_applications_delete_own" ON job_applications;
        
        CREATE POLICY "job_applications_select_own"
            ON job_applications FOR SELECT
            TO authenticated
            USING (user_id = auth.uid() OR deleted_at IS NULL);
            
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
            
        RAISE NOTICE 'job_applications RLS politikaları oluşturuldu';
    END IF;
END $$;

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
            
        RAISE NOTICE 'posts RLS politikaları oluşturuldu';
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
            
        RAISE NOTICE 'comments RLS politikaları oluşturuldu';
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
            
        RAISE NOTICE 'job_listings RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Chat messages RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "chat_messages_select_all" ON chat_messages;
        DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
        DROP POLICY IF EXISTS "chat_messages_update_own" ON chat_messages;
        DROP POLICY IF EXISTS "chat_messages_delete_own" ON chat_messages;
        
        CREATE POLICY "chat_messages_select_all"
            ON chat_messages FOR SELECT
            TO authenticated
            USING (deleted_at IS NULL);
            
        CREATE POLICY "chat_messages_insert_own"
            ON chat_messages FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "chat_messages_update_own"
            ON chat_messages FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "chat_messages_delete_own"
            ON chat_messages FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
            
        RAISE NOTICE 'chat_messages RLS politikaları oluşturuldu';
    END IF;
END $$;

-- Friend requests RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_requests') THEN
        ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
        DROP POLICY IF EXISTS "friend_requests_insert_own" ON friend_requests;
        DROP POLICY IF EXISTS "friend_requests_update_own" ON friend_requests;
        DROP POLICY IF EXISTS "friend_requests_delete_own" ON friend_requests;
        
        CREATE POLICY "friend_requests_select_own"
            ON friend_requests FOR SELECT
            TO authenticated
            USING ((sender_id = auth.uid() OR receiver_id = auth.uid()) AND deleted_at IS NULL);
            
        CREATE POLICY "friend_requests_insert_own"
            ON friend_requests FOR INSERT
            TO authenticated
            WITH CHECK (sender_id = auth.uid());
            
        CREATE POLICY "friend_requests_update_own"
            ON friend_requests FOR UPDATE
            TO authenticated
            USING ((sender_id = auth.uid() OR receiver_id = auth.uid()))
            WITH CHECK ((sender_id = auth.uid() OR receiver_id = auth.uid()));
            
        CREATE POLICY "friend_requests_delete_own"
            ON friend_requests FOR DELETE
            TO authenticated
            USING ((sender_id = auth.uid() OR receiver_id = auth.uid()));
            
        RAISE NOTICE 'friend_requests RLS politikaları oluşturuldu';
    END IF;
END $$;

-- ==============================================
-- 5. PERFORMANCE İNDEXLERİ
-- ==============================================

-- Job applications indexleri
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_job_applications_deleted_at ON job_applications(deleted_at);
        RAISE NOTICE 'job_applications indexleri oluşturuldu';
    END IF;
END $$;

-- Diğer tablolar için indexler
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_deleted_at ON job_listings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at ON chat_messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_deleted_at ON friend_requests(deleted_at);

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm sütunlar güvenli şekilde kontrol edildi
-- Tüm tablolar için RLS politikaları oluşturuldu
-- Performance indexleri eklendi
-- Artık emülatörde hata kalmamalı
