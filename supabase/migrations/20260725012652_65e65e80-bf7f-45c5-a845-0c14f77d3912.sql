
-- 1. Extend event_plans
ALTER TABLE public.event_plans
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS admin_unlocked boolean NOT NULL DEFAULT false;

-- 2. Attachments table
CREATE TABLE IF NOT EXISTS public.plan_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.event_plans(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_attachments TO authenticated;
GRANT ALL ON public.plan_attachments TO service_role;

ALTER TABLE public.plan_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin view attachments"
  ON public.plan_attachments FOR SELECT
  TO authenticated
  USING (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Owner or admin insert attachments"
  ON public.plan_attachments FOR INSERT
  TO authenticated
  WITH CHECK (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Owner or admin update attachments"
  ON public.plan_attachments FOR UPDATE
  TO authenticated
  USING (client_id = public.get_my_profile_id() OR public.is_admin())
  WITH CHECK (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "Owner or admin delete attachments"
  ON public.plan_attachments FOR DELETE
  TO authenticated
  USING (client_id = public.get_my_profile_id() OR public.is_admin());

CREATE TRIGGER update_plan_attachments_updated_at
  BEFORE UPDATE ON public.plan_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_plan_attachments_client ON public.plan_attachments(client_id);
CREATE INDEX IF NOT EXISTS idx_plan_attachments_plan ON public.plan_attachments(plan_id);

-- 3. Storage policies on documents bucket for plan-attachments/{profile_id}/*
CREATE POLICY "Clients upload own plan attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'plan-attachments'
    AND (storage.foldername(name))[2] = public.get_my_profile_id()::text
  );

CREATE POLICY "Clients read own plan attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'plan-attachments'
    AND (
      (storage.foldername(name))[2] = public.get_my_profile_id()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "Clients delete own plan attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'plan-attachments'
    AND (
      (storage.foldername(name))[2] = public.get_my_profile_id()::text
      OR public.is_admin()
    )
  );
