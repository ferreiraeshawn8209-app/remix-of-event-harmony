
-- 1. event_photos: remove public read, restrict to admins or owning client
DROP POLICY IF EXISTS "Anyone can view event photos" ON public.event_photos;
CREATE POLICY "Admins or owning client can view event photos"
ON public.event_photos FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = event_photos.quote_id
      AND q.client_id = public.get_my_profile_id()
  )
);

-- 2. admin_notifications: only admins may insert from the API (triggers are SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.admin_notifications;
CREATE POLICY "Admins can insert notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 3. client_access_logs: only admins may insert from the API
DROP POLICY IF EXISTS "Authenticated can insert access logs" ON public.client_access_logs;
CREATE POLICY "Admins can insert access logs"
ON public.client_access_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 4. Revoke EXECUTE on internal trigger functions that should never be invoked from the API
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_quote_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_portal_login() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_event_plan_submitted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_quote_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_client_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
