-- Etkinlik Sistemi Kurulum SQL Komutları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. event_registrations tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure one registration per user per event
    UNIQUE(event_id, user_id)
);

-- 2. Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- 3. Foreign key constraint'i ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'event_registrations_user_id_fkey'
        AND table_name = 'event_registrations'
    ) THEN
        ALTER TABLE event_registrations 
        ADD CONSTRAINT event_registrations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. RLS'i devre dışı bırak (geçici olarak)
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 5. Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Users can read own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can read registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can update registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;

-- 6. updated_at trigger'ını oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. posts tablosunda etkinlik alanlarını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
AND column_name IN ('event_date', 'event_time', 'event_location', 'max_participants', 'registration_deadline')
ORDER BY ordinal_position;

-- 8. Mevcut kullanıcıları kontrol et
SELECT id, first_name, last_name FROM profiles LIMIT 3;

-- 9. Test verisi ekle (sadece gerçek kullanıcı varsa)
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO event_registrations (event_id, user_id, status, message)
        VALUES ('test-event-123', test_user_id, 'pending', 'Test registration')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test registration created for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found in profiles table';
    END IF;
END $$;

-- 10. Test verisini kontrol et
SELECT COUNT(*) as test_count FROM event_registrations WHERE event_id = 'test-event-123';

-- 11. Test verisini temizle
DELETE FROM event_registrations WHERE event_id = 'test-event-123';

-- 11. Final status
SELECT 'Event system setup completed successfully!' as status;
