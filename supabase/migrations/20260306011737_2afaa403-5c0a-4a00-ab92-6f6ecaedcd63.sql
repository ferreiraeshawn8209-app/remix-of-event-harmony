
-- Create documents storage bucket for T&Cs and other business documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Admins can manage documents
CREATE POLICY "Admins can manage documents" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.is_admin())
WITH CHECK (bucket_id = 'documents' AND public.is_admin());

-- Authenticated users can view/download documents
CREATE POLICY "Authenticated can view documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- Public can view documents (for PDF generation)
CREATE POLICY "Public can view documents" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'documents');
