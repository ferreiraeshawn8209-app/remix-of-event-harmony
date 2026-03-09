
-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'portal_login',
  title text NOT NULL,
  message text NOT NULL,
  quote_id uuid,
  client_code text,
  email text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage notifications
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete notifications"
  ON public.admin_notifications FOR DELETE
  USING (is_admin());

-- Allow anonymous inserts (for client portal logins, triggered via DB trigger)
CREATE POLICY "System can insert notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Trigger function: create a notification when a client logs into the portal
CREATE OR REPLACE FUNCTION public.notify_admin_on_portal_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, quote_id, client_code, email)
  VALUES (
    'portal_login',
    'Client Portal Login',
    NEW.email || ' viewed their portal (' || NEW.client_code || ')',
    NEW.quote_id,
    NEW.client_code,
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Attach trigger to client_access_logs
CREATE OR REPLACE TRIGGER on_client_portal_login
  AFTER INSERT ON public.client_access_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_portal_login();
