
ALTER TABLE public.event_plans 
ADD COLUMN IF NOT EXISTS schedule_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS event_style text DEFAULT 'general';

COMMENT ON COLUMN public.event_plans.schedule_items IS 'Array of {time, moment, song, artist, notes, type} for DJ cue sheet';
COMMENT ON COLUMN public.event_plans.event_style IS 'wedding, corporate, or general';
