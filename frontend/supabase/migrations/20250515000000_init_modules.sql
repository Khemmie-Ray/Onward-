-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- USERS ----------
create table if not exists public.users (
  id              uuid primary key default uuid_generate_v4(),
  privy_did       text unique not null,
  wallet_address  text unique not null,
  display_name    text,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  current_streak  int not null default 0,
  longest_streak  int not null default 0,
  total_g_earned  bigint not null default 0,
  current_level   int not null default 1
);

create index if not exists idx_users_wallet on public.users (wallet_address);
create index if not exists idx_users_privy on public.users (privy_did);

-- ---------- MODULES ----------
create table if not exists public.modules (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,
  title               text not null,
  category            text not null check (category in ('Foundations', 'Identity', 'Economics', 'Safety', 'Ecosystem')),
  order_in_category   int not null default 0,
  description         text,
  estimated_minutes   int not null default 5,
  reward_g_amount     int not null default 20,
  status              text not null default 'live' check (status in ('draft', 'live', 'deprecated')),
  prerequisite_slug   text,
  first_card_tease    text,
  what_you_will_learn jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_modules_category on public.modules (category, order_in_category);
create index if not exists idx_modules_status on public.modules (status);

-- ---------- MODULE CARDS ----------
create table if not exists public.module_cards (
  id            uuid primary key default uuid_generate_v4(),
  module_id     uuid not null references public.modules(id) on delete cascade,
  order_index   int not null,
  type          text not null check (type in ('flip', 'choice', 'spotter')),
  content       jsonb not null,
  unique (module_id, order_index)
);

create index if not exists idx_module_cards_module on public.module_cards (module_id, order_index);

-- ---------- MODULE PROGRESS (in-flight, mutable) ----------
create table if not exists public.module_progress (
  user_id         uuid not null references public.users(id) on delete cascade,
  module_id       uuid not null references public.modules(id) on delete cascade,
  current_card    int not null default 1,
  started_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- ---------- MODULE COMPLETIONS (permanent, immutable) ----------
create table if not exists public.module_completions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  module_id       uuid not null references public.modules(id) on delete cascade,
  completed_at    timestamptz not null default now(),
  quiz_score      int,
  reward_tx_hash  text,
  badge_token_id  text,
  unique (user_id, module_id)
);

create index if not exists idx_completions_user on public.module_completions (user_id);

-- ---------- Trigger: keep modules.updated_at fresh ----------
create or replace function public.tg_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at
  before update on public.modules
  for each row execute function public.tg_set_updated_at();

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.modules enable row level security;
alter table public.module_cards enable row level security;
alter table public.module_progress enable row level security;
alter table public.module_completions enable row level security;

-- Modules and module_cards are public-readable (the curriculum is open)
drop policy if exists "modules_public_read" on public.modules;
create policy "modules_public_read"
  on public.modules for select
  using (status = 'live');

drop policy if exists "module_cards_public_read" on public.module_cards;
create policy "module_cards_public_read"
  on public.module_cards for select
  using (exists (select 1 from public.modules m where m.id = module_id and m.status = 'live'));

-- Users can read/update their own user row
drop policy if exists "users_own_read" on public.users;
create policy "users_own_read"
  on public.users for select
  using (auth.jwt() ->> 'sub' = privy_did);

drop policy if exists "users_own_update" on public.users;
create policy "users_own_update"
  on public.users for update
  using (auth.jwt() ->> 'sub' = privy_did);

-- Progress and completions: read/write own only
drop policy if exists "progress_own" on public.module_progress;
create policy "progress_own"
  on public.module_progress for all
  using (user_id in (select id from public.users where privy_did = auth.jwt() ->> 'sub'));

drop policy if exists "completions_own_read" on public.module_completions;
create policy "completions_own_read"
  on public.module_completions for select
  using (user_id in (select id from public.users where privy_did = auth.jwt() ->> 'sub'));

-- Writes to completions go through service_role (server-only), so no public insert policy.
-- Same for users INSERT — created server-side on first auth.
