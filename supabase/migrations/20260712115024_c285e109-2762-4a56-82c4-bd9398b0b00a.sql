CREATE TABLE public.recommended_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text,
  city text,
  province text,
  event_type text,
  description text,
  link_url text,
  image_url text,
  contact_phone text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recommended_venues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommended_venues TO authenticated;
GRANT ALL ON public.recommended_venues TO service_role;

ALTER TABLE public.recommended_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues"
  ON public.recommended_venues FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert venues"
  ON public.recommended_venues FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update venues"
  ON public.recommended_venues FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete venues"
  ON public.recommended_venues FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_recommended_venues_updated_at
  BEFORE UPDATE ON public.recommended_venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_recommended_venues_active ON public.recommended_venues (is_active, sort_order);
CREATE INDEX idx_recommended_venues_area ON public.recommended_venues (area);