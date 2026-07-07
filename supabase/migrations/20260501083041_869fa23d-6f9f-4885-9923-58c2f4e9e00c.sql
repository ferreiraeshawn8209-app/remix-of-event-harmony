-- Quote requests submitted by clients via the questionnaire
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_no TEXT,
  event_type TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  is_outdoor BOOLEAN NOT NULL DEFAULT false,
  needs_sound BOOLEAN NOT NULL DEFAULT true,
  needs_lighting BOOLEAN NOT NULL DEFAULT false,
  needs_special_effects BOOLEAN NOT NULL DEFAULT false,
  needs_mic BOOLEAN NOT NULL DEFAULT false,
  guest_count INTEGER,
  package_id UUID,
  package_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | quoted | declined
  quote_id UUID, -- linked once admin builds a quote
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own requests"
ON public.quote_requests FOR SELECT
USING (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Clients can create their own requests"
ON public.quote_requests FOR INSERT
WITH CHECK (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Admins can update requests"
ON public.quote_requests FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete requests"
ON public.quote_requests FOR DELETE
USING (public.is_admin());

CREATE TRIGGER update_quote_requests_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admin on new request
CREATE OR REPLACE FUNCTION public.notify_admin_on_quote_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, email)
  VALUES (
    'quote_request',
    'New Quote Request',
    NEW.client_name || ' requested a quote for ' || COALESCE(NEW.event_type, 'an event') ||
      CASE WHEN NEW.event_date IS NOT NULL THEN ' on ' || NEW.event_date::text ELSE '' END ||
      CASE WHEN NEW.package_name IS NOT NULL THEN ' (Package: ' || NEW.package_name || ')' ELSE '' END,
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER quote_requests_notify_admin
AFTER INSERT ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_quote_request();