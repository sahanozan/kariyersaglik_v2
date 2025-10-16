-- Supabase Storage Policies Düzeltme SQL Komutları

-- 1. AVATARS bucket'ından fazla policy'leri sil
DELETE FROM storage.objects 
WHERE bucket_id = 'avatars' 
AND name IN (
  'Avatar images are publicly accessible',
  'Users can delete their own avatar',
  'Users can update their own avatar', 
  'Users can upload their own avatar'
);

-- 2. POST-IMAGES bucket'ına UPDATE policy ekle
CREATE POLICY "Allow users to update their own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. POST-DOCUMENTS bucket'ına UPDATE policy ekle  
CREATE POLICY "Allow users to update their own post documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Tüm bucket'ların policy'lerini kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
