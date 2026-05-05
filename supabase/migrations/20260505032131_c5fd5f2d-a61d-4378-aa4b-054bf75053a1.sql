
CREATE TABLE public.quote_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_role text NOT NULL CHECK (sender_role IN ('client','admin')),
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_messages_quote_id ON public.quote_messages(quote_id, created_at);

ALTER TABLE public.quote_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.quote_messages FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_messages.quote_id
      AND q.client_id = get_my_profile_id()
  )
);

CREATE POLICY "Participants can post messages"
ON public.quote_messages FOR INSERT
WITH CHECK (
  message IS NOT NULL AND length(trim(message)) > 0 AND (
    (sender_role = 'admin' AND is_admin())
    OR (
      sender_role = 'client'
      AND EXISTS (
        SELECT 1 FROM public.quotes q
        WHERE q.id = quote_messages.quote_id
          AND q.client_id = get_my_profile_id()
      )
    )
  )
);

CREATE POLICY "Admins can delete messages"
ON public.quote_messages FOR DELETE
USING (is_admin());

-- Notify admins when a client posts
CREATE OR REPLACE FUNCTION public.notify_admin_on_quote_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quotes%ROWTYPE;
BEGIN
  IF NEW.sender_role = 'client' THEN
    SELECT * INTO q FROM public.quotes WHERE id = NEW.quote_id;
    INSERT INTO public.admin_notifications (type, title, message, quote_id, client_code, email)
    VALUES (
      'quote_message',
      'New Quote Message',
      NEW.sender_name || ' (' || COALESCE(q.client_code,'') || '): ' || NEW.message,
      NEW.quote_id,
      q.client_code,
      q.email
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admin_on_quote_message() FROM anon, authenticated, public;

CREATE TRIGGER trg_notify_admin_on_quote_message
AFTER INSERT ON public.quote_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_quote_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_messages;
