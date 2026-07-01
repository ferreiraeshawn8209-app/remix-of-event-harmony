
-- Music library
CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.music_tracks TO anon, authenticated;
GRANT ALL ON public.music_tracks TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.music_tracks TO authenticated;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tracks" ON public.music_tracks
  FOR SELECT USING (active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage tracks" ON public.music_tracks
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_music_tracks_updated BEFORE UPDATE ON public.music_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event playlists
CREATE TABLE public.event_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Event Playlist',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_playlists TO authenticated;
GRANT ALL ON public.event_playlists TO service_role;
ALTER TABLE public.event_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin view playlist" ON public.event_playlists FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = event_playlists.quote_id
      AND q.client_id = public.get_my_profile_id()));
CREATE POLICY "Owner or admin modify playlist" ON public.event_playlists FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = event_playlists.quote_id
      AND q.client_id = public.get_my_profile_id()))
  WITH CHECK (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = event_playlists.quote_id
      AND q.client_id = public.get_my_profile_id()));
CREATE TRIGGER trg_event_playlists_updated BEFORE UPDATE ON public.event_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.event_playlists(id) ON DELETE CASCADE,
  moment TEXT NOT NULL DEFAULT 'party',
  song_title TEXT NOT NULL,
  artist TEXT,
  cue_time_seconds INT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_playlist_items TO authenticated;
GRANT ALL ON public.event_playlist_items TO service_role;
ALTER TABLE public.event_playlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin view items" ON public.event_playlist_items FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.event_playlists p JOIN public.quotes q ON q.id = p.quote_id
    WHERE p.id = event_playlist_items.playlist_id AND q.client_id = public.get_my_profile_id()));
CREATE POLICY "Owner or admin modify items" ON public.event_playlist_items FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.event_playlists p JOIN public.quotes q ON q.id = p.quote_id
    WHERE p.id = event_playlist_items.playlist_id AND q.client_id = public.get_my_profile_id()))
  WITH CHECK (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.event_playlists p JOIN public.quotes q ON q.id = p.quote_id
    WHERE p.id = event_playlist_items.playlist_id AND q.client_id = public.get_my_profile_id()));
CREATE TRIGGER trg_event_playlist_items_updated BEFORE UPDATE ON public.event_playlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security: business_settings
DROP POLICY IF EXISTS "Authenticated users can view business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Anyone can view business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Public can view business settings" ON public.business_settings;
CREATE POLICY "Admins view all business settings" ON public.business_settings
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_public_business_settings()
RETURNS TABLE(key TEXT, value TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT key, value FROM public.business_settings
  WHERE key IN (
    'brand_logo_url','hero_image_url','site_background_url',
    'bg_landing','bg_client_portal','bg_admin','bg_planner','bg_auth','bg_song_request'
  )
$$;
GRANT EXECUTE ON FUNCTION public.get_public_business_settings() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_banking_details()
RETURNS TABLE(key TEXT, value TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT key, value FROM public.business_settings
  WHERE key IN ('bank_name','bank_account_name','bank_account_number','bank_branch_code','bank_account_type')
    AND auth.uid() IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.get_banking_details() TO authenticated;

-- Security: service_settings
DROP POLICY IF EXISTS "Authenticated users can view service settings" ON public.service_settings;
DROP POLICY IF EXISTS "Anyone can view service settings" ON public.service_settings;
CREATE POLICY "Admins view service settings" ON public.service_settings
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_service_settings()
RETURNS TABLE(setting_key TEXT, setting_value NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT setting_key, setting_value FROM public.service_settings
  WHERE auth.uid() IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.get_service_settings() TO authenticated;
