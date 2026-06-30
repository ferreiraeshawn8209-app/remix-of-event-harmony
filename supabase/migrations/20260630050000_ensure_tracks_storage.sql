-- Ensure the tracks bucket and storage policies exist for admin music uploads.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can upload tracks" ON storage.objects;
CREATE POLICY "Admins can upload tracks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update track files" ON storage.objects;
CREATE POLICY "Admins can update track files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tracks' AND public.is_admin())
  WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete track files" ON storage.objects;
CREATE POLICY "Admins can delete track files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Anyone can read track files" ON storage.objects;
CREATE POLICY "Anyone can read track files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks');
