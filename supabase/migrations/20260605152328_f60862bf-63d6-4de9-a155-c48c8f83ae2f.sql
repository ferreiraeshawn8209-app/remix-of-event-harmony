
-- business_settings: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view business settings" ON public.business_settings;
CREATE POLICY "Authenticated can view business settings"
ON public.business_settings FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.business_settings FROM anon;

-- service_settings: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view service settings" ON public.service_settings;
CREATE POLICY "Authenticated can view service settings"
ON public.service_settings FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.service_settings FROM anon;

-- admin_notifications: restrict INSERT to authenticated (triggers use SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "Authenticated can insert notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (title IS NOT NULL AND type IS NOT NULL AND message IS NOT NULL);
REVOKE INSERT ON public.admin_notifications FROM anon;

-- client_access_logs: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.client_access_logs;
CREATE POLICY "Authenticated can insert access logs"
ON public.client_access_logs FOR INSERT
TO authenticated
WITH CHECK (email IS NOT NULL AND client_code IS NOT NULL AND quote_id IS NOT NULL);
REVOKE INSERT ON public.client_access_logs FROM anon;
