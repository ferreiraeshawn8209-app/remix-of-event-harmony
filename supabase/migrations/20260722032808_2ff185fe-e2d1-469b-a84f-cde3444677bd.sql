ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS venue_address text,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS event_setting text,
  ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.event_plans
  ADD COLUMN IF NOT EXISTS preferred_genres text,
  ADD COLUMN IF NOT EXISTS artists_to_avoid text,
  ADD COLUMN IF NOT EXISTS father_daughter_song text,
  ADD COLUMN IF NOT EXISTS father_daughter_artist text,
  ADD COLUMN IF NOT EXISTS mother_son_song text,
  ADD COLUMN IF NOT EXISTS mother_son_artist text;