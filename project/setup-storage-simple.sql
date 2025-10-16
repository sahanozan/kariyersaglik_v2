-- Basit Supabase Storage Kurulumu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Storage Buckets Oluştur (Eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('post-media', 'post-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Bucket'ları Kontrol Et
SELECT * FROM storage.buckets WHERE id IN ('avatars', 'post-media');

-- 3. RLS Durumunu Kontrol Et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
