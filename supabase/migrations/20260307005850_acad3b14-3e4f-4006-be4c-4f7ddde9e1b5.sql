
-- Event planning table for client wedding/event details
CREATE TABLE public.event_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_date DATE,
  venue TEXT,
  event_type TEXT,
  
  -- Wedding/event specific fields
  first_dance_song TEXT,
  first_dance_artist TEXT,
  entrance_song TEXT,
  entrance_artist TEXT,
  cake_cutting_song TEXT,
  cake_cutting_artist TEXT,
  bouquet_toss_song TEXT,
  bouquet_toss_artist TEXT,
  last_song TEXT,
  last_song_artist TEXT,
  
  -- Planning details
  mc_notes TEXT,
  special_announcements TEXT,
  must_play_songs TEXT,
  do_not_play_songs TEXT,
  uplighting_color TEXT,
  timeline_notes TEXT,
  dietary_notes TEXT,
  guest_count INTEGER DEFAULT 0,
  additional_notes TEXT,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_plans ENABLE ROW LEVEL SECURITY;

-- Clients can view/edit their own plans, admins can see all
CREATE POLICY "Users can view own event plans" ON public.event_plans
  FOR SELECT USING (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Users can insert own event plans" ON public.event_plans
  FOR INSERT WITH CHECK (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Users can update own event plans" ON public.event_plans
  FOR UPDATE USING (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Admins can delete event plans" ON public.event_plans
  FOR DELETE USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_event_plans_updated_at
  BEFORE UPDATE ON public.event_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
