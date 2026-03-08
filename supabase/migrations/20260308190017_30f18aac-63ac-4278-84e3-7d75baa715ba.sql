
-- Client access logs table
CREATE TABLE public.client_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  client_code text NOT NULL,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view access logs" ON public.client_access_logs
  FOR SELECT USING (public.is_admin());

-- Anyone can insert (logged from client portal without auth)
CREATE POLICY "Anyone can insert access logs" ON public.client_access_logs
  FOR INSERT WITH CHECK (true);

-- Event photos table
CREATE TABLE public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  client_code text NOT NULL,
  photo_url text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Admins can manage photos
CREATE POLICY "Admins can manage event photos" ON public.event_photos
  FOR ALL USING (public.is_admin());

-- Anyone can view photos (client portal uses RPC lookup, no auth)
CREATE POLICY "Anyone can view event photos" ON public.event_photos
  FOR SELECT USING (true);

-- Storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- Storage policies for event-photos bucket
CREATE POLICY "Admins can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND public.is_admin());

CREATE POLICY "Admins can delete event photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-photos' AND public.is_admin());

CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');
