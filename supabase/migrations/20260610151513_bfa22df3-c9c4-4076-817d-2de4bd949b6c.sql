
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extras_cost numeric NOT NULL DEFAULT 0;

-- Allow any signed-in user to log their own portal visit (used by the client portal).
-- The existing notify_admin_on_portal_login trigger then creates the admin notification.
CREATE OR REPLACE FUNCTION public.log_client_portal_visit(
  _quote_id uuid,
  _client_code text,
  _email text,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  INSERT INTO public.client_access_logs (quote_id, client_code, email, user_agent)
  VALUES (_quote_id, COALESCE(_client_code,''), COALESCE(_email,''), _user_agent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_client_portal_visit(uuid, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_client_portal_visit(uuid, text, text, text) TO authenticated;
