-- Add missing music planning columns to event_plans table
-- These fields cover wedding-specific song moments and genre/artist preferences

ALTER TABLE public.event_plans
  ADD COLUMN IF NOT EXISTS father_daughter_song   text,
  ADD COLUMN IF NOT EXISTS father_daughter_artist  text,
  ADD COLUMN IF NOT EXISTS mother_son_song         text,
  ADD COLUMN IF NOT EXISTS mother_son_artist       text,
  ADD COLUMN IF NOT EXISTS preferred_genres        text,
  ADD COLUMN IF NOT EXISTS artists_to_avoid        text;

-- Add city, area, province to quote_requests for richer location data
-- CRITICAL FIX: Ensure all three location columns exist
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS city      text,
  ADD COLUMN IF NOT EXISTS area      text,
  ADD COLUMN IF NOT EXISTS province  text;

-- Add audit_log table for permanent action history
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role  text        NOT NULL DEFAULT 'client', -- 'admin' | 'client' | 'system'
  action      text        NOT NULL,
  entity_type text,       -- 'quote' | 'quote_request' | 'event_plan' | etc.
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit log entries
DROP POLICY IF EXISTS "Admins can read audit log" ON public.audit_log;
CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Any authenticated user can insert their own audit entries
DROP POLICY IF EXISTS "Authenticated users can insert audit entries" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit entries"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT INSERT ON public.audit_log TO authenticated;
GRANT ALL   ON public.audit_log TO service_role;
