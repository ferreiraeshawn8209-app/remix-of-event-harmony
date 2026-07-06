alter table public.quote_requests
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_accepted_at timestamptz;

update public.quote_requests
set
  terms_accepted = true,
  terms_accepted_at = coalesce(terms_accepted_at, created_at)
where terms_accepted = false;

alter table public.quote_requests
  drop constraint if exists quote_requests_terms_accepted_check;

alter table public.quote_requests
  add constraint quote_requests_terms_accepted_check
  check (terms_accepted = true);
