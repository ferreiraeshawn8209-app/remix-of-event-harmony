alter table public.profiles
  add column if not exists event_type text,
  add column if not exists event_date date,
  add column if not exists venue_name text,
  add column if not exists venue_address text,
  add column if not exists start_time time without time zone,
  add column if not exists end_time time without time zone,
  add column if not exists guest_count integer,
  add column if not exists event_setting text,
  add column if not exists city text;

alter table public.quote_requests
  add column if not exists city text,
  add column if not exists venue_provides_sound boolean not null default false,
  add column if not exists requires_microphones boolean not null default false,
  add column if not exists requires_lighting boolean not null default false,
  add column if not exists requires_laser_effects boolean not null default false,
  add column if not exists requires_smoke_machine boolean not null default false,
  add column if not exists requires_fog_machine boolean not null default false,
  add column if not exists requires_low_fog_machine boolean not null default false,
  add column if not exists requires_cold_spark_machines boolean not null default false;

alter table public.quotes
  add column if not exists source_type text not null default 'custom',
  add column if not exists package_id uuid,
  add column if not exists package_name text,
  add column if not exists client_removed_items jsonb not null default '[]'::jsonb;

update public.quote_requests
set
  venue_provides_sound = not coalesce(needs_sound, false),
  requires_microphones = coalesce(needs_mic, false),
  requires_lighting = coalesce(needs_lighting, false),
  requires_smoke_machine = coalesce(needs_special_effects, false)
where
  venue_provides_sound = false
  and requires_microphones = false
  and requires_lighting = false
  and requires_laser_effects = false
  and requires_smoke_machine = false
  and requires_fog_machine = false
  and requires_low_fog_machine = false
  and requires_cold_spark_machines = false;

update public.quotes
set source_type = case
  when exists (
    select 1
    from jsonb_array_elements(coalesce(client_removed_items, '[]'::jsonb)) as removed_item
  ) then source_type
  when exists (
    select 1
    from jsonb_array_elements(coalesce(custom_items, '[]'::jsonb)) as item
    where coalesce(item ->> 'name', '') like '[PKG:%'
  ) then 'package'
  else coalesce(source_type, 'custom')
end
where source_type is null or source_type = 'custom';

update public.profiles p
set
  event_type = coalesce(p.event_type, nullif(u.raw_user_meta_data ->> 'event_type', '')),
  event_date = coalesce(p.event_date, nullif(u.raw_user_meta_data ->> 'event_date', '')::date),
  venue_name = coalesce(p.venue_name, nullif(u.raw_user_meta_data ->> 'venue_name', '')),
  venue_address = coalesce(p.venue_address, nullif(u.raw_user_meta_data ->> 'venue_address', '')),
  start_time = coalesce(p.start_time, nullif(u.raw_user_meta_data ->> 'start_time', '')::time),
  end_time = coalesce(p.end_time, nullif(u.raw_user_meta_data ->> 'end_time', '')::time),
  guest_count = coalesce(p.guest_count, nullif(u.raw_user_meta_data ->> 'guest_count', '')::integer),
  event_setting = coalesce(p.event_setting, nullif(u.raw_user_meta_data ->> 'event_setting', '')),
  city = coalesce(p.city, nullif(u.raw_user_meta_data ->> 'city', ''))
from auth.users u
where p.user_id = u.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    full_name,
    email,
    phone,
    event_type,
    event_date,
    venue_name,
    venue_address,
    start_time,
    end_time,
    guest_count,
    event_setting,
    city
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'event_type', ''),
    nullif(new.raw_user_meta_data ->> 'event_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'venue_name', ''),
    nullif(new.raw_user_meta_data ->> 'venue_address', ''),
    nullif(new.raw_user_meta_data ->> 'start_time', '')::time,
    nullif(new.raw_user_meta_data ->> 'end_time', '')::time,
    nullif(new.raw_user_meta_data ->> 'guest_count', '')::integer,
    nullif(new.raw_user_meta_data ->> 'event_setting', ''),
    nullif(new.raw_user_meta_data ->> 'city', '')
  );
  return new;
end;
$$;
