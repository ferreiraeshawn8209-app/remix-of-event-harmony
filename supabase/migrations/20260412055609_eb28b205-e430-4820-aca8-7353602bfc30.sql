
-- Create specials table
CREATE TABLE public.specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage specials"
  ON public.specials FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active specials"
  ON public.specials FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_specials_updated_at
  BEFORE UPDATE ON public.specials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for specials images
INSERT INTO storage.buckets (id, name, public) VALUES ('specials-images', 'specials-images', true);

CREATE POLICY "Anyone can view specials images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'specials-images');

CREATE POLICY "Admins can upload specials images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'specials-images' AND (SELECT is_admin()));

CREATE POLICY "Admins can delete specials images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'specials-images' AND (SELECT is_admin()));
