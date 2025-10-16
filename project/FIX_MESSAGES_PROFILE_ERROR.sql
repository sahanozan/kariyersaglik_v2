-- 🚨 ACİL DÜZELTME - Mesajlarda Profil Hatası
-- Bu dosya mesajlarda kullanıcı profili tanımsız hatasını düzeltir

-- ==============================================
-- 1. TÜM AUTH.USERS KULLANICILARI İÇİN PROFİL OLUŞTUR
-- ==============================================

-- Auth.users tablosundaki tüm kullanıcıları profiles tablosuna ekle
DO $$
DECLARE
    auth_user RECORD;
    profile_exists boolean;
    profiles_created integer := 0;
BEGIN
    RAISE NOTICE 'Auth.users tablosundaki kullanıcılar kontrol ediliyor...';
    
    -- Auth.users tablosundaki her kullanıcı için
    FOR auth_user IN 
        SELECT id, email, created_at, email_confirmed_at
        FROM auth.users 
        ORDER BY created_at
    LOOP
        -- Bu kullanıcının profili var mı kontrol et
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth_user.id
        ) INTO profile_exists;
        
        -- Eğer profil yoksa oluştur
        IF NOT profile_exists THEN
            INSERT INTO profiles (
                id,
                email,
                first_name,
                last_name,
                role,
                is_blocked,
                created_at,
                updated_at
            ) VALUES (
                auth_user.id,
                auth_user.email,
                COALESCE(SPLIT_PART(auth_user.email, '@', 1), 'Kullanıcı'),
                '',
                'user',
                false,
                COALESCE(auth_user.created_at, now()),
                now()
            );
            
            profiles_created := profiles_created + 1;
            RAISE NOTICE 'Profil oluşturuldu: % (%)', auth_user.email, auth_user.id;
        ELSE
            RAISE NOTICE 'Profil zaten mevcut: %', auth_user.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Toplam % profil oluşturuldu', profiles_created;
END $$;

-- ==============================================
-- 2. PROFİL SÜTUNLARINI KONTROL ET VE EKLE
-- ==============================================

-- Eksik sütunları ekle
DO $$
BEGIN
    -- first_name sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name text;
        RAISE NOTICE 'profiles.first_name sütunu eklendi';
    END IF;
    
    -- last_name sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name text;
        RAISE NOTICE 'profiles.last_name sütunu eklendi';
    END IF;
    
    -- email sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email text;
        RAISE NOTICE 'profiles.email sütunu eklendi';
    END IF;
    
    -- role sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
        RAISE NOTICE 'profiles.role sütunu eklendi';
    END IF;
    
    -- is_blocked sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false;
        RAISE NOTICE 'profiles.is_blocked sütunu eklendi';
    END IF;
    
    -- branch sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'branch') THEN
        ALTER TABLE profiles ADD COLUMN branch text;
        RAISE NOTICE 'profiles.branch sütunu eklendi';
    END IF;
    
    -- avatar_url sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
        RAISE NOTICE 'profiles.avatar_url sütunu eklendi';
    END IF;
    
    -- updated_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'profiles.updated_at sütunu eklendi';
    END IF;
END $$;

-- ==============================================
-- 3. MEVCUT PROFİLLERİ GÜNCELLE
-- ==============================================

-- Eksik alanları doldur
UPDATE profiles 
SET 
    first_name = COALESCE(first_name, COALESCE(SPLIT_PART(email, '@', 1), 'Kullanıcı')),
    last_name = COALESCE(last_name, ''),
    role = COALESCE(role, 'user'),
    is_blocked = COALESCE(is_blocked, false),
    branch = COALESCE(branch, 'Branş Yok'),
    updated_at = COALESCE(updated_at, now())
WHERE 
    first_name IS NULL 
    OR last_name IS NULL 
    OR role IS NULL 
    OR is_blocked IS NULL 
    OR branch IS NULL 
    OR updated_at IS NULL;

-- ==============================================
-- 4. RLS POLİTİKALARINI DÜZELT
-- ==============================================

-- Profiles RLS politikalarını temizle
DO $$
BEGIN
    -- Mevcut politikaları kaldır
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_admin_select_all" ON profiles;
    
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
-- 5. PRIVATE_MESSAGES RLS DÜZELT
-- ==============================================

-- Private messages RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_messages') THEN
        ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "private_messages_select_own" ON private_messages;
        DROP POLICY IF EXISTS "private_messages_insert_own" ON private_messages;
        DROP POLICY IF EXISTS "private_messages_update_own" ON private_messages;
        DROP POLICY IF EXISTS "private_messages_delete_own" ON private_messages;
        
        CREATE POLICY "private_messages_select_own"
            ON private_messages FOR SELECT
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        CREATE POLICY "private_messages_insert_own"
            ON private_messages FOR INSERT
            TO authenticated
            WITH CHECK (sender_id = auth.uid());
            
        CREATE POLICY "private_messages_update_own"
            ON private_messages FOR UPDATE
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid())
            WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        CREATE POLICY "private_messages_delete_own"
            ON private_messages FOR DELETE
            TO authenticated
            USING (sender_id = auth.uid() OR receiver_id = auth.uid());
            
        RAISE NOTICE 'Private messages RLS politikaları oluşturuldu';
    END IF;
END $$;

-- ==============================================
-- 6. CHAT_MESSAGES RLS DÜZELT
-- ==============================================

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
            USING (true);
            
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
            
        RAISE NOTICE 'Chat messages RLS politikaları oluşturuldu';
    END IF;
END $$;

-- ==============================================
-- 7. OTOMATİK PROFİL OLUŞTURMA TRİGGER'I
-- ==============================================

-- Otomatik profil oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        role,
        is_blocked,
        branch,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(SPLIT_PART(NEW.email, '@', 1), 'Kullanıcı'),
        '',
        'user',
        false,
        'Branş Yok',
        NEW.created_at,
        now()
    );
    
    RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm auth.users kullanıcıları için profil oluşturuldu
-- Eksik sütunlar eklendi
-- RLS politikaları düzeltildi
-- Otomatik profil oluşturma trigger'ı eklendi
-- Artık mesajlarda kullanıcı profili görünecek
