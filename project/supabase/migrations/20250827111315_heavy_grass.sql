/*
  # İş ilanları için DELETE politikası ekle

  1. Admin ve moderatörler için DELETE yetkisi
  2. İş ilanı sahipleri için DELETE yetkisi
*/

-- DELETE politikası ekle
CREATE POLICY "Job listings delete policy"
  ON job_listings
  FOR DELETE
  TO authenticated
  USING (
    -- İş ilanı sahibi kendi ilanını silebilir
    posted_by = auth.uid()
    OR
    -- Admin ve moderatörler herhangi bir ilanı silebilir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
      AND profiles.is_blocked = false
    )
  );