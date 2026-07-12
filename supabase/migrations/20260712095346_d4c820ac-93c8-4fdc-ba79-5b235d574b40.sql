
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_structure text NOT NULL DEFAULT 'deposit',
  ADD COLUMN IF NOT EXISTS payment_plan_installments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS package_id uuid NULL,
  ADD COLUMN IF NOT EXISTS package_name text NULL,
  ADD COLUMN IF NOT EXISTS client_removed_items jsonb NOT NULL DEFAULT '[]'::jsonb;
