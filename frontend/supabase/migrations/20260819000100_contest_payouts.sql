
create table if not exists contest_payouts (
  id             uuid primary key default gen_random_uuid(),

  contest_slug   text not null,
  board          text not null,

  user_id        uuid references users(id),
  wallet_address text not null,
  rank           integer,

  amount_g       numeric not null,


  batch_ref      text not null,
  tx_hash        text,

  paid_at        timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create unique index if not exists contest_payouts_unique_idx
  on contest_payouts (contest_slug, board, lower(wallet_address));

create index if not exists contest_payouts_contest_idx
  on contest_payouts (contest_slug, board);

create index if not exists contest_payouts_batch_idx
  on contest_payouts (batch_ref);