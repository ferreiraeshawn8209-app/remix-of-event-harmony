
CREATE OR REPLACE FUNCTION public.notify_admin_on_client_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, email)
  VALUES (
    'client_signup',
    'New Client Signup',
    COALESCE(NEW.full_name, split_part(COALESCE(NEW.email,''), '@', 1), 'A new client') ||
      ' just signed up' ||
      CASE WHEN NEW.email IS NOT NULL THEN ' (' || NEW.email || ')' ELSE '' END,
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_client_signup ON public.profiles;
CREATE TRIGGER trg_notify_admin_on_client_signup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_client_signup();
