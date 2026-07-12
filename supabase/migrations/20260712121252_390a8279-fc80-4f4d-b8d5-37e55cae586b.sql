
CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  category text NOT NULL DEFAULT 'staff',
  bio text,
  photo_url text,
  whatsapp_number text,
  email text,
  specialties text[],
  years_experience int,
  is_bookable boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.staff_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active staff" ON public.staff_members
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage staff" ON public.staff_members
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dj_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  event_date date,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dj_booking_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dj_booking_requests TO authenticated;
GRANT ALL ON public.dj_booking_requests TO service_role;

ALTER TABLE public.dj_booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit DJ booking requests" ON public.dj_booking_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view/manage DJ booking requests" ON public.dj_booking_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_dj_booking_requests_updated_at
  BEFORE UPDATE ON public.dj_booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
