
alter table public.contest_snapshot enable row level security;
alter table public.contest_payouts  enable row level security;

-- Created by CREATE TABLE AS, which copies rows but no policies.
alter table public.contest_snapshot_archive_20260803 enable row level security;

-- Belt and braces: revoke the default grants as well, so access does not rest
-- on RLS alone.
revoke all on public.contest_snapshot from anon, authenticated;
revoke all on public.contest_payouts  from anon, authenticated;
revoke all on public.contest_snapshot_archive_20260803 from anon, authenticated;