
-- YOUTUBE VIDEOS
CREATE TABLE public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_id text NOT NULL,
  description text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.youtube_videos TO anon, authenticated;
GRANT ALL ON public.youtube_videos TO authenticated;
GRANT ALL ON public.youtube_videos TO service_role;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active youtube videos"
  ON public.youtube_videos FOR SELECT
  USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage youtube videos"
  ON public.youtube_videos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE TRIGGER trg_youtube_videos_updated_at
  BEFORE UPDATE ON public.youtube_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COMPETITIONS
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  prize text NOT NULL DEFAULT '',
  image_url text,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active competitions"
  ON public.competitions FOR SELECT
  USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage competitions"
  ON public.competitions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE TRIGGER trg_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COMPETITION ENTRIES
CREATE TABLE public.competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.competition_entries TO authenticated;
GRANT ALL ON public.competition_entries TO service_role;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all entries"
  ON public.competition_entries FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Authenticated users can enter"
  ON public.competition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Admins delete entries"
  ON public.competition_entries FOR DELETE
  TO authenticated
  USING (public.is_admin());
