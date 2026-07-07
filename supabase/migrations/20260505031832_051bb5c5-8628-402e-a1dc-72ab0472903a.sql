
-- 1. Replace permissive `true` insert policies with column-presence checks
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "System can insert notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (title IS NOT NULL AND type IS NOT NULL AND message IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.client_access_logs;
CREATE POLICY "Anyone can insert access logs" ON public.client_access_logs
  FOR INSERT WITH CHECK (email IS NOT NULL AND client_code IS NOT NULL AND quote_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can submit song requests" ON public.song_requests;
CREATE POLICY "Anyone can submit song requests" ON public.song_requests
  FOR INSERT WITH CHECK (song_title IS NOT NULL AND artist IS NOT NULL AND event_id IS NOT NULL);

-- 2. Remove broad bucket-wide SELECT policies on storage.objects (public bucket URLs still work)
DROP POLICY IF EXISTS "Anyone can view equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view specials images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view documents" ON storage.objects;

-- 3. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.get_my_profile_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_client_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_portal_login() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_event_plan_submitted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_quote_request() FROM anon, authenticated, public;

-- Keep lookup_quote_by_code callable for client portal lookups
GRANT EXECUTE ON FUNCTION public.lookup_quote_by_code(text, text) TO anon, authenticated;
