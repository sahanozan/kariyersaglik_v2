/*
  # Fix Chat Messages RLS Policy

  1. Security Updates
    - Update RLS policy for chat_messages table to allow proper message insertion
    - Ensure users can insert messages in rooms they have access to
    - Maintain security while allowing proper functionality

  2. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows users to send messages in allowed rooms
    - Keep existing SELECT and UPDATE policies intact
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert messages in allowed rooms" ON chat_messages;

-- Create a new INSERT policy that allows users to send messages
CREATE POLICY "Users can insert messages in allowed rooms"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      -- Admin and moderators can send messages anywhere
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
          cr.required_branch IS NULL OR -- General chat room
          p.branch = cr.required_branch OR -- Exact match
          -- Branch variations matching
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
      )
    )
  );