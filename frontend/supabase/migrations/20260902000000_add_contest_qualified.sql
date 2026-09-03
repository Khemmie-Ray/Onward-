-- Per-user flag: does this referred user currently qualify for the active
-- referral contest? Computed by scripts/sync-contest-qualified.ts and READ by
-- the standings route (fast, no on-chain calls at request time).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS contest_qualified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contest_qualified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_contest_qualified
  ON public.users (referred_by_user_id)
  WHERE contest_qualified = true;