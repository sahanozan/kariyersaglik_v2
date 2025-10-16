/*
  # Fix Diyaliz RLS Policy

  1. Problem
    - Diyaliz odasının required_branch değeri 'Diyaliz Teknisyeni'
    - RLS politikasında 'Diyaliz' olarak kontrol ediliyor
    - Bu uyumsuzluk mesaj göndermeyi engelliyor

  2. Solution
    - RLS politikasını güncelleyerek 'Diyaliz Teknisyeni' değerini de kabul et
    - Mevcut 'Diyaliz' değerini de koru
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can send messages in accessible rooms" ON chat_messages;

-- Create updated INSERT policy with correct Diyaliz branch matching
CREATE POLICY "Users can send messages in accessible rooms"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Admin and moderators can send messages in any room
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'moderator') 
        AND p.is_blocked = false
      )
      OR
      -- Regular users can send messages in rooms they have access to
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN chat_rooms cr ON cr.id = chat_messages.room_id
        WHERE p.id = auth.uid() 
        AND p.is_blocked = false
        AND (
          -- General chat room (no branch requirement)
          cr.required_branch IS NULL
          OR
          -- User's branch matches room requirement exactly
          p.branch = cr.required_branch
          OR
          -- Branch variations matching
          (p.branch = 'Perfüzyon Teknisyeni' AND cr.required_branch = 'Perfüzyon')
          OR
          (p.branch = 'Perfüzyon Teknikleri' AND cr.required_branch = 'Perfüzyon')
          OR
          (p.branch = 'Perfüzyon Teknikeri' AND cr.required_branch = 'Perfüzyon')
          OR
          (p.branch = 'Doktor' AND cr.required_branch = 'Doktor')
          OR
          (p.branch = 'Diş Hekimi' AND cr.required_branch = 'Diş Hekimi')
          OR
          (p.branch = 'Eczacı' AND cr.required_branch = 'Eczacı')
          OR
          (p.branch = 'Hemşire' AND cr.required_branch = 'Hemşire')
          OR
          (p.branch = 'Fizyoterapi ve Rehabilitasyon' AND cr.required_branch = 'Fizyoterapi')
          OR
          (p.branch = 'Ebe' AND cr.required_branch = 'Ebe')
          OR
          (p.branch IN ('İlk ve Acil Yardım Teknikeri (Paramedik)', 'İlk ve Acil Yardım (Paramedik)', 'Paramedik') AND cr.required_branch = 'Paramedik')
          OR
          (p.branch IN ('Anestezi Teknisyeni', 'Anestezist', 'Anestezi Teknikeri') AND cr.required_branch = 'Anestezist')
          OR
          (p.branch IN ('Ameliyathane Teknisyeni', 'Ameliyathane Hizmetleri', 'Ameliyathane Teknikeri') AND cr.required_branch = 'Ameliyathane')
          OR
          (p.branch IN ('Tıbbi Görüntüleme Teknisyeni', 'Tıbbi Görüntüleme Teknikleri', 'Tıbbi Görüntüleme Teknikeri') AND cr.required_branch = 'Radyoloji')
          OR
          (p.branch IN ('Tıbbi Laboratuvar Teknisyeni', 'Tıbbi Laboratuvar Teknikleri', 'Tıbbi Laboratuvar Teknikeri') AND cr.required_branch = 'Laboratuvar')
          OR
          -- Diyaliz variations - FIXED: Include both 'Diyaliz' and 'Diyaliz Teknisyeni'
          (p.branch IN ('Diyaliz Teknisyeni', 'Diyaliz', 'Diyaliz Teknikeri') AND cr.required_branch IN ('Diyaliz', 'Diyaliz Teknisyeni'))
          OR
          (p.branch IN ('Optisyen', 'Optisyenlik') AND cr.required_branch = 'Optisyen')
          OR
          (p.branch IN ('Odyolog', 'Odyometri') AND cr.required_branch = 'Odyolog')
          OR
          (p.branch IN ('Radyoterapi Teknisyeni', 'Radyoterapi', 'Radyoterapi Teknikeri') AND cr.required_branch = 'Radyoterapi')
          OR
          (p.branch IN ('Çocuk Gelişimi Uzmanı', 'Çocuk Gelişimi') AND cr.required_branch = 'Çocuk Gelişimi')
          OR
          (p.branch IN ('Yaşlı Bakım Teknisyeni', 'Yaşlı Bakımı', 'Yaşlı Bakım Teknikeri') AND cr.required_branch = 'Yaşlı Bakım')
          OR
          (p.branch IN ('Tıbbi Sekreter', 'Tıbbi Dokümantasyon ve Sekreterlik') AND cr.required_branch = 'Tıbbi Sekreter')
          OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme')
          OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Tıp')
        )
      )
    )
  );
