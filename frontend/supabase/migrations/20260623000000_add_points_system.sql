CREATE TYPE point_source AS ENUM (
  'free_round_pass',
  'module_complete',
  'daily_login',
  'referral',
  'leaderboard_weekly',
  'streak_milestone',
  'contest_win',
  'claim_redemption',  -- negative delta when user claims points -> G$
  'manual_adjustment'  -- admin override; requires unique reference_id
);

CREATE TYPE claim_status AS ENUM (
  'pending',     
  'submitted',   
  'confirmed',   
  'failed'       
);

CREATE TYPE spend_category AS ENUM (
  'power_up',
  'cosmetic',
  'streak_repair',
  'raffle',
  'contest_entry',
  'premium_stake',
  'module_retake'
);

-- ─── user_points ─────────────────────────────────────────────────────────────
-- One row per user. balance is what's claimable right now.
-- Invariant: balance = lifetime_earned - lifetime_claimed - sum of pending claims

CREATE TABLE user_points (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance          integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned  integer NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_claimed integer NOT NULL DEFAULT 0 CHECK (lifetime_claimed >= 0),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_points IS
  'Per-user point counters. balance is currently claimable; lifetime_* are running totals.';

-- ─── point_transactions ──────────────────────────────────────────────────────

CREATE TABLE point_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta         integer NOT NULL CHECK (delta != 0),
  source        point_source NOT NULL,
  reference_id  text NOT NULL,  -- e.g. game_session.id, module slug, week_start_date
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Idempotency: the same source+reference can't award twice
  UNIQUE (user_id, source, reference_id)
);

CREATE INDEX point_transactions_user_created_idx
  ON point_transactions (user_id, created_at DESC);

CREATE INDEX point_transactions_source_idx
  ON point_transactions (source);

COMMENT ON TABLE point_transactions IS
  'Append-only audit log of every point movement. The UNIQUE constraint enforces idempotency.';

COMMENT ON COLUMN point_transactions.reference_id IS
  'What this award is for. Use game_session.id for round passes, module slug for completions, ISO date (YYYY-MM-DD) for daily login, week_start_date for leaderboard, milestone name (7d/30d/90d) for streak, claim.id for redemptions.';

-- ─── point_claims ────────────────────────────────────────────────────────────

CREATE TABLE point_claims (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_claimed  integer NOT NULL CHECK (points_claimed > 0),
  g_amount        integer NOT NULL CHECK (g_amount > 0),
  tx_hash         text,
  status          claim_status NOT NULL DEFAULT 'pending',
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  confirmed_at    timestamptz
);

CREATE INDEX point_claims_user_created_idx
  ON point_claims (user_id, created_at DESC);

-- Cron polls pending claims
CREATE INDEX point_claims_status_idx
  ON point_claims (status) WHERE status IN ('pending', 'submitted');

COMMENT ON TABLE point_claims IS
  'Point-to-G$ redemption events. Settlement cron picks up pending rows, batches them, and updates status.';

-- ─── spend_events ────────────────────────────────────────────────────────────
-- Audit log of G$ spent on platform mechanisms. Separate from points to keep
-- earn and spend trails cleanly separated.

CREATE TABLE spend_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  g_amount      integer NOT NULL CHECK (g_amount > 0),
  category      spend_category NOT NULL,
  reference_id  text,  
  metadata      jsonb,
  tx_hash       text, 
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spend_events_user_created_idx
  ON spend_events (user_id, created_at DESC);

CREATE INDEX spend_events_category_idx
  ON spend_events (category);

COMMENT ON TABLE spend_events IS
  'Audit log of G$ spent on platform mechanisms. Per-category for analytics on circulation patterns.';


ALTER TABLE user_points        ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_events       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_points readable"        ON user_points        FOR SELECT USING (true);
CREATE POLICY "point_transactions readable" ON point_transactions FOR SELECT USING (true);
CREATE POLICY "point_claims readable"       ON point_claims       FOR SELECT USING (true);
CREATE POLICY "spend_events readable"       ON spend_events       FOR SELECT USING (true);

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Create a zero-balance user_points row for every existing auth user. Avoids
-- ON CONFLICT branches in the award API on first earn for these users.

INSERT INTO user_points (user_id, balance, lifetime_earned, lifetime_claimed)
SELECT id, 0, 0, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;