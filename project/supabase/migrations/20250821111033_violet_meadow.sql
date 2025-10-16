/*
  # İş İlanları için Admin ve Moderatör Yetkileri

  1. Güvenlik
    - Admin ve moderatörler iş ilanlarını silebilir (is_active = false)
    - Admin ve moderatörler ilan verenleri engelleyebilir
    - RLS politikaları güncellendi

  2. Değişiklikler
    - job_listings tablosunda admin/moderatör silme yetkisi
    - profiles tablosunda admin/moderatör engelleme yetkisi
*/

-- Admin ve moderatörler iş ilanlarını deaktive edebilir
CREATE POLICY "Admins and moderators can deactivate job listings"
  ON job_listings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin ve moderatörler kullanıcıları engelleyebilir (job listings context)
CREATE POLICY "Admins and moderators can block job posters"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'moderator')
    )
  );