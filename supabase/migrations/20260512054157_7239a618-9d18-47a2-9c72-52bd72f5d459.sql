
-- Add image to packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS image_url text;

-- Site settings (text key/value) for banking, hero images, etc.
CREATE TABLE IF NOT EXISTS public.business_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business settings"
  ON public.business_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business settings"
  ON public.business_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public bucket for general site images (hero, backgrounds, package covers)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('site-images', 'site-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload site images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-images' AND is_admin());

CREATE POLICY "Admins can update site images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-images' AND is_admin());

CREATE POLICY "Admins can delete site images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-images' AND is_admin());

-- Seed banking detail keys (empty so admin fills them in)
INSERT INTO public.business_settings (key, value) VALUES
  ('bank_name', ''),
  ('bank_account_name', ''),
  ('bank_account_number', ''),
  ('bank_branch_code', ''),
  ('bank_account_type', ''),
  ('hero_image_url', ''),
  ('site_background_url', '')
ON CONFLICT (key) DO NOTHING;
