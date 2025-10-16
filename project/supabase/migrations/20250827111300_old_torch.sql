/*
  # İş ilanı silme yetkilerini düzelt

  1. Mevcut UPDATE politikasını kaldır
  2. Admin ve moderatörler için kapsamlı UPDATE yetkisi ekle
  3. İş ilanı sahipleri için UPDATE yetkisi ekle
*/

-- Mevcut UPDATE politikalarını kaldır
DROP POLICY IF EXISTS "job_listings_update_policy" ON job_listings;
DROP POLICY IF EXISTS "Users can update job listings" ON job_listings;
DROP POLICY IF EXISTS "Job owners and admins can update listings" ON job_listings;

-- Yeni kapsamlı UPDATE politikası oluştur
CREATE POLICY "Comprehensive job listings update policy"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    -- İş ilanı sahibi kendi ilanını güncelleyebilir
    posted_by = auth.uid()
    OR
    -- Admin ve moderatörler herhangi bir ilanı güncelleyebilir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  )
  WITH CHECK (
    -- İş ilanı sahibi kendi ilanını güncelleyebilir
    posted_by = auth.uid()
    OR
    -- Admin ve moderatörler herhangi bir ilanı güncelleyebilir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );