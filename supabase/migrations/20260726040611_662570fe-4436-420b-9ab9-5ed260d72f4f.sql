
ALTER TABLE public.event_plans
  ADD COLUMN IF NOT EXISTS color_scheme_primary text,
  ADD COLUMN IF NOT EXISTS color_scheme_secondary text,
  ADD COLUMN IF NOT EXISTS color_scheme_accent text,
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS theme_notes text,
  ADD COLUMN IF NOT EXISTS decor_notes text;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone;
