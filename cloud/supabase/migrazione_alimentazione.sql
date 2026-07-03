-- ============================================================
-- MIGRAZIONE: modulo Alimentazione & Diete
-- Da eseguire nell'SQL Editor di Supabase sul progetto ESISTENTE.
-- (Le nuove installazioni non ne hanno bisogno: schema.sql è già aggiornato)
-- ============================================================

create table public.mangimi (
  id text primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
create table public.diete (
  id text primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

create index on public.mangimi (org_id);
create index on public.diete (org_id);

alter table public.mangimi enable row level security;
alter table public.diete enable row level security;

create policy "membri rw" on public.mangimi for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.diete   for all using (public.is_member(org_id)) with check (public.is_member(org_id));

alter publication supabase_realtime add table public.mangimi, public.diete;
