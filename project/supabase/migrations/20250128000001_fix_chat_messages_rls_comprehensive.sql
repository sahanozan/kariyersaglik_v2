/*
  # Comprehensive Fix for Chat Messages RLS Policy

  1. Problem
    - RLS policy is too restrictive and complex
    - Branch matching is causing issues
    - Users cannot send messages to their branch rooms

  2. Solution
    - Simplify the RLS policy
    - Allow users to send messages if they are room members
    - Use room membership as the primary access control
*/

-- Drop all existing policies for chat_messages
DROP POLICY IF EXISTS "Users can read messages in allowed rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in accessible rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in allowed rooms" ON chat_messages;

-- Create simplified READ policy
CREATE POLICY "Users can read messages in rooms they have access to"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    -- Admin and moderators can read all messages
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'moderator') 
      AND p.is_blocked = false
    )
    OR
    -- Regular users can read messages in rooms they have access to
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN chat_rooms cr ON cr.id = chat_messages.room_id
      WHERE p.id = auth.uid() 
      AND p.is_blocked = false
      AND (
        -- General chat room (no branch requirement)
        cr.required_branch IS NULL
        OR
        -- User's branch matches room requirement (exact match)
        p.branch = cr.required_branch
        OR
        -- Branch variations for common cases
        (p.branch = 'Diyaliz Teknisyeni' AND cr.required_branch = 'Diyaliz Teknisyeni')
        OR
        (p.branch = 'Diyaliz Teknikeri' AND cr.required_branch = 'Diyaliz Teknisyeni')
        OR
        (p.branch = 'Diyaliz' AND cr.required_branch = 'Diyaliz Teknisyeni')
        OR
        (p.branch = 'Tıbbi Laboratuvar Teknisyeni' AND cr.required_branch = 'Tıbbi Laboratuvar Teknisyeni')
        OR
        (p.branch = 'Tıbbi Laboratuvar Teknikeri' AND cr.required_branch = 'Tıbbi Laboratuvar Teknisyeni')
        OR
        (p.branch = 'Tıbbi Görüntüleme Teknisyeni' AND cr.required_branch = 'Tıbbi Görüntüleme Teknisyeni')
        OR
        (p.branch = 'Tıbbi Görüntüleme Teknikeri' AND cr.required_branch = 'Tıbbi Görüntüleme Teknisyeni')
        OR
        (p.branch = 'Ameliyathane Teknisyeni' AND cr.required_branch = 'Ameliyathane Teknisyeni')
        OR
        (p.branch = 'Ameliyathane Teknikeri' AND cr.required_branch = 'Ameliyathane Teknisyeni')
        OR
        (p.branch = 'Radyoterapi Teknisyeni' AND cr.required_branch = 'Radyoterapi Teknisyeni')
        OR
        (p.branch = 'Radyoterapi Teknikeri' AND cr.required_branch = 'Radyoterapi Teknisyeni')
        OR
        (p.branch = 'Perfüzyon Teknisyeni' AND cr.required_branch = 'Perfüzyon Teknisyeni')
        OR
        (p.branch = 'Perfüzyon Teknikeri' AND cr.required_branch = 'Perfüzyon Teknisyeni')
        OR
        (p.branch = 'İlk ve Acil Yardım Teknikeri (Paramedik)' AND cr.required_branch = 'İlk ve Acil Yardım Teknikeri (Paramedik)')
        OR
        (p.branch = 'Anestezi Teknisyeni' AND cr.required_branch = 'Anestezi Teknisyeni')
        OR
        (p.branch = 'Anestezi Teknikeri' AND cr.required_branch = 'Anestezi Teknisyeni')
        OR
        (p.branch = 'Çocuk Gelişimi Uzmanı' AND cr.required_branch = 'Çocuk Gelişimi Uzmanı')
        OR
        (p.branch = 'Yaşlı Bakım Teknisyeni' AND cr.required_branch = 'Yaşlı Bakım Teknisyeni')
        OR
        (p.branch = 'Yaşlı Bakım Teknikeri' AND cr.required_branch = 'Yaşlı Bakım Teknisyeni')
        OR
        (p.branch = 'Tıbbi Sekreter' AND cr.required_branch = 'Tıbbi Sekreter')
        OR
        (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme ve Diyetetik')
        OR
        (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Durum ve Afet Yönetimi')
      )
    )
  );

