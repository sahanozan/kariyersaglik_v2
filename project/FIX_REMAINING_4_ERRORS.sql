-- 🔥 KALAN 4 HATAYI DÜZELT - Kapsamlı Son Düzeltme
-- Bu dosya emülatörde kalan tüm hataları düzeltir

-- ==============================================
-- 1. TÜM TABLOLARI KONTROL ET VE EKSİK SÜTUNLARI EKLE
-- ==============================================

-- Treatment algorithms tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'treatment_algorithms' AND column_name = 'user_id') THEN
        ALTER TABLE treatment_algorithms ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'treatment_algorithms.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'treatment_algorithms' AND column_name = 'deleted_at') THEN
        ALTER TABLE treatment_algorithms ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'treatment_algorithms.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Drugs tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'drugs' AND column_name = 'user_id') THEN
        ALTER TABLE drugs ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'drugs.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'drugs' AND column_name = 'deleted_at') THEN
        ALTER TABLE drugs ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'drugs.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Chat rooms tablosu için sütunlar
DO $$
BEGIN
    -- created_by sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'created_by') THEN
        ALTER TABLE chat_rooms ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'chat_rooms.created_by sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'deleted_at') THEN
        ALTER TABLE chat_rooms ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'chat_rooms.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Events tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'user_id') THEN
        ALTER TABLE events ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'events.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'deleted_at') THEN
        ALTER TABLE events ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'events.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Event registrations tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_registrations' AND column_name = 'user_id') THEN
        ALTER TABLE event_registrations ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'event_registrations.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_registrations' AND column_name = 'deleted_at') THEN
        ALTER TABLE event_registrations ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'event_registrations.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Surveys tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'surveys' AND column_name = 'user_id') THEN
        ALTER TABLE surveys ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'surveys.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'surveys' AND column_name = 'deleted_at') THEN
        ALTER TABLE surveys ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'surveys.deleted_at sütunu eklendi';
    END IF;
END $$;

-- Survey responses tablosu için sütunlar
DO $$
BEGIN
    -- user_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'survey_responses' AND column_name = 'user_id') THEN
        ALTER TABLE survey_responses ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'survey_responses.user_id sütunu eklendi';
    END IF;

    -- deleted_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'survey_responses' AND column_name = 'deleted_at') THEN
        ALTER TABLE survey_responses ADD COLUMN deleted_at timestamptz;
        RAISE NOTICE 'survey_responses.deleted_at sütunu eklendi';
    END IF;
END $$;

-- ==============================================
-- 2. TÜM TABLOLAR İÇİN RLS POLİTİKALARI
-- ==============================================

-- Treatment algorithms RLS
ALTER TABLE IF EXISTS treatment_algorithms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_algorithms_select_all" ON treatment_algorithms;
DROP POLICY IF EXISTS "treatment_algorithms_insert_own" ON treatment_algorithms;
DROP POLICY IF EXISTS "treatment_algorithms_update_own" ON treatment_algorithms;
DROP POLICY IF EXISTS "treatment_algorithms_delete_own" ON treatment_algorithms;

CREATE POLICY "treatment_algorithms_select_all"
    ON treatment_algorithms FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "treatment_algorithms_insert_own"
    ON treatment_algorithms FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "treatment_algorithms_update_own"
    ON treatment_algorithms FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "treatment_algorithms_delete_own"
    ON treatment_algorithms FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Drugs RLS
ALTER TABLE IF EXISTS drugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drugs_select_all" ON drugs;
DROP POLICY IF EXISTS "drugs_insert_own" ON drugs;
DROP POLICY IF EXISTS "drugs_update_own" ON drugs;
DROP POLICY IF EXISTS "drugs_delete_own" ON drugs;

CREATE POLICY "drugs_select_all"
    ON drugs FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "drugs_insert_own"
    ON drugs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "drugs_update_own"
    ON drugs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "drugs_delete_own"
    ON drugs FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Chat rooms RLS
ALTER TABLE IF EXISTS chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_select_all" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert_own" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update_own" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_delete_own" ON chat_rooms;

