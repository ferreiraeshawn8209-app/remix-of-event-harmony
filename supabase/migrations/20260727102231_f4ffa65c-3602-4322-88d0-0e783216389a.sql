
-- 1) wedding_ideas
CREATE TABLE public.wedding_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  title text NOT NULL,
  description text,
  image_url text,
  category text,
  likes integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_ideas TO authenticated;
GRANT SELECT ON public.wedding_ideas TO anon;
GRANT ALL ON public.wedding_ideas TO service_role;
ALTER TABLE public.wedding_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published ideas" ON public.wedding_ideas
  FOR SELECT USING (is_published = true OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users insert own ideas" ON public.wedding_ideas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own ideas" ON public.wedding_ideas
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users delete own ideas" ON public.wedding_ideas
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_wedding_ideas_updated BEFORE UPDATE ON public.wedding_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) competition_winners
CREATE TABLE public.competition_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_label text NOT NULL,
  winner_name text NOT NULL,
  prize text,
  message text,
  photo_url text,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competition_winners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.competition_winners TO authenticated;
GRANT ALL ON public.competition_winners TO service_role;
ALTER TABLE public.competition_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published winners" ON public.competition_winners
  FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins manage winners" ON public.competition_winners
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_competition_winners_updated BEFORE UPDATE ON public.competition_winners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) event_photos: allow client to upload their own event photos
CREATE POLICY "Clients upload own event photos" ON public.event_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = event_photos.quote_id
        AND q.client_id = public.get_my_profile_id()
    )
  );
CREATE POLICY "Clients delete own uploaded photos" ON public.event_photos
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin());

-- 4) storage policies for wedding-ideas bucket (public read, auth users upload own folder)
CREATE POLICY "Public read wedding-ideas" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-ideas');
CREATE POLICY "Auth insert wedding-ideas own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wedding-ideas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth delete wedding-ideas own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'wedding-ideas' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- 5) storage policies for event-photos: allow clients to upload to their own quote folder
CREATE POLICY "Clients upload event-photos own quote" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos'
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id::text = (storage.foldername(name))[1]
        AND q.client_id = public.get_my_profile_id()
    )
  );
CREATE POLICY "Public read event-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');