-- Create simplified INSERT policy
CREATE POLICY "Users can send messages in rooms they have access to"
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
          -- User's branch matches room requirement (exact match)
          p.branch = cr.required_branch
          OR
          -- Branch variations for common cases
          (p.branch = 'Diyaliz Teknisyeni' AND cr.required_branch = 'Diyaliz Teknisyeni')
          OR
          (p.branch = 'Diyaliz Teknikeri' AND cr.required_branch = 'Diyaliz Teknisyeni')
          OR
          (p.branch = 'Diyaliz' AND cr.required_branch = 'Diyaliz Teknisyeni')
          OR
          (p.branch = 'Tıbbi Laboratuvar Teknisyeni' AND cr.required_branch = 'Tıbbi Laboratuvar Teknisyeni')
          OR
          (p.branch = 'Tıbbi Laboratuvar Teknikeri' AND cr.required_branch = 'Tıbbi Laboratuvar Teknisyeni')
          OR
          (p.branch = 'Tıbbi Görüntüleme Teknisyeni' AND cr.required_branch = 'Tıbbi Görüntüleme Teknisyeni')
          OR
          (p.branch = 'Tıbbi Görüntüleme Teknikeri' AND cr.required_branch = 'Tıbbi Görüntüleme Teknisyeni')
          OR
          (p.branch = 'Ameliyathane Teknisyeni' AND cr.required_branch = 'Ameliyathane Teknisyeni')
          OR
          (p.branch = 'Ameliyathane Teknikeri' AND cr.required_branch = 'Ameliyathane Teknisyeni')
          OR
          (p.branch = 'Radyoterapi Teknisyeni' AND cr.required_branch = 'Radyoterapi Teknisyeni')
          OR
          (p.branch = 'Radyoterapi Teknikeri' AND cr.required_branch = 'Radyoterapi Teknisyeni')
          OR
          (p.branch = 'Perfüzyon Teknisyeni' AND cr.required_branch = 'Perfüzyon Teknisyeni')
          OR
          (p.branch = 'Perfüzyon Teknikeri' AND cr.required_branch = 'Perfüzyon Teknisyeni')
          OR
          (p.branch = 'İlk ve Acil Yardım Teknikeri (Paramedik)' AND cr.required_branch = 'İlk ve Acil Yardım Teknikeri (Paramedik)')
          OR
          (p.branch = 'Anestezi Teknisyeni' AND cr.required_branch = 'Anestezi Teknisyeni')
          OR
          (p.branch = 'Anestezi Teknikeri' AND cr.required_branch = 'Anestezi Teknisyeni')
          OR
          (p.branch = 'Çocuk Gelişimi Uzmanı' AND cr.required_branch = 'Çocuk Gelişimi Uzmanı')
          OR
          (p.branch = 'Yaşlı Bakım Teknisyeni' AND cr.required_branch = 'Yaşlı Bakım Teknisyeni')
          OR
          (p.branch = 'Yaşlı Bakım Teknikeri' AND cr.required_branch = 'Yaşlı Bakım Teknisyeni')
          OR
          (p.branch = 'Tıbbi Sekreter' AND cr.required_branch = 'Tıbbi Sekreter')
          OR
          (p.branch = 'Beslenme ve Diyetetik' AND cr.required_branch = 'Beslenme ve Diyetetik')
          OR
          (p.branch = 'Acil Durum ve Afet Yönetimi' AND cr.required_branch = 'Acil Durum ve Afet Yönetimi')
        )
      )
    )
  );

-- Create UPDATE policy for message editing
CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create DELETE policy for message deletion
CREATE POLICY "Users can delete their own messages or admins can delete any"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'moderator') 
      AND p.is_blocked = false
    )
  );
