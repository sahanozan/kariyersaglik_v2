/*
  # Update chat room access policies

  1. Policy Updates
    - Update chat message insert policy to check branch access properly
    - Update chat message select policy for branch-based access
    - Update chat room member policies for branch access

  2. Security
    - Ensure users can only access rooms for their branch
    - Admin and moderators have access to all rooms
    - Blocked users cannot access any rooms
*/

-- Update chat messages insert policy
DROP POLICY IF EXISTS "Users can insert messages in allowed rooms" ON chat_messages;

CREATE POLICY "Users can insert messages in allowed rooms"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN chat_rooms cr ON cr.id = chat_messages.room_id
      WHERE p.id = auth.uid() 
        AND p.is_blocked = false 
        AND (
          p.role IN ('admin', 'moderator') OR
          cr.required_branch IS NULL OR
          p.branch = cr.required_branch OR
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)') AND cr.required_branch = 'Paramedik') OR
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist') AND cr.required_branch = 'Anestezist') OR
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri') AND cr.required_branch = 'Ameliyathane') OR
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri') AND cr.required_branch = 'Radyoloji') OR
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri') AND cr.required_branch = 'Laboratuvar') OR
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz') AND cr.required_branch = 'Diyaliz') OR
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi') AND cr.required_branch = 'Radyoterapi') OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı') AND cr.required_branch = 'Yaşlı Bakım') OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
          (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri') AND cr.required_branch = 'Perfüzyon') OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
    )
  );

-- Update chat messages select policy
DROP POLICY IF EXISTS "Users can read messages in allowed rooms" ON chat_messages;

CREATE POLICY "Users can read messages in allowed rooms"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      EXISTS (
        SELECT 1 
        FROM profiles p
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin', 'moderator') 
          AND p.is_blocked = false
      ) OR
      EXISTS (
        SELECT 1 
        FROM profiles p
        JOIN chat_rooms cr ON cr.id = chat_messages.room_id
        WHERE p.id = auth.uid() 
          AND p.is_blocked = false 
          AND (
            cr.required_branch IS NULL OR
            p.branch = cr.required_branch OR
            (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
            (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
            (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
            (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
            (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
            (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
            (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)') AND cr.required_branch = 'Paramedik') OR
            (p.branch IN ('Anestezi Teknisyeni', 'Anestezist') AND cr.required_branch = 'Anestezist') OR
            (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri') AND cr.required_branch = 'Ameliyathane') OR
            (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri') AND cr.required_branch = 'Radyoloji') OR
            (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri') AND cr.required_branch = 'Laboratuvar') OR
            (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz') AND cr.required_branch = 'Diyaliz') OR
            (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
            (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
            (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi') AND cr.required_branch = 'Radyoterapi') OR
            (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
            (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı') AND cr.required_branch = 'Yaşlı Bakım') OR
            (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
            (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri') AND cr.required_branch = 'Perfüzyon') OR
            (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
            (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
          )
      )
    )
  );

-- Update chat room members insert policy
DROP POLICY IF EXISTS "Users can join allowed rooms" ON chat_room_members;

CREATE POLICY "Users can join allowed rooms"
  ON chat_room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN chat_rooms cr ON cr.id = chat_room_members.room_id
      WHERE p.id = auth.uid() 
        AND p.is_blocked = false 
        AND (
          p.role IN ('admin', 'moderator') OR
          cr.required_branch IS NULL OR
          p.branch = cr.required_branch OR
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)') AND cr.required_branch = 'Paramedik') OR
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist') AND cr.required_branch = 'Anestezist') OR
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri') AND cr.required_branch = 'Ameliyathane') OR
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri') AND cr.required_branch = 'Radyoloji') OR
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri') AND cr.required_branch = 'Laboratuvar') OR
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz') AND cr.required_branch = 'Diyaliz') OR
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi') AND cr.required_branch = 'Radyoterapi') OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı') AND cr.required_branch = 'Yaşlı Bakım') OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
          (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri') AND cr.required_branch = 'Perfüzyon') OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
    )
  );