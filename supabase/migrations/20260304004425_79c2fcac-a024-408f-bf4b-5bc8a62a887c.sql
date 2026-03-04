
-- Service settings key-value table for rates
CREATE TABLE public.service_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value numeric NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service settings" ON public.service_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service settings" ON public.service_settings
  FOR ALL USING (is_admin());

-- Seed default service settings
INSERT INTO public.service_settings (setting_key, setting_value, label, description) VALUES
  ('dj_hourly_rate', 800, 'DJ Hourly Rate', 'Cost per hour for DJ service'),
  ('kids_corner_hourly_rate', 500, 'Kids Corner Hourly Rate', 'Cost per hour for kids corner entertainment'),
  ('travel_rate_per_km', 7.5, 'Travel Rate per KM', 'Cost per kilometer for travel beyond free distance'),
  ('free_travel_km', 30, 'Free Travel Distance (KM)', 'Kilometers included at no charge'),
  ('overtime_multiplier', 1.5, 'Overtime Multiplier', 'Multiplier applied to overtime hours'),
  ('deposit_percent', 30, 'Deposit Percentage', 'Percentage of total required as non-refundable deposit');

-- Packages table
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  includes jsonb NOT NULL DEFAULT '[]'::jsonb,
  popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (is_admin());

-- Seed packages from existing hardcoded data
INSERT INTO public.packages (name, category, description, price, includes, popular, sort_order) VALUES
  ('Essential Wedding', 'wedding', 'Perfect for intimate weddings. Professional DJ service with all the essentials for your special day.', 8500, '["5 hours DJ service","Professional sound system (up to 100 guests)","Basic lighting package","Wireless microphone for speeches","Wedding ceremony music","MC services","Consultation meeting"]', false, 1),
  ('Premium Wedding', 'wedding', 'The complete wedding experience. Enhanced sound, professional lighting, and dedicated coordination.', 15000, '["8 hours DJ service","Premium sound system (up to 200 guests)","Moving head lights & uplighting","2 Wireless microphones","Ceremony & reception music","First dance spotlight","Low fog machine for first dance","Professional MC services","Detailed planning consultation","Backup equipment on-site"]', true, 2),
  ('Luxury Wedding', 'wedding', 'The ultimate wedding celebration. No limits, no compromises. Your dream wedding soundscape.', 25000, '["10+ hours DJ service","Concert-grade sound (up to 400 guests)","Full intelligent lighting rig","LED dance floor lighting","Laser show package","Multiple wireless microphones","All ceremony transitions","Premium low fog effects","Confetti/streamer cannons","Dedicated event coordinator","2 DJs available","Kiddies corner entertainment","After-party setup"]', false, 3),
  ('Corporate Basic', 'corporate', 'Professional background music and sound for corporate functions and networking events.', 6000, '["4 hours service","Professional sound system","Background/ambient music","Wireless microphone","PA announcements","Playlist customization"]', false, 1),
  ('Corporate Full', 'corporate', 'Complete corporate event solution with entertainment and professional presentation support.', 12000, '["6 hours service","Enhanced sound system","Elegant lighting setup","2 Wireless microphones","Presentation audio support","Award ceremony coordination","Background to party transition","Custom branded playlist","Technical support included"]', true, 2),
  ('Corporate Gala', 'corporate', 'Premium gala and awards ceremony package with full production capabilities.', 20000, '["8+ hours service","Premium PA system","Full stage lighting","Multiple microphones","Presentation/AV integration","Awards ceremony support","Walk-on music & fanfares","Live mixing & mastering","Dedicated technical crew","Backup systems on-site"]', false, 3),
  ('Party Starter', 'party', 'Get the party started! Perfect for birthdays, house parties, and small celebrations.', 4500, '["4 hours DJ service","Party sound system","LED party lights","Smoke machine","Playlist requests","Games & activities"]', false, 1),
  ('Party Premium', 'party', 'Take your celebration to the next level with premium sound and effects.', 8000, '["6 hours DJ service","Enhanced sound system","Moving head lights","Laser effects","Smoke & bubble machines","Wireless microphone","MC services","Interactive games","Photo moment lighting"]', true, 2),
  ('Ultimate Party', 'party', 'The ultimate celebration experience. Club-quality production for your private event.', 14000, '["8+ hours DJ service","Club-grade sound system","Full intelligent lighting","Laser show","All special effects","Multiple microphones","Professional MC","Dance competitions","Kiddies corner option","After-party extension available"]', false, 3);

-- Triggers for updated_at
CREATE TRIGGER update_service_settings_updated_at BEFORE UPDATE ON public.service_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
