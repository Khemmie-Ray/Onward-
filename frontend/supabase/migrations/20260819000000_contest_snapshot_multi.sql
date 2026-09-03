
create table if not exists contest_snapshot_archive_20260803 as
  select * from contest_snapshot;

alter table contest_snapshot
  add column if not exists contest_slug text;

alter table contest_snapshot
  add column if not exists board text;

-- Existing rows are contest 1, which ran a single combined board.
update contest_snapshot
   set contest_slug = '2026-08-03'
 where contest_slug is null;

update contest_snapshot
   set board = 'combined'
 where board is null;

alter table contest_snapshot
  alter column contest_slug set not null;

alter table contest_snapshot
  alter column board set not null;

alter table contest_snapshot
  drop constraint if exists contest_snapshot_pkey;

alter table contest_snapshot
  add constraint contest_snapshot_pkey
  primary key (contest_slug, board, user_id);

alter table contest_snapshot
  add column if not exists quality_referrals integer not null default 0;

alter table contest_snapshot
  add column if not exists total_invited integer not null default 0;

drop index if exists contest_snapshot_rank_idx;

create index if not exists contest_snapshot_contest_board_rank_idx
  on contest_snapshot (contest_slug, board, rank);

create index if not exists contest_snapshot_user_idx
  on contest_snapshot (user_id);