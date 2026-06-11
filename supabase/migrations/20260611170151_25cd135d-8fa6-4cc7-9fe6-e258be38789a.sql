
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  event_type text,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view live testimonials" ON public.testimonials FOR SELECT USING (is_live = true);
CREATE POLICY "Admins can view all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text,
  posted_to_facebook boolean NOT NULL DEFAULT false,
  posted_to_bark boolean NOT NULL DEFAULT false,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.client_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_reviews TO authenticated;
GRANT ALL ON public.client_reviews TO service_role;
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a review" ON public.client_reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can submit a review" ON public.client_reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view reviews" ON public.client_reviews FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update reviews" ON public.client_reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete reviews" ON public.client_reviews FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_client_reviews_updated BEFORE UPDATE ON public.client_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_admin_on_client_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, email)
  VALUES (
    'client_review',
    NEW.rating::text || '★ Review',
    COALESCE(NEW.guest_name, 'A guest') || ' left a ' || NEW.rating::text || '-star review' ||
      CASE WHEN NEW.message IS NOT NULL THEN ': "' || left(NEW.message, 140) || '"' ELSE '' END,
    NEW.guest_email
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_admin_on_review AFTER INSERT ON public.client_reviews FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_client_review();

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS human_jukebox boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS human_jukebox_hours numeric NOT NULL DEFAULT 0;

INSERT INTO public.service_settings (setting_key, label, setting_value, description)
SELECT 'human_jukebox_rate', 'Human Jukebox Rate (per hour)', 250, 'Hourly rate for dedicated guest song requests'
WHERE NOT EXISTS (SELECT 1 FROM public.service_settings WHERE setting_key = 'human_jukebox_rate');

ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS discount_percent numeric;
