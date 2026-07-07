
-- Add custom_items column to quotes table for storing custom line items
ALTER TABLE public.quotes ADD COLUMN custom_items jsonb DEFAULT '[]'::jsonb;

-- Add custom_items_cost column to track the total cost of custom items
ALTER TABLE public.quotes ADD COLUMN custom_items_cost numeric DEFAULT 0;
