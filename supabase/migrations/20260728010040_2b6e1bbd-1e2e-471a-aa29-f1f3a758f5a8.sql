
CREATE OR REPLACE FUNCTION public.notify_admin_on_quote_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.admin_notifications (type, title, message, quote_id, client_code, email)
    VALUES (
      'quote_accepted',
      'Quote Accepted 🎉',
      COALESCE(NEW.client_name,'A client') || ' (' || COALESCE(NEW.client_code, NEW.email, '') || ') accepted their quote.',
      NEW.id,
      NEW.client_code,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_quote_accepted ON public.quotes;
CREATE TRIGGER trg_notify_admin_on_quote_accepted
AFTER UPDATE OF status ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_quote_accepted();
