/*
  # Eksik Tabloları Oluştur

  1. Yeni Tablolar
    - `posts` - Kullanıcı paylaşımları
    - `job_listings` - İş ilanları
    - `friend_requests` - Arkadaşlık istekleri
    - `friendships` - Arkadaşlık ilişkileri
    - `algorithms` - Tedavi algoritmaları
    - `drugs` - İlaç prospektüsleri

  2. Güvenlik
    - Tüm tablolarda RLS aktif
    - Uygun politikalar eklendi

  3. İndeksler
    - Performans için gerekli indeksler
*/

-- Posts tablosu
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'genel' CHECK (post_type IN ('genel', 'vaka', 'soru')),
  media_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and moderators can delete posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Job listings tablosu
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  institution text NOT NULL,
  city text NOT NULL,
  branch text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active job listings"
  ON job_listings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create job listings"
  ON job_listings FOR INSERT
  TO authenticated
  WITH CHECK (posted_by = auth.uid());

CREATE POLICY "Users can update own job listings"
  ON job_listings FOR UPDATE
  TO authenticated
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- Friend requests tablosu
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own friend requests"
  ON friend_requests FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received friend requests"
  ON friend_requests FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Friendships tablosu
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Algorithms tablosu (offline data için)
CREATE TABLE IF NOT EXISTS algorithms (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  urgency text DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  content jsonb NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE algorithms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read algorithms"
  ON algorithms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage algorithms"
  ON algorithms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Drugs tablosu (offline data için)
CREATE TABLE IF NOT EXISTS drugs (
  id text PRIMARY KEY,
  name text NOT NULL,
  active_ingredient text NOT NULL,
  category text NOT NULL,
  company text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read drugs"
  ON drugs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage drugs"
  ON drugs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);

CREATE INDEX IF NOT EXISTS idx_job_listings_city ON job_listings(city);
CREATE INDEX IF NOT EXISTS idx_job_listings_branch ON job_listings(branch);
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(is_active);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);

-- Trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
    BEFORE UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();