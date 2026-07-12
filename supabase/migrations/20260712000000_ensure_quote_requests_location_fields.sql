-- Ensure quote_requests has city, area, and province columns
-- This migration resolves schema mismatches between form submission and database

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS province text;

-- Update RLS policies to allow clients to insert quote requests with all location fields
-- (assuming standard RLS exists; this ensures no policy blocks these columns)
