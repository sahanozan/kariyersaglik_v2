/*
  # Posts tablosu INSERT RLS politikasını düzelt

  1. Mevcut Durum
    - INSERT işlemi RLS politika ihlali veriyor
    - Kullanıcılar kendi paylaşımlarını oluşturamıyor

  2. Çözüm
    - INSERT için doğru RLS politikası ekleniyor
    - Kullanıcılar sadece kendi user_id'leri ile paylaşım oluşturabilir
*/

-- Önce mevcut INSERT politikasını kaldır (varsa)
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Allow users to create posts" ON posts;

-- Yeni INSERT politikası oluştur
CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);