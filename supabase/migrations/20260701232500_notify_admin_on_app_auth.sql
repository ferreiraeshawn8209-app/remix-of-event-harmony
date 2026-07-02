-- Notify admins whenever an authenticated app session is established.
-- Called by the frontend on successful SIGNED_IN events.

CREATE OR REPLACE FUNCTION public.notify_admin_on_app_auth(_event text DEFAULT 'signin')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
  v_user_id uuid := auth.uid();
  v_email text;
  v_event text := lower(COALESCE(_event, 'signin'));
  v_type text;
  v_title text;
  v_message text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  SELECT u.email
    INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  IF v_event = 'signup' THEN
    v_type := 'app_signup';
    v_title := 'New App Sign-up';
    v_message := COALESCE(v_email, 'Unknown user') || ' created a new account and signed in.';
  ELSE
    v_type := 'app_signin';
    v_title := 'App Sign-in';
    v_message := COALESCE(v_email, 'Unknown user') || ' signed in to the app.';
  END IF;

  INSERT INTO public.admin_notifications (type, title, message, email)
  VALUES (v_type, v_title, v_message, v_email)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admin_on_app_auth(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.notify_admin_on_app_auth(text) TO authenticated;
