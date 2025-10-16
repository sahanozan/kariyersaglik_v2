-- 🚨 ACİL DÜZELTME - Profil Bulunamıyor Hatası
-- Bu dosya PGRST116 hatasını düzeltir

-- ==============================================
-- 1. MEVCUT KULLANICILARIN PROFİLLERİNİ KONTROL ET
-- ==============================================

-- Auth.users tablosundaki tüm kullanıcıları profiles tablosuna ekle
DO $$
DECLARE
    auth_user RECORD;
    profile_exists boolean;
BEGIN
    -- Auth.users tablosundaki her kullanıcı için
    FOR auth_user IN 
        SELECT id, email, created_at 
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
                auth_user.created_at,
                now()
            );
            
            RAISE NOTICE 'Profil oluşturuldu: % (%)', auth_user.email, auth_user.id;
        ELSE
            RAISE NOTICE 'Profil zaten mevcut: %', auth_user.email;
        END IF;
    END LOOP;
END $$;

-- ==============================================
-- 2. ADMIN KULLANICI OLUŞTUR (EĞER YOKSA)
-- ==============================================

-- Admin kullanıcı var mı kontrol et
DO $$
DECLARE
    admin_exists boolean;
    admin_user_id uuid;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE role = 'admin'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- İlk kullanıcıyı admin yap
        SELECT id INTO admin_user_id FROM profiles ORDER BY created_at LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            UPDATE profiles 
            SET role = 'admin' 
            WHERE id = admin_user_id;
            
            RAISE NOTICE 'İlk kullanıcı admin yapıldı: %', admin_user_id;
        ELSE
            RAISE NOTICE 'Hiç kullanıcı bulunamadı';
        END IF;
    ELSE
        RAISE NOTICE 'Admin kullanıcı zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 3. PROFİL OLUŞTURMA FONKSİYONU
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
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(SPLIT_PART(NEW.email, '@', 1), 'Kullanıcı'),
        '',
        'user',
        false,
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
-- 4. RLS POLİTİKALARINI GÜNCELLE
-- ==============================================

-- Profiles için güncellenmiş politikalar
DO $$
BEGIN
    -- Mevcut politikaları kaldır
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
    
    -- Yeni politikalar oluştur
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
        
    RAISE NOTICE 'Profiles RLS politikaları güncellendi';
END $$;

-- ==============================================
-- 5. EKSİK SÜTUNLARI EKLE
-- ==============================================

-- Profiles tablosu için eksik sütunları ekle
DO $$
BEGIN
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
    
    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'profiles.deleted_at sütunu eklendi';
    END IF;
    
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
    
    -- updated_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'profiles.updated_at sütunu eklendi';
    END IF;
END $$;

-- ==============================================
-- 6. MEVCUT PROFİLLERİ GÜNCELLE
-- ==============================================

-- Eksik alanları doldur
UPDATE profiles 
SET 
    first_name = COALESCE(first_name, COALESCE(SPLIT_PART(email, '@', 1), 'Kullanıcı')),
    last_name = COALESCE(last_name, ''),
    role = COALESCE(role, 'user'),
    is_blocked = COALESCE(is_blocked, false),
    updated_at = COALESCE(updated_at, now())
WHERE 
    first_name IS NULL 
    OR last_name IS NULL 
    OR role IS NULL 
    OR is_blocked IS NULL 
    OR updated_at IS NULL;

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm auth.users kullanıcıları için profil oluşturuldu
-- Admin kullanıcı oluşturuldu
-- Otomatik profil oluşturma trigger'ı eklendi
-- RLS politikaları güncellendi
-- Eksik sütunlar eklendi
-- Artık PGRST116 hatası kalmamalı
