-- Create storage buckets for file uploads
-- Run this in Supabase SQL Editor or Dashboard

-- Create bucket for cover images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for video files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for avatar images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to covers bucket
CREATE POLICY "Users can upload covers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Public can view covers" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'covers');

-- Allow authenticated users to upload audio
CREATE POLICY "Users can upload audio" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Public can view audio" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio');

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
