-- Article version history table
create table if not exists public.kb_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.kb_articles(id)
    on delete cascade,
  title text not null,
  content jsonb,
  content_text text,
  saved_by text default 'admin',
  version_label text,
  created_at timestamp default now()
);

create index if not exists kb_article_versions_article_idx
  on public.kb_article_versions (article_id, created_at desc);

alter table public.kb_article_versions
  enable row level security;

-- Service role bypasses RLS automatically
