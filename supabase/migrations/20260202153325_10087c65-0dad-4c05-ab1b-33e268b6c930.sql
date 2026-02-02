-- Fix broken RLS UPDATE policy on quotes (subquery previously returned multiple rows)
DROP POLICY IF EXISTS "Users can update their own quotes (no discount changes)" ON public.quotes;

CREATE POLICY "Users can update their own quotes (no discount changes)"
ON public.quotes
FOR UPDATE
USING ((client_id = public.get_my_profile_id()) OR public.is_admin())
WITH CHECK (
  public.is_admin()
  OR (
    client_id = public.get_my_profile_id()
    AND discount_percent = (
      SELECT q.discount_percent
      FROM public.quotes q
      WHERE q.id = quotes.id
    )
  )
);