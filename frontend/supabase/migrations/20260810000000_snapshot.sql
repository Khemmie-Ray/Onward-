
create table if not exists contest_snapshot (
  rank             integer not null,
  user_id          uuid not null references users(id),
  display_name     text not null,
  wallet_address   text not null,
  lessons          integer not null default 0,
  rounds           integer not null default 0,
  rounds_passed    integer not null default 0,
  claims           integer not null default 0,
  referrals        integer not null default 0,
  verified_points  integer not null default 0,
  lesson_points    integer not null default 0,
  round_points     integer not null default 0,
  claim_points     integer not null default 0,
  referral_points  integer not null default 0,
  bonus_points     integer not null default 0,
  total_points     integer not null default 0,
  snapshot_at      timestamptz not null default now(),
  primary key (user_id)
);

create index if not exists contest_snapshot_rank_idx
  on contest_snapshot (rank);