
-- Equipment catalog table
CREATE TABLE public.equipment_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can view active items
CREATE POLICY "Anyone can view active equipment" ON public.equipment_catalog
  FOR SELECT USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage equipment" ON public.equipment_catalog
  FOR ALL USING (is_admin());

-- Updated at trigger
CREATE TRIGGER update_equipment_catalog_updated_at
  BEFORE UPDATE ON public.equipment_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed with current catalog data
INSERT INTO public.equipment_catalog (item_key, name, category, description, price, image_url, sort_order) VALUES
  ('partyrocker', 'Partyrocker 300W RMS', 'Speakers', '2 X 6 INCH DUAL SUB + TWEET - Perfect for small to medium venues with crystal-clear sound and deep bass', 650, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop', 1),
  ('boothSpeaker', 'Booth Speaker', 'Speakers', '2 X 3 INCH DUAL CONE - Compact monitoring speaker ideal for DJ booth reference', 350, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 2),
  ('subwoofer', '15" DBTECH Subwoofer 600W RMS', 'Speakers', '15 INCH WOOF - Thunderous bass that you can feel. Perfect for dance floors and large venues', 1000, 'https://images.unsplash.com/photo-1593697821028-7cc59cfd7399?w=400&h=300&fit=crop', 3),
  ('mixer', 'Professional Mixer', 'Mixers/Amplifiers', '4 channel professional mixer with EQ controls, effects, and seamless track transitions', 400, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop', 4),
  ('amplifier', 'Amplifier', 'Mixers/Amplifiers', '4 channel power amplifier delivering clean, distortion-free sound to all speakers', 600, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 5),
  ('rgbStrobe', '5 Eye RGB LED Strobe', 'Lighting', 'Sound-Activated LED Strobe with Remote - Creates electrifying atmosphere with pulsing lights', 200, 'https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=400&h=300&fit=crop', 6),
  ('uvBar', 'UV Light Bar', 'Lighting', 'Ultraviolet light for stages and venues - Makes whites glow and creates stunning visual effects', 250, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop', 7),
  ('spiderHead', '8 Eye Spider Moving Head', 'Lighting', '9x10W LEDs with red/green lasers - Professional moving head light with sweeping beams', 500, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop', 8),
  ('washHead', 'Wash Light Moving Head', 'Lighting', 'Wash light moving robotic head RGB - Floods the venue with smooth, blended colors', 400, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop', 9),
  ('rgbLaser', 'RGB Laser Combo Show', 'Lighting', 'Single Head Animation with DMX - Stunning laser patterns and animations for the ultimate show', 500, 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=300&fit=crop', 10),
  ('disco21', '21 Eye RGB LED UV Disco', 'Lighting', 'Voice-Activated, Sound-Synced - Mesmerizing disco effect that responds to the beat', 350, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop', 11),
  ('moodLight', 'LED Mood Light', 'Lighting', 'Colourful up-lighter for décor - Elegant ambient lighting to match your event theme', 140, 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop', 12),
  ('laserBall', 'LED RGB Laser Disco Ball', 'Lighting', 'Ceiling Sound-Activated Projector - Classic disco vibes with modern LED technology', 100, 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=300&fit=crop', 13),
  ('wirelessMic', 'Wireless Mic', 'Microphones', 'Professional wireless microphone - Freedom to move while making announcements or speeches', 250, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop', 14),
  ('wiredMic', 'Wired Mic', 'Microphones', 'Reliable wired microphone - Crystal clear audio for speeches and announcements', 180, 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=400&h=300&fit=crop', 15),
  ('twoWayRadio', '2 Way Radio', 'Microphones', 'Walkie Talkie for cueing/timing - Essential for coordinating with event planners and venues', 300, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop', 16),
  ('smokeMachine', 'Smoke Machine', 'Effects', 'Single burst, includes 250ml fluid - Creates dramatic atmosphere and enhances light beams', 400, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop', 17),
  ('lowFog', 'Low Fog Machine', 'Effects', 'Medium 25L, includes 2KG dry ice - Magical floor-hugging fog for first dances and grand entrances', 700, 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=300&fit=crop', 18),
  ('bubbleBlaster', 'Bubble Blaster', 'Effects', 'Small, includes 100ml fluid - Fun and whimsical bubbles for parties and celebrations', 150, 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=400&h=300&fit=crop', 19);
