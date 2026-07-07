ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS payment_preference text NOT NULL DEFAULT 'deposit';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quote_requests_payment_preference_check'
  ) THEN
    ALTER TABLE public.quote_requests
      ADD CONSTRAINT quote_requests_payment_preference_check
      CHECK (payment_preference IN ('deposit', 'monthly_installments'));
  END IF;
END$$;
