
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS early_settlement_percent numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS early_settlement_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_settlement_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_settlement_applied_at timestamp with time zone;
