
CREATE TABLE IF NOT EXISTS public.streak_reward_claims (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_day  integer NOT NULL,
  amount_g       numeric NOT NULL,           -- G$ (whole units) recorded for history
  status         text NOT NULL DEFAULT 'pending', -- pending | paid | failed
  tx_hash        text,
  claimed_at     timestamptz NOT NULL DEFAULT now(),
  paid_at        timestamptz,
  UNIQUE (user_id, milestone_day)            -- the double-claim lock
);

CREATE INDEX IF NOT EXISTS idx_streak_reward_claims_user
  ON public.streak_reward_claims (user_id);

-- Helps the reconciliation job find stuck rows.
CREATE INDEX IF NOT EXISTS idx_streak_reward_claims_pending
  ON public.streak_reward_claims (status)
  WHERE status = 'pending';