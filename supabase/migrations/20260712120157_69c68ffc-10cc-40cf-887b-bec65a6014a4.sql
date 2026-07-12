
CREATE TABLE public.wedding_expos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  venue TEXT,
  city TEXT,
  province TEXT,
  start_date DATE,
  end_date DATE,
  start_time TEXT,
  ticket_url TEXT,
  website_url TEXT,
  image_url TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wedding_expos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.wedding_expos TO authenticated;
GRANT ALL ON public.wedding_expos TO service_role;
ALTER TABLE public.wedding_expos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active expos" ON public.wedding_expos FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage expos" ON public.wedding_expos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_wedding_expos_updated_at BEFORE UPDATE ON public.wedding_expos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
