
-- Add client_code to quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_code text UNIQUE;

-- Generate codes for existing quotes
UPDATE public.quotes 
SET client_code = 'BK-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6))
WHERE client_code IS NULL;

-- Make it NOT NULL with a default for new quotes
ALTER TABLE public.quotes ALTER COLUMN client_code SET DEFAULT '';

-- Function to auto-generate client code on insert
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.client_code IS NULL OR NEW.client_code = '' THEN
    NEW.client_code := 'BK-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_client_code
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_client_code();

-- Allow public lookup of quotes by client_code + email (for client portal)
-- Create a security definer function so unauthenticated clients can look up their quote
CREATE OR REPLACE FUNCTION public.lookup_quote_by_code(_email text, _code text)
RETURNS SETOF public.quotes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM public.quotes
  WHERE LOWER(email) = LOWER(_email) AND UPPER(client_code) = UPPER(_code)
  LIMIT 1;
$$;

-- Add RLS policy for the lookup function to work (it's security definer so bypasses RLS)
-- Also add a policy so anon can call the function
GRANT EXECUTE ON FUNCTION public.lookup_quote_by_code(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_quote_by_code(text, text) TO authenticated;
