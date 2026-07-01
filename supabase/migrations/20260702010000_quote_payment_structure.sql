ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_structure text NOT NULL DEFAULT 'deposit',
  ADD COLUMN IF NOT EXISTS payment_plan_installments jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotes_payment_structure_check'
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_payment_structure_check
      CHECK (payment_structure IN ('deposit', 'monthly_installments'));
  END IF;
END$$;
