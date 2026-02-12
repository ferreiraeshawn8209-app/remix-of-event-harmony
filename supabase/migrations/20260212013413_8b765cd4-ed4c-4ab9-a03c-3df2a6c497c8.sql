
ALTER TABLE public.quotes DROP CONSTRAINT quotes_status_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'declined'::text, 'expired'::text, 'paid'::text]));
