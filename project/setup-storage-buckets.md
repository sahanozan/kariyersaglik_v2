# Supabase Storage Bucket Kurulumu

## Manuel Kurulum Adımları:

### 1. Supabase Dashboard'a Git
- https://supabase.com/dashboard
- Projenizi seçin

### 2. Storage Bucket'larını Oluştur

#### A. Post Media Bucket
- **Bucket Name**: `post-media`
- **Public**: ✅ (Açık)
- **File Size Limit**: 10MB
- **Allowed MIME Types**: 
  - image/jpeg
  - image/png
  - image/gif
  - image/webp

#### B. Avatars Bucket
- **Bucket Name**: `avatars`
- **Public**: ✅ (Açık)
- **File Size Limit**: 5MB
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/gif
  - image/webp

### 3. RLS Policies Ayarla

#### Post Media Bucket Policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media');

-- Allow public read access
CREATE POLICY "Allow public read access to post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own post media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Avatars Bucket Policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Test Et
Bucket'lar oluşturulduktan sonra uygulamada görsel yükleme özelliği çalışacak.
