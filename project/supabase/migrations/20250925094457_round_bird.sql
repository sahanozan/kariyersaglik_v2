/*
  # Update chat room access policies

  1. Security Updates
    - Enhanced RLS policies for chat rooms and messages
    - Improved branch matching logic
    - Admin and moderator access controls

  2. Branch Access Control
    - Exact branch matching
    - Alternative branch name support
    - Flexible room access based on professional roles
*/

-- Update chat messages policy for better branch matching
DROP POLICY IF EXISTS "Users can insert messages in allowed rooms" ON chat_messages;

CREATE POLICY "Users can insert messages in allowed rooms"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) AND 
    (
      -- Admin and moderators can post in all rooms
      (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'moderator') 
        AND p.is_blocked = false
      )) OR
      -- Regular users can post in rooms they have access to
      (EXISTS (
        SELECT 1 FROM profiles p
        JOIN chat_rooms cr ON cr.id = chat_messages.room_id
        WHERE p.id = auth.uid() 
        AND p.is_blocked = false
        AND (
          -- No branch requirement (general rooms)
          cr.required_branch IS NULL OR
          -- Exact branch match
          p.branch = cr.required_branch OR
          -- Enhanced branch mappings
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
          -- Paramedik variations
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)', 'Paramedik') AND cr.required_branch = 'Paramedik') OR
          -- Anestezi variations
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist', 'Anestezi Teknikeri') AND cr.required_branch = 'Anestezist') OR
          -- Ameliyathane variations
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri', 'Ameliyathane Teknikeri') AND cr.required_branch = 'Ameliyathane') OR
          -- Radyoloji variations
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri', 'Tıbbi Görüntüleme Teknikeri') AND cr.required_branch = 'Radyoloji') OR
          -- Laboratuvar variations
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri', 'Tıbbi Laboratuvar Teknikeri') AND cr.required_branch = 'Laboratuvar') OR
          -- Diyaliz variations
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz', 'Diyaliz Teknikeri') AND cr.required_branch = 'Diyaliz') OR
          -- Other branch mappings
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi', 'Radyoterapi Teknikeri') AND cr.required_branch = 'Radyoterapi') OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı', 'Yaşlı Bakım Teknikeri') AND cr.required_branch = 'Yaşlı Bakım') OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
          (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri', 'Perfüzyon Teknikeri') AND cr.required_branch = 'Perfüzyon') OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
      ))
    )
  );

-- Update chat messages read policy for better branch matching
DROP POLICY IF EXISTS "Users can read messages in allowed rooms" ON chat_messages;

CREATE POLICY "Users can read messages in allowed rooms"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      -- Admin and moderators can read all messages
      (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'moderator') 
        AND p.is_blocked = false
      )) OR
      -- Regular users can read messages in rooms they have access to
      (EXISTS (
        SELECT 1 FROM profiles p
        JOIN chat_rooms cr ON cr.id = chat_messages.room_id
        WHERE p.id = auth.uid() 
        AND p.is_blocked = false
        AND (
          -- No branch requirement (general rooms)
          cr.required_branch IS NULL OR
          -- Exact branch match
          p.branch = cr.required_branch OR
          -- Enhanced branch mappings (same as above)
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)', 'Paramedik') AND cr.required_branch = 'Paramedik') OR
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist', 'Anestezi Teknikeri') AND cr.required_branch = 'Anestezist') OR
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri', 'Ameliyathane Teknikeri') AND cr.required_branch = 'Ameliyathane') OR
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri', 'Tıbbi Görüntüleme Teknikeri') AND cr.required_branch = 'Radyoloji') OR
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri', 'Tıbbi Laboratuvar Teknikeri') AND cr.required_branch = 'Laboratuvar') OR
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz', 'Diyaliz Teknikeri') AND cr.required_branch = 'Diyaliz') OR
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi', 'Radyoterapi Teknikeri') AND cr.required_branch = 'Radyoterapi') OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı', 'Yaşlı Bakım Teknikeri') AND cr.required_branch = 'Yaşlı Bakım') OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
          (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri', 'Perfüzyon Teknikeri') AND cr.required_branch = 'Perfüzyon') OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
      ))
    )
  );

-- Update chat room members policy for better branch matching
DROP POLICY IF EXISTS "Users can join allowed rooms" ON chat_room_members;

CREATE POLICY "Users can join allowed rooms"
  ON chat_room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) AND 
    (
      -- Admin and moderators can join all rooms
      (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'moderator') 
        AND p.is_blocked = false
      )) OR
      -- Regular users can join rooms they have access to
      (EXISTS (
        SELECT 1 FROM profiles p
        JOIN chat_rooms cr ON cr.id = chat_room_members.room_id
        WHERE p.id = auth.uid() 
        AND p.is_blocked = false
        AND (
          -- No branch requirement (general rooms)
          cr.required_branch IS NULL OR
          -- Exact branch match
          p.branch = cr.required_branch OR
          -- Enhanced branch mappings (same as above)
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor') OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi') OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı') OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire') OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi') OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe') OR
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)', 'Paramedik') AND cr.required_branch = 'Paramedik') OR
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist', 'Anestezi Teknikeri') AND cr.required_branch = 'Anestezist') OR
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri', 'Ameliyathane Teknikeri') AND cr.required_branch = 'Ameliyathane') OR
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri', 'Tıbbi Görüntüleme Teknikeri') AND cr.required_branch = 'Radyoloji') OR
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri', 'Tıbbi Laboratuvar Teknikeri') AND cr.required_branch = 'Laboratuvar') OR
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz', 'Diyaliz Teknikeri') AND cr.required_branch = 'Diyaliz') OR
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen') OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog') OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi', 'Radyoterapi Teknikeri') AND cr.required_branch = 'Radyoterapi') OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi') OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı', 'Yaşlı Bakım Teknikeri') AND cr.required_branch = 'Yaşlı Bakım') OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter') OR
          (p.branch IN ('Perfüzyon Teknisyeni', 'Perfüzyon Teknikleri', 'Perfüzyon Teknikeri') AND cr.required_branch = 'Perfüzyon') OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme') OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
      ))
    )
  );