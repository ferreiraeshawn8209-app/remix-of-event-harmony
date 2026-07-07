CREATE TABLE public.alarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('followup_quoted','followup_request','event_prep')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_at timestamptz NOT NULL,
  stage int NOT NULL DEFAULT 1,
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  quote_id uuid,
  quote_request_id uuid,
  client_name text,
  client_email text,
  ai_reasoning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alarms" ON public.alarms
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX idx_alarms_due ON public.alarms (is_done, due_at);
CREATE INDEX idx_alarms_quote ON public.alarms (quote_id);
CREATE INDEX idx_alarms_request ON public.alarms (quote_request_id);

CREATE TRIGGER trg_alarms_updated_at
BEFORE UPDATE ON public.alarms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();