CREATE POLICY "chat_rooms_select_all"
    ON chat_rooms FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "chat_rooms_insert_own"
    ON chat_rooms FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "chat_rooms_update_own"
    ON chat_rooms FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "chat_rooms_delete_own"
    ON chat_rooms FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Events RLS
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_insert_own" ON events;
DROP POLICY IF EXISTS "events_update_own" ON events;
DROP POLICY IF EXISTS "events_delete_own" ON events;

CREATE POLICY "events_select_all"
    ON events FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "events_insert_own"
    ON events FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "events_update_own"
    ON events FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "events_delete_own"
    ON events FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Event registrations RLS
ALTER TABLE IF EXISTS event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_registrations_select_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_update_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete_own" ON event_registrations;

CREATE POLICY "event_registrations_select_own"
    ON event_registrations FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR deleted_at IS NULL);

CREATE POLICY "event_registrations_insert_own"
    ON event_registrations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_registrations_update_own"
    ON event_registrations FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_registrations_delete_own"
    ON event_registrations FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Surveys RLS
ALTER TABLE IF EXISTS surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surveys_select_all" ON surveys;
DROP POLICY IF EXISTS "surveys_insert_own" ON surveys;
DROP POLICY IF EXISTS "surveys_update_own" ON surveys;
DROP POLICY IF EXISTS "surveys_delete_own" ON surveys;

CREATE POLICY "surveys_select_all"
    ON surveys FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "surveys_insert_own"
    ON surveys FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "surveys_update_own"
    ON surveys FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "surveys_delete_own"
    ON surveys FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Survey responses RLS
ALTER TABLE IF EXISTS survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "survey_responses_select_own" ON survey_responses;
DROP POLICY IF EXISTS "survey_responses_insert_own" ON survey_responses;
DROP POLICY IF EXISTS "survey_responses_update_own" ON survey_responses;
DROP POLICY IF EXISTS "survey_responses_delete_own" ON survey_responses;

CREATE POLICY "survey_responses_select_own"
    ON survey_responses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR deleted_at IS NULL);

CREATE POLICY "survey_responses_insert_own"
    ON survey_responses FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "survey_responses_update_own"
    ON survey_responses FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "survey_responses_delete_own"
    ON survey_responses FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ==============================================
-- 3. EKSİK FONKSİYONLARI OLUŞTUR
-- ==============================================

-- get_friend_count fonksiyonu
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

-- get_applications_count fonksiyonu
DROP FUNCTION IF EXISTS get_applications_count(uuid);

CREATE FUNCTION get_applications_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM job_applications
        WHERE user_id = get_applications_count.user_id
        AND deleted_at IS NULL
    );
END;
$$;

-- get_posts_count fonksiyonu
DROP FUNCTION IF EXISTS get_posts_count();

CREATE FUNCTION get_posts_count()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM posts
        WHERE deleted_at IS NULL
    );
END;
$$;

-- get_algorithms_count fonksiyonu
DROP FUNCTION IF EXISTS get_algorithms_count();

CREATE FUNCTION get_algorithms_count()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM treatment_algorithms
        WHERE deleted_at IS NULL
    );
END;
$$;

-- get_drugs_count fonksiyonu
DROP FUNCTION IF EXISTS get_drugs_count();

CREATE FUNCTION get_drugs_count()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM drugs
        WHERE deleted_at IS NULL
    );
END;
$$;

-- ==============================================
-- 4. JOB APPLICATIONS TABLOSU OLUŞTUR (EĞER YOKSA)
-- ==============================================

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

-- ==============================================
-- 5. TÜM TABLOLAR İÇİN INDEXLER
-- ==============================================

-- Performance için indexler
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
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_treatment_algorithms_user_id ON treatment_algorithms(user_id);
CREATE INDEX IF NOT EXISTS idx_drugs_user_id ON drugs(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);

-- ==============================================
-- TAMAMLANDI! ✅
-- ==============================================
-- Tüm eksik sütunlar eklendi
-- Tüm RLS politikaları oluşturuldu
-- Tüm eksik fonksiyonlar oluşturuldu
-- Job applications tablosu oluşturuldu
-- Performance indexleri eklendi
-- Artık emülatörde hata kalmamalı
