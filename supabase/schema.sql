-- Cosign — Supabase schema
--
-- Everything here is scoped to the signed-in user by row-level security. The
-- app's own repositories already hide the storage layer, so switching to this
-- is a matter of exporting a different implementation — no component changes.
--
-- Run once:  supabase db push   (or paste into the SQL editor)

-- ── profile ────────────────────────────────────────────────────────────────
-- One row per person. `state` holds the whole AppState blob rather than a
-- column per field: the shape still changes weekly, and a JSON column absorbs
-- that without a migration every time. Split it out once it stops moving.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- ── takes ──────────────────────────────────────────────────────────────────
create table if not exists public.takes (
  id         uuid primary key default gen_random_uuid(),
  post_id    text not null,
  author_id  uuid not null references auth.users(id) on delete cascade,
  handle     text not null,
  body       text not null default '',
  verdict    text check (verdict in ('heater','solid','mid','nah')),
  created_at timestamptz not null default now()
);

create index if not exists takes_post_idx on public.takes (post_id, created_at desc);

alter table public.takes enable row level security;

-- Takes are public reading, own-row writing. A conversation nobody can read
-- isn't a conversation.
create policy "takes are public"   on public.takes for select using (true);
create policy "write own take"     on public.takes for insert with check (auth.uid() = author_id);
create policy "delete own take"    on public.takes for delete using (auth.uid() = author_id);

-- ── take likes ─────────────────────────────────────────────────────────────
create table if not exists public.take_likes (
  take_id  uuid not null references public.takes(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  primary key (take_id, user_id)
);

alter table public.take_likes enable row level security;
create policy "likes are public" on public.take_likes for select using (true);
create policy "like as self"     on public.take_likes for insert with check (auth.uid() = user_id);
create policy "unlike as self"   on public.take_likes for delete using (auth.uid() = user_id);

-- ── post reactions (like / save) ───────────────────────────────────────────
create table if not exists public.post_reactions (
  post_id  text not null,
  user_id  uuid not null references auth.users(id) on delete cascade,
  kind     text not null check (kind in ('like','save')),
  primary key (post_id, user_id, kind)
);

alter table public.post_reactions enable row level security;
create policy "reactions are public" on public.post_reactions for select using (true);
create policy "react as self"        on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "unreact as self"      on public.post_reactions for delete using (auth.uid() = user_id);

-- ── community identifications ──────────────────────────────────────────────
create table if not exists public.community_ids (
  id         uuid primary key default gen_random_uuid(),
  post_id    text not null,
  author_id  uuid not null references auth.users(id) on delete cascade,
  slot       text not null,
  brand      text not null,
  piece      text not null,
  link       text,
  evidence   text,
  -- never shown as confirmed until a human has checked it
  verified   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cids_post_idx on public.community_ids (post_id);

alter table public.community_ids enable row level security;
create policy "ids are public"  on public.community_ids for select using (true);
create policy "suggest as self" on public.community_ids for insert with check (auth.uid() = author_id);

create table if not exists public.community_id_votes (
  cid_id   uuid not null references public.community_ids(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  primary key (cid_id, user_id)
);

alter table public.community_id_votes enable row level security;
create policy "votes are public" on public.community_id_votes for select using (true);
create policy "vote as self"     on public.community_id_votes for insert with check (auth.uid() = user_id);

-- ── searches ───────────────────────────────────────────────────────────────
-- The purest demand signal there is. Stored without a user id on purpose: we
-- want to know what people look for, not who looked.
create table if not exists public.searches (
  id         bigserial primary key,
  term       text not null,
  created_at timestamptz not null default now()
);

create index if not exists searches_term_idx on public.searches (term);

alter table public.searches enable row level security;
create policy "log a search" on public.searches for insert with check (true);

-- Aggregate view so the client never reads raw rows.
create or replace view public.top_searches as
  select term, count(*)::int as n
  from public.searches
  where created_at > now() - interval '30 days'
  group by term
  order by n desc
  limit 50;
