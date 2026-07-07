-- Beatkulture AI Event Host Platform - Phase 0 schema foundation

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bk_event_status') then
    create type public.bk_event_status as enum ('draft', 'planning', 'ready_for_review', 'approved', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'bk_timeline_status') then
    create type public.bk_timeline_status as enum ('draft', 'generated', 'client_review', 'approved');
  end if;

  if not exists (select 1 from pg_type where typname = 'bk_approval_status') then
    create type public.bk_approval_status as enum ('pending', 'approved', 'changes_requested');
  end if;

  if not exists (select 1 from pg_type where typname = 'bk_message_role') then
    create type public.bk_message_role as enum ('system', 'user', 'assistant');
  end if;
end $$;

create table if not exists public.bk_clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bk_client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bk_clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role text not null default 'editor',
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table if not exists public.bk_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bk_clients(id) on delete cascade,
  type text not null,
  title text not null,
  event_date date,
  venue_name text,
  venue_address text,
  guest_count integer,
  status public.bk_event_status not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bk_weddings (
  event_id uuid primary key references public.bk_events(id) on delete cascade,
  partner_a text,
  partner_b text,
  ceremony_type text,
  cultural_notes text,
  special_moments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bk_music_selections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  segment text not null,
  track_title text not null,
  artist text,
  bpm integer,
  explicit_ok boolean not null default false,
  order_index integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_timelines (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  version integer not null default 1,
  status public.bk_timeline_status not null default 'draft',
  generated_by text not null default 'manual',
  summary text,
  created_at timestamptz not null default now(),
  unique (event_id, version)
);

create table if not exists public.bk_timeline_items (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references public.bk_timelines(id) on delete cascade,
  start_time time not null,
  end_time time,
  category text not null,
  label text not null,
  notes text,
  buffer_before_min integer not null default 0,
  buffer_after_min integer not null default 0,
  order_index integer not null default 0
);

create table if not exists public.bk_event_scenes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  scene_type text not null,
  prompt text,
  asset_urls_json jsonb not null default '[]'::jsonb,
  lighting_profile text,
  decor_profile text,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_rehearsal_videos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  version integer not null default 1,
  duration_sec integer,
  status text not null default 'queued',
  render_job_id text,
  output_url text,
  created_at timestamptz not null default now(),
  unique (event_id, version)
);

create table if not exists public.bk_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  channel text not null default 'text',
  started_by uuid references auth.users(id),
  model text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.bk_ai_conversations(id) on delete cascade,
  role public.bk_message_role not null,
  content text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_avatar_settings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.bk_events(id) on delete cascade,
  avatar_model_uri text,
  emotion_profile jsonb not null default '{}'::jsonb,
  gesture_profile jsonb not null default '{}'::jsonb,
  brand_theme jsonb not null default '{"primary":"gold","secondary":"neon-purple","accent":"neon-orange"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bk_voice_settings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.bk_events(id) on delete cascade,
  stt_model text not null default 'faster-whisper',
  tts_voice text not null default 'piper-default',
  speaking_rate numeric(4,2) not null default 1.00,
  interruption_mode text not null default 'continuous',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bk_event_approvals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  requested_by uuid references auth.users(id),
  status public.bk_approval_status not null default 'pending',
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_approval_comments (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.bk_event_approvals(id) on delete cascade,
  author_id uuid references auth.users(id),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bk_events(id) on delete cascade,
  type text not null,
  title text not null,
  storage_path text not null,
  version integer not null default 1,
  visibility text not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.bk_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_bk_events_client_id on public.bk_events(client_id);
create index if not exists idx_bk_music_selections_event_id on public.bk_music_selections(event_id);
create index if not exists idx_bk_timelines_event_id on public.bk_timelines(event_id);
create index if not exists idx_bk_timeline_items_timeline_id on public.bk_timeline_items(timeline_id);
create index if not exists idx_bk_event_scenes_event_id on public.bk_event_scenes(event_id);
create index if not exists idx_bk_rehearsal_videos_event_id on public.bk_rehearsal_videos(event_id);
create index if not exists idx_bk_ai_conversations_event_id on public.bk_ai_conversations(event_id);
create index if not exists idx_bk_ai_messages_conversation_id on public.bk_ai_messages(conversation_id);
create index if not exists idx_bk_event_approvals_event_id on public.bk_event_approvals(event_id);
create index if not exists idx_bk_documents_event_id on public.bk_documents(event_id);
create index if not exists idx_bk_notifications_user_id on public.bk_notifications(user_id);
