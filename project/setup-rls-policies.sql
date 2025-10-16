-- Supabase Storage RLS Policies Kurulumu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut Policies'leri Temizle (Eğer Varsa)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post media" ON storage.objects;

-- 2. Avatars Bucket RLS Policies
-- Kullanıcılar kendi avatar'larını yükleyebilir
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi avatar'larını güncelleyebilir
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi avatar'larını silebilir
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Herkes avatar'ları görüntüleyebilir
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Post Media Bucket RLS Policies
-- Kullanıcılar kendi post medyalarını yükleyebilir
CREATE POLICY "Users can upload their own post media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi post medyalarını güncelleyebilir
CREATE POLICY "Users can update their own post media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi post medyalarını silebilir
CREATE POLICY "Users can delete their own post media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Herkes post medyalarını görüntüleyebilir
CREATE POLICY "Anyone can view post media" ON storage.objects
FOR SELECT USING (bucket_id = 'post-media');

-- 4. RLS'yi Aktif Et
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Bucket'ları Kontrol Et
SELECT * FROM storage.buckets WHERE id IN ('avatars', 'post-media');

-- 6. Policies'leri Kontrol Et
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
