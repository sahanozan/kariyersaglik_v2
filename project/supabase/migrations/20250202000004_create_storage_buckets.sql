-- Create storage buckets for the application

-- Create post-media bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create chat-media bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for post-media bucket
CREATE POLICY "Allow authenticated users to upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Allow public read access to post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

CREATE POLICY "Allow users to update their own post media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for chat-media bucket
CREATE POLICY "Allow authenticated users to upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Allow authenticated users to read chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Allow users to update their own chat media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

