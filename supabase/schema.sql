-- ============================================================
-- EQUISTABLE CRM — Schema Supabase (multi-tenant, RLS, ruoli)
-- Incolla tutto nell'SQL Editor di Supabase ed esegui.
-- ============================================================

-- ORGANIZZAZIONI (una per scuderia)
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz default now()
);

-- MEMBRI (utente <-> org, con ruolo)
create table public.memberships (
  user_id uuid references auth.users(id) on delete cascade,
  org_id uuid references public.orgs(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz default now(),
  primary key (user_id, org_id)
);

-- CODICI INVITO (il titolare li genera, il dipendente li usa in fase di registrazione)
create table public.invites (
  code text primary key,
  org_id uuid references public.orgs(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELLE DATI (una per modulo, payload jsonb + org_id)
-- ============================================================
create table public.clienti     (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.cavalli     (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.istruttori  (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.box         (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.lezioni     (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.fatture     (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.eventi      (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.magazzino   (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.documenti   (id text primary key, org_id uuid not null references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table public.impostazioni(org_id uuid primary key references public.orgs(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());

create index on public.clienti (org_id);
create index on public.cavalli (org_id);
create index on public.istruttori (org_id);
create index on public.box (org_id);
create index on public.lezioni (org_id);
create index on public.fatture (org_id);
create index on public.eventi (org_id);
create index on public.magazzino (org_id);
create index on public.documenti (org_id);

-- ============================================================
-- HELPER: l'utente è membro / owner di questa org?
-- (security definer per evitare ricorsione RLS su memberships)
-- ============================================================
create or replace function public.is_member(p_org uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = auth.uid());
$$;

create or replace function public.is_owner(p_org uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = auth.uid() and m.role = 'owner');
$$;

-- ============================================================
-- RPC: crea una nuova scuderia (chi la crea diventa owner)
-- ============================================================
create or replace function public.create_org(p_nome text)
returns uuid language plpgsql security definer as $$
declare v_org uuid;
begin
  insert into public.orgs (nome) values (p_nome) returning id into v_org;
  insert into public.memberships (user_id, org_id, role) values (auth.uid(), v_org, 'owner');
  insert into public.impostazioni (org_id, data) values (v_org, jsonb_build_object('nome', p_nome, 'indirizzo','','piva','','telefono','','email',''));
  return v_org;
end $$;

-- RPC: entra in una scuderia con codice invito
create or replace function public.join_org(p_code text)
returns uuid language plpgsql security definer as $$
declare v_org uuid; v_role text;
begin
  select org_id, role into v_org, v_role from public.invites where code = p_code;
  if v_org is null then raise exception 'Codice invito non valido'; end if;
  insert into public.memberships (user_id, org_id, role) values (auth.uid(), v_org, v_role)
    on conflict (user_id, org_id) do nothing;
  return v_org;
end $$;

-- RPC: genera codice invito (solo owner)
create or replace function public.create_invite(p_org uuid, p_role text default 'staff')
returns text language plpgsql security definer as $$
declare v_code text;
begin
  if not public.is_owner(p_org) then raise exception 'Solo il titolare puo generare inviti'; end if;
  v_code := upper(substr(md5(random()::text), 1, 8));
  insert into public.invites (code, org_id, role) values (v_code, p_org, p_role);
  return v_code;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.orgs enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.clienti enable row level security;
alter table public.cavalli enable row level security;
alter table public.istruttori enable row level security;
alter table public.box enable row level security;
alter table public.lezioni enable row level security;
alter table public.fatture enable row level security;
alter table public.eventi enable row level security;
alter table public.magazzino enable row level security;
alter table public.documenti enable row level security;
alter table public.impostazioni enable row level security;

create policy "org visibile ai membri" on public.orgs for select using (public.is_member(id));
create policy "membership propria o della propria org" on public.memberships for select using (user_id = auth.uid() or public.is_member(org_id));
create policy "inviti visibili all'owner" on public.invites for select using (public.is_owner(org_id));

-- Moduli condivisi: ogni membro legge e scrive
create policy "membri rw" on public.clienti    for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.cavalli    for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.istruttori for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.box        for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.lezioni    for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.eventi     for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.magazzino  for all using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "membri rw" on public.documenti  for all using (public.is_member(org_id)) with check (public.is_member(org_id));

-- FATTURAZIONE: solo il titolare
create policy "owner only" on public.fatture for all using (public.is_owner(org_id)) with check (public.is_owner(org_id));

-- IMPOSTAZIONI: tutti leggono, solo owner scrive
create policy "membri leggono" on public.impostazioni for select using (public.is_member(org_id));
create policy "owner scrive"   on public.impostazioni for insert with check (public.is_owner(org_id));
create policy "owner aggiorna" on public.impostazioni for update using (public.is_owner(org_id));

-- ============================================================
-- REALTIME: abilita le tabelle alla publication
-- ============================================================
alter publication supabase_realtime add table
  public.clienti, public.cavalli, public.istruttori, public.box,
  public.lezioni, public.fatture, public.eventi, public.magazzino,
  public.documenti, public.impostazioni;
