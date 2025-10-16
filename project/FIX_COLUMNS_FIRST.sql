-- 🔧 ÖNCE SÜTUNLARI OLUŞTUR - Sonra RLS Politikaları
-- Bu dosyayı ÖNCE çalıştırın, sonra FIX_INFINITE_RECURSION.sql'i çalıştırın

-- ==============================================
-- 1. PROFILES TABLOSUNA SÜTUNLARI EKLE
-- ==============================================

-- deleted_at sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- deletion_reason sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deletion_reason') THEN
        ALTER TABLE profiles ADD COLUMN deletion_reason text;
        RAISE NOTICE 'deletion_reason sütunu eklendi';
    ELSE
        RAISE NOTICE 'deletion_reason sütunu zaten mevcut';
    END IF;
END $$;

-- deleted_by sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deleted_by') THEN
        ALTER TABLE profiles ADD COLUMN deleted_by uuid;
        RAISE NOTICE 'deleted_by sütunu eklendi';
    ELSE
        RAISE NOTICE 'deleted_by sütunu zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 2. DİĞER TABLOLARA DA SÜTUNLARI EKLE
-- ==============================================

-- Posts tablosuna deleted_at ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'deleted_at') THEN
        ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'posts tablosuna deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'posts tablosunda deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Comments tablosuna deleted_at ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comments' AND column_name = 'deleted_at') THEN
        ALTER TABLE comments ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'comments tablosuna deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'comments tablosunda deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Job listings tablosuna deleted_at ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_listings' AND column_name = 'deleted_at') THEN
        ALTER TABLE job_listings ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'job_listings tablosuna deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'job_listings tablosunda deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- Chat messages tablosuna deleted_at ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE chat_messages ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'chat_messages tablosuna deleted_at sütunu eklendi';
    ELSE
        RAISE NOTICE 'chat_messages tablosunda deleted_at sütunu zaten mevcut';
    END IF;
END $$;

-- ==============================================
-- 3. SÜTUNLARIN EKLENDİĞİNİ KONTROL ET
-- ==============================================

-- Profiles tablosundaki sütunları listele
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('deleted_at', 'deletion_reason', 'deleted_by')
ORDER BY column_name;

-- Posts tablosundaki deleted_at sütununu kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'deleted_at';

-- Comments tablosundaki deleted_at sütununu kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND column_name = 'deleted_at';

-- Job listings tablosundaki deleted_at sütununu kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_listings' 
AND column_name = 'deleted_at';

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Artık FIX_INFINITE_RECURSION.sql dosyasını çalıştırabilirsiniz
-- Tüm gerekli sütunlar oluşturuldu

