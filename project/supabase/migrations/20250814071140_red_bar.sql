/*
  # Chat System Tables and Functions

  1. New Tables
    - `chat_rooms` - Chat room definitions
    - `chat_messages` - Messages in chat rooms
    - `chat_room_members` - Room membership tracking

  2. Security
    - Enable RLS on all tables
    - Proper access policies for each role
*/

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text,
  description text,
  required_branch text,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Chat room members table (for tracking active members)
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Anyone can read chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage chat rooms"
  ON chat_rooms FOR ALL
  TO authenticated
  USING (is_admin());

-- Chat messages policies
CREATE POLICY "Users can read messages in allowed rooms"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      is_admin() OR 
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN chat_rooms cr ON cr.id = room_id
        WHERE p.id = auth.uid() 
        AND (
          p.role IN ('admin', 'moderator') OR
          cr.required_branch IS NULL OR
          p.branch = cr.required_branch
        )
      )
    )
  );

CREATE POLICY "Users can insert messages in allowed rooms"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN chat_rooms cr ON cr.id = room_id
      WHERE p.id = auth.uid() 
      AND p.is_blocked = false
      AND (
        p.role IN ('admin', 'moderator') OR
        cr.required_branch IS NULL OR
        p.branch = cr.required_branch
      )
    )
  );

CREATE POLICY "Admin and moderators can delete messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Chat room members policies
CREATE POLICY "Users can read room members"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join allowed rooms"
  ON chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN chat_rooms cr ON cr.id = room_id
      WHERE p.id = auth.uid() 
      AND p.is_blocked = false
      AND (
        p.role IN ('admin', 'moderator') OR
        cr.required_branch IS NULL OR
        p.branch = cr.required_branch
      )
    )
  );

-- Function to delete message (soft delete)
CREATE OR REPLACE FUNCTION delete_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if current user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Only admins and moderators can delete messages';
  END IF;
  
  -- Soft delete the message
  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
END;
$$;

-- Insert default chat rooms
INSERT INTO chat_rooms (id, name, emoji, description, required_branch) VALUES
('doktor', 'Doktorlar Odası', '🩺', 'Doktorlar için özel sohbet odası', 'doktor'),
('dis-hekimi', 'Diş Hekimi Odası', '😁', 'Diş hekimleri için özel sohbet odası', 'dis-hekimi'),
('eczaci', 'Eczacı Odası', '💊', 'Eczacılar için özel sohbet odası', 'eczaci'),
('hemsire', 'Hemşire Odası', '👩‍⚕️', 'Hemşireler için özel sohbet odası', 'hemsire'),
('fizyoterapi', 'Fizyoterapi ve Rehabilitasyon Odası', '🏃‍♂️', 'Fizyoterapistler için özel sohbet odası', 'fizyoterapi'),
('ebe', 'Ebe Odası', '🤰', 'Ebeler için özel sohbet odası', 'ebe'),
('paramedik', 'İlk ve Acil Yardım (Paramedik) Odası', '🚑', 'Paramedikler için özel sohbet odası', 'paramedik'),
('anestezist', 'Anestezist Odası', '🩺', 'Anestezistler için özel sohbet odası', 'anestezist'),
('ameliyathane', 'Ameliyathane Hizmetleri Odası', '🏥', 'Ameliyathane personeli için özel sohbet odası', 'ameliyathane'),
('goruntuleme', 'Tıbbi Görüntüleme Teknikleri Odası', '🖥️', 'Görüntüleme teknisyenleri için özel sohbet odası', 'goruntuleme'),
('laboratuvar', 'Tıbbi Laboratuvar Teknikleri Odası', '🧪', 'Laboratuvar teknisyenleri için özel sohbet odası', 'laboratuvar'),
('diyaliz', 'Diyaliz Odası', '💧', 'Diyaliz teknisyenleri için özel sohbet odası', 'diyaliz'),
('optisyen', 'Optisyenlik Odası', '👓', 'Optisyenler için özel sohbet odası', 'optisyen'),
('odyometri', 'Odyometri Odası', '👂', 'Odyometristler için özel sohbet odası', 'odyometri'),
('radyoterapi', 'Radyoterapi Odası', '☢️', 'Radyoterapi teknisyenleri için özel sohbet odası', 'radyoterapi'),
('cocuk-gelisim', 'Çocuk Gelişimi Odası', '👶', 'Çocuk gelişim uzmanları için özel sohbet odası', 'cocuk-gelisim'),
('yasli-bakim', 'Yaşlı Bakımı Odası', '👴', 'Yaşlı bakım uzmanları için özel sohbet odası', 'yasli-bakim'),
('dokumantasyon', 'Tıbbi Dokümantasyon ve Sekreterlik Odası', '🗂️', 'Tıbbi sekreterler için özel sohbet odası', 'dokumantasyon'),
('perfuzyon', 'Perfüzyon Teknikleri Odası', '❤️‍🔥', 'Perfüzyon teknisyenleri için özel sohbet odası', 'perfuzyon'),
('acil-durum', 'Acil Durum ve Afet Yönetimi Odası', '🚨', 'Acil durum uzmanları için özel sohbet odası', 'acil-durum'),
('beslenme', 'Beslenme ve Diyetetik Odası', '🥗', 'Diyetisyenler için özel sohbet odası', 'beslenme')
ON CONFLICT (id) DO NOTHING;