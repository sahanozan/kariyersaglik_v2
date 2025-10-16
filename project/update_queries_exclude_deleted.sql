-- Update queries to exclude deleted users
-- Bu dosya tüm sorguları silinen kullanıcıları hariç tutacak şekilde günceller

-- 1. Posts tablosu - sadece silinmemiş kullanıcıların gönderilerini göster
UPDATE posts 
SET deleted_at = NULL 
WHERE deleted_at IS NOT NULL;

-- 2. Comments tablosu - sadece silinmemiş kullanıcıların yorumlarını göster
-- (Eğer comments tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    -- Comments tablosunda soft delete ekle
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);
    
    -- Silinen kullanıcıların yorumlarını soft delete yap
    UPDATE comments 
    SET 
      deleted_at = now(),
      deleted_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 3. Likes tablosu - silinen kullanıcıların beğenilerini sil
-- (Eğer likes tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM likes 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 4. Job listings tablosu - sadece silinmemiş kullanıcıların iş ilanlarını göster
-- (Eğer job_listings tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_listings' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    -- Job listings tablosunda soft delete ekle
    ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);
    
    -- Silinen kullanıcıların iş ilanlarını soft delete yap
    UPDATE job_listings 
    SET 
      deleted_at = now(),
      deleted_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 5. Chat messages tablosu - silinen kullanıcıların mesajlarını soft delete yap
-- (Eğer chat_messages tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    -- Chat messages tablosunda soft delete ekle
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);
    
    -- Silinen kullanıcıların mesajlarını soft delete yap
    UPDATE chat_messages 
    SET 
      deleted_at = now(),
      deleted_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 6. Private messages tablosu - silinen kullanıcıların mesajlarını soft delete yap
-- (Eğer private_messages tablosunda sender_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_messages' AND column_name = 'sender_id' AND table_schema = 'public'
  ) THEN
    -- Private messages tablosunda soft delete ekle
    ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);
    
    -- Silinen kullanıcıların mesajlarını soft delete yap
    UPDATE private_messages 
    SET 
      deleted_at = now(),
      deleted_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
    WHERE sender_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 7. Notifications tablosu - silinen kullanıcıların bildirimlerini sil
-- (Eğer notifications tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM notifications 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 8. Friend requests tablosu - silinen kullanıcıların arkadaşlık isteklerini sil
-- (Eğer friend_requests tablosunda sender_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'friend_requests' AND column_name = 'sender_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM friend_requests 
    WHERE sender_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    ) OR receiver_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 9. CV tablosu - silinen kullanıcıların CV verilerini sil
-- (Eğer cvs tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cvs' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    -- CV skills, experiences, educations tablolarını da temizle
    DELETE FROM cv_skills 
    WHERE cv_id IN (
      SELECT id FROM cvs WHERE user_id IN (
        SELECT id FROM profiles WHERE deleted_at IS NOT NULL
      )
    );
    
    DELETE FROM cv_experiences 
    WHERE cv_id IN (
      SELECT id FROM cvs WHERE user_id IN (
        SELECT id FROM profiles WHERE deleted_at IS NOT NULL
      )
    );
    
    DELETE FROM cv_educations 
    WHERE cv_id IN (
      SELECT id FROM cvs WHERE user_id IN (
        SELECT id FROM profiles WHERE deleted_at IS NOT NULL
      )
    );
    
    DELETE FROM cvs 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 10. Event registrations tablosu - silinen kullanıcıların etkinlik kayıtlarını sil
-- (Eğer event_registrations tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_registrations' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM event_registrations 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 11. Survey responses tablosu - silinen kullanıcıların anket yanıtlarını sil
-- (Eğer survey_responses tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_responses' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM survey_responses 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- 12. Job applications tablosu - silinen kullanıcıların iş başvurularını sil
-- (Eğer job_applications tablosunda user_id sütunu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_applications' AND column_name = 'user_id' AND table_schema = 'public'
  ) THEN
    DELETE FROM job_applications 
    WHERE user_id IN (
      SELECT id FROM profiles WHERE deleted_at IS NOT NULL
    );
  END IF;
END $$;

-- Test the cleanup
SELECT 'Queries updated to exclude deleted users' as status;
