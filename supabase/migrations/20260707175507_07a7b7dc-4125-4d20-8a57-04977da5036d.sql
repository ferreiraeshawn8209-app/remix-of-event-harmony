
-- Helper functions used in RLS policies must be executable by client roles
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO anon, authenticated;

-- Restrict overly-broad "public" role admin policies to authenticated so anon isn't forced to run is_admin()
DROP POLICY IF EXISTS "Admins can delete requests" ON public.quote_requests;
CREATE POLICY "Admins can delete requests" ON public.quote_requests FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update requests" ON public.quote_requests;
CREATE POLICY "Admins can update requests" ON public.quote_requests FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Clients can create their own requests" ON public.quote_requests;
CREATE POLICY "Clients can create their own requests" ON public.quote_requests FOR INSERT TO authenticated
WITH CHECK ((client_id = get_my_profile_id()) OR is_admin());

DROP POLICY IF EXISTS "Clients can view their own requests" ON public.quote_requests;
CREATE POLICY "Clients can view their own requests" ON public.quote_requests FOR SELECT TO authenticated
USING ((client_id = get_my_profile_id()) OR is_admin());

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Admins can delete notifications" ON public.admin_notifications FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (is_admin());

-- Attach the notification triggers that were defined but never wired up
DROP TRIGGER IF EXISTS trg_notify_admin_on_quote_request ON public.quote_requests;
CREATE TRIGGER trg_notify_admin_on_quote_request
AFTER INSERT ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_quote_request();

DROP TRIGGER IF EXISTS trg_notify_admin_on_client_signup ON public.profiles;
CREATE TRIGGER trg_notify_admin_on_client_signup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_client_signup();

DROP TRIGGER IF EXISTS trg_notify_admin_on_quote_message ON public.quote_messages;
CREATE TRIGGER trg_notify_admin_on_quote_message
AFTER INSERT ON public.quote_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_quote_message();

DROP TRIGGER IF EXISTS trg_notify_admin_on_client_review ON public.client_reviews;
CREATE TRIGGER trg_notify_admin_on_client_review
AFTER INSERT ON public.client_reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_client_review();

DROP TRIGGER IF EXISTS trg_notify_admin_on_portal_login ON public.client_access_logs;
CREATE TRIGGER trg_notify_admin_on_portal_login
AFTER INSERT ON public.client_access_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_portal_login();

DROP TRIGGER IF EXISTS trg_notify_admin_on_event_plan_submitted ON public.event_plans;
CREATE TRIGGER trg_notify_admin_on_event_plan_submitted
AFTER INSERT ON public.event_plans
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_event_plan_submitted();

-- Auto-generate client_code on quotes
DROP TRIGGER IF EXISTS trg_generate_client_code ON public.quotes;
CREATE TRIGGER trg_generate_client_code
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.generate_client_code();

-- updated_at maintenance
DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON public.quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_quotes_updated_at ON public.quotes;
CREATE TRIGGER trg_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure realtime picks up quote_requests / admin_notifications so admin dashboard live-updates
ALTER TABLE public.quote_requests REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
