
CREATE POLICY "Public can read tracks" ON storage.objects
  FOR SELECT USING (bucket_id = 'tracks');

CREATE POLICY "Admins can upload tracks" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

CREATE POLICY "Admins can update tracks" ON storage.objects
  FOR UPDATE USING (bucket_id = 'tracks' AND public.is_admin());

CREATE POLICY "Admins can delete tracks" ON storage.objects
  FOR DELETE USING (bucket_id = 'tracks' AND public.is_admin());
