
-- Grant execute on role-check functions to anon and authenticated so RLS policies that call them don't fail with "permission denied for function is_admin"
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Ensure anon can read public-facing landing tables
GRANT SELECT ON public.packages TO anon;
GRANT SELECT ON public.specials TO anon;
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT ON public.music_tracks TO anon;

-- Restrict admin-manage ALL policies to authenticated (they had role 'public' which forced anon to also evaluate is_admin())
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage specials" ON public.specials;
CREATE POLICY "Admins can manage specials" ON public.specials FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
CREATE POLICY "Admins can manage business settings" ON public.business_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Allow anonymous visitors to read public branding/background keys directly from business_settings
GRANT SELECT ON public.business_settings TO anon;
DROP POLICY IF EXISTS "Public can view branding settings" ON public.business_settings;
CREATE POLICY "Public can view branding settings" ON public.business_settings FOR SELECT TO anon
USING (key IN (
  'brand_logo_url','logo_url','hero_image_url','site_background_url',
  'bg_landing','bg_client_portal','bg_admin','bg_planner','bg_auth','bg_song_request',
  'mixcloud_url'
));
