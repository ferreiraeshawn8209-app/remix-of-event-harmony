create table if not exists public.extra_features (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text,
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.extra_features enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'extra_features'
      and policyname = 'Anyone can view active extra features'
  ) then
    create policy "Anyone can view active extra features"
      on public.extra_features
      for select
      using (is_active = true or is_admin(auth.uid()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'extra_features'
      and policyname = 'Admins can manage extra features'
  ) then
    create policy "Admins can manage extra features"
      on public.extra_features
      for all
      using (is_admin(auth.uid()))
      with check (is_admin(auth.uid()));
  end if;
end $$;

create trigger set_extra_features_updated_at
before update on public.extra_features
for each row
execute function public.update_updated_at_column();

insert into public.extra_features (title, description, image_url, price, sort_order, is_active)
values
  ('Kids Corner', 'Safe fun zone with supervised activities and themed games for little guests.', null, 1500, 1, true),
  ('Human Jukebox', 'Live crowd-request segment where your guests control the vibe in real time.', null, 1200, 2, true),
  ('QR Song Requests', 'Custom QR song request page for your event, linked to your DJ queue.', null, 650, 3, true),
  ('Event Planning & Organising', 'End-to-end event planning support from schedule to supplier coordination.', null, 2500, 4, true)
on conflict do nothing;
