
-- Events table for tracking active events that can receive song requests
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  venue text,
  event_date date,
  dj_name text DEFAULT 'DJ Shawn-E-Shawn',
  is_active boolean NOT NULL DEFAULT true,
  google_review_url text DEFAULT 'https://g.page/r/beatkulture/review',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Admins manage events
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (is_admin());

-- Anyone can view active events (for QR code access)
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (is_active = true);

-- Song requests table
CREATE TABLE public.song_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  song_title text NOT NULL,
  artist text NOT NULL,
  message text,
  guest_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert song requests (guests via QR code, no auth needed)
CREATE POLICY "Anyone can submit song requests" ON public.song_requests FOR INSERT WITH CHECK (true);

-- Admins can view and manage all song requests
CREATE POLICY "Admins can manage song requests" ON public.song_requests FOR ALL USING (is_admin());

-- Anyone can view requests for active events (for the live queue)
CREATE POLICY "Anyone can view song requests" ON public.song_requests FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for song requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_requests;
