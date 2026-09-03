-- All nullable: null verified_on_onward = "not yet evaluated", which the
-- qualification logic treats as NOT qualified until the sync confirms it.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verified_on_onward boolean,
  ADD COLUMN IF NOT EXISTS onward_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS onward_verify_checked_at timestamptz;

-- Index for the sync job to find users needing a (re)check quickly.
CREATE INDEX IF NOT EXISTS idx_users_onward_verify_pending
  ON public.users (onward_verify_checked_at)
  WHERE referred_by_user_id IS NOT NULL;