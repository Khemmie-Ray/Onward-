-- frontend/supabase/migrations/20261120000000_milestone_claims.sql
-- Milestones are now claimed by the user instead of paid automatically.
-- A row in user_milestones means "earned". claimed_at means "points paid".

ALTER TABLE public.user_milestones
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Everything recorded before this change was either paid automatically or
-- backfilled with 0 points, so there is nothing left to claim on those rows.
UPDATE public.user_milestones
SET claimed_at = achieved_at
WHERE claimed_at IS NULL;