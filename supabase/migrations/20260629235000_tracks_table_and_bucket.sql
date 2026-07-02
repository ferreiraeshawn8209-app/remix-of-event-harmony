-- Create tracks table for admin-uploaded MP3 files
CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- All authenticated users (including clients) can read active tracks
CREATE POLICY "Active tracks are publicly readable"
  ON public.tracks FOR SELECT
  USING (is_active = true);

-- Admins can read all tracks (including inactive)
CREATE POLICY "Admins can view all tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can insert/update/delete
CREATE POLICY "Admins can manage tracks"
  ON public.tracks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_tracks_updated
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create the tracks storage bucket for MP3 uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  52428800, -- 50 MB per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read files (public bucket handles anon reads)
CREATE POLICY "Admins can upload tracks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

CREATE POLICY "Admins can update track files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tracks' AND public.is_admin());

CREATE POLICY "Admins can delete track files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tracks' AND public.is_admin());

CREATE POLICY "Anyone can read track files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks');
