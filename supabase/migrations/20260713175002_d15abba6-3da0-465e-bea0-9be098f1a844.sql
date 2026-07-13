DROP POLICY IF EXISTS "Authenticated can view safe business settings" ON public.business_settings;
CREATE POLICY "Authenticated can view safe business settings"
ON public.business_settings
FOR SELECT
USING (
  is_admin() OR key = ANY (ARRAY[
    'brand_logo_url','logo_url','hero_image_url','site_background_url',
    'bg_landing','bg_client_portal','bg_admin','bg_planner','bg_auth','bg_song_request',
    'mixcloud_url'
  ])
);