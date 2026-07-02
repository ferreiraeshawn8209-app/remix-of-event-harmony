alter table public.testimonials
  add column if not exists source_platform text,
  add column if not exists source_review_id text,
  add column if not exists source_url text;

create unique index if not exists testimonials_source_platform_review_id_key
  on public.testimonials (source_platform, source_review_id);
