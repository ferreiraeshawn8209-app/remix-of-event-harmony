ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS event_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS multi_day_discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS multi_day_discount_amount numeric NOT NULL DEFAULT 0;