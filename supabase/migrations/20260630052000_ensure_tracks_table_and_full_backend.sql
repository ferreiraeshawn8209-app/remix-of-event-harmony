-- Comprehensive idempotent repair for the full tracks feature backend.
-- This migration is safe to run repeatedly against any state of the active
-- Supabase project (table missing, partially applied, or already correct).

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Ensure the public.tracks table exists with all expected columns
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tracks (
  id         uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text                     NOT NULL,
  url        text                     NOT NULL,
  sort_order integer                  NOT NULL DEFAULT 0,
  is_active  boolean                  NOT NULL DEFAULT true,
  created_at timestamptz              NOT NULL DEFAULT now(),
  updated_at timestamptz              NOT NULL DEFAULT now()
);

-- Add any columns that might be missing if the table was created with a subset
-- (ALTER TABLE … ADD COLUMN IF NOT EXISTS is safe to run even when the column exists).
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS url text NOT NULL DEFAULT '';

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Grants
-- ────────────────────────────────────────────────────────────────────────────

GRANT SELECT                         ON public.tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL                            ON public.tracks TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read active tracks.
DROP POLICY IF EXISTS "Active tracks are publicly readable" ON public.tracks;
CREATE POLICY "Active tracks are publicly readable"
  ON public.tracks FOR SELECT
  USING (is_active = true);

-- Admins can read all tracks (including inactive ones).
DROP POLICY IF EXISTS "Admins can view all tracks" ON public.tracks;
CREATE POLICY "Admins can view all tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can insert, update, and delete tracks.
DROP POLICY IF EXISTS "Admins can manage tracks" ON public.tracks;
CREATE POLICY "Admins can manage tracks"
  ON public.tracks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 4. updated_at trigger
-- ────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_tracks_updated ON public.tracks;
CREATE TRIGGER trg_tracks_updated
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Storage bucket – ensure it exists and settings are correct
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  52428800, -- 50 MB per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE
SET name              = EXCLUDED.name,
    public            = EXCLUDED.public,
    file_size_limit   = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Storage policies – idempotently recreate all four
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can upload tracks"      ON storage.objects;
CREATE POLICY "Admins can upload tracks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update track files" ON storage.objects;
CREATE POLICY "Admins can update track files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING  (bucket_id = 'tracks' AND public.is_admin())
  WITH CHECK (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete track files" ON storage.objects;
CREATE POLICY "Admins can delete track files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tracks' AND public.is_admin());

DROP POLICY IF EXISTS "Anyone can read track files"   ON storage.objects;
CREATE POLICY "Anyone can read track files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks');
