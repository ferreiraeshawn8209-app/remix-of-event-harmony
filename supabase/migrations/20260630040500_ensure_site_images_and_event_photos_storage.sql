-- Ensure storage buckets and policies exist for current upload features.

-- Public bucket used by admin-managed site visuals (hero/background/package images).
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public bucket used by admin-managed client event photo uploads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- site-images policies (admin write, public read)
DROP POLICY IF EXISTS "Admins can upload site images" ON storage.objects;
CREATE POLICY "Admins can upload site images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update site images" ON storage.objects;
CREATE POLICY "Admins can update site images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete site images" ON storage.objects;
CREATE POLICY "Admins can delete site images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_admin());

DROP POLICY IF EXISTS "Anyone can read site images" ON storage.objects;
CREATE POLICY "Anyone can read site images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

-- event-photos policies (admin write/manage, public read)
DROP POLICY IF EXISTS "Admins can upload event photos" ON storage.objects;
CREATE POLICY "Admins can upload event photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update event photos" ON storage.objects;
CREATE POLICY "Admins can update event photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete event photos" ON storage.objects;
CREATE POLICY "Admins can delete event photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;
CREATE POLICY "Anyone can view event photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');
