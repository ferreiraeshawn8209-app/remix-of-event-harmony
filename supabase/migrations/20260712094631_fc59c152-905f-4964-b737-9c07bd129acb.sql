
-- business_settings: replace blanket authenticated SELECT with key-scoped policy
DROP POLICY IF EXISTS "Authenticated can view business settings" ON public.business_settings;

CREATE POLICY "Authenticated can view safe business settings"
ON public.business_settings FOR SELECT
TO authenticated
USING (
  is_admin()
  OR key IN (
    'brand_logo_url','logo_url','hero_image_url','site_background_url',
    'bg_landing','bg_client_portal','bg_admin','bg_planner','bg_auth','bg_song_request',
    'mixcloud_url',
    'bank_name','bank_account_name','bank_account_number','bank_branch_code','bank_account_type'
  )
);

-- service_settings: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can view service settings" ON public.service_settings;
DROP POLICY IF EXISTS "Anyone can view service settings" ON public.service_settings;

CREATE POLICY "Admins can view service settings"
ON public.service_settings FOR SELECT
TO authenticated
USING (is_admin());

-- song_requests: remove public SELECT; admins only
DROP POLICY IF EXISTS "Anyone can view song requests" ON public.song_requests;
DROP POLICY IF EXISTS "Public can view song requests" ON public.song_requests;

CREATE POLICY "Admins can view song requests"
ON public.song_requests FOR SELECT
TO authenticated
USING (is_admin());
