
-- Add payment tracking columns to quotes
ALTER TABLE public.quotes 
ADD COLUMN deposit_paid boolean NOT NULL DEFAULT false,
ADD COLUMN deposit_paid_at timestamp with time zone,
ADD COLUMN balance_paid boolean NOT NULL DEFAULT false,
ADD COLUMN balance_paid_at timestamp with time zone;
