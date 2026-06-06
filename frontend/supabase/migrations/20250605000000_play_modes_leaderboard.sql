-- ============================================================
-- Play mode (free/premium) + indexes for daily caps + leaderboard
-- ============================================================

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'free'
    CHECK (mode IN ('free', 'premium'));

-- For daily cap enforcement (find today's sessions by user + mode)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_mode_started
  ON game_sessions(user_id, mode, started_at DESC);

-- For leaderboard ranking (correct_whacks in last 7 days)
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed_correct
  ON game_sessions(completed_at DESC, correct_whacks DESC)
  WHERE status = 'submitted' AND passed = true;

-- Track which mode each leaderboard player primarily used in the period
-- (computed on the fly from sessions, but indexed for speed)
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed_user
  ON game_sessions(user_id, completed_at DESC)
  WHERE status = 'submitted';

-- Weekly bonus payout audit trail
CREATE TABLE IF NOT EXISTS leaderboard_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_g INT NOT NULL,
  tx_hash TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_payouts_period
  ON leaderboard_payouts(period_start DESC);

ALTER TABLE leaderboard_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_payouts readable" ON leaderboard_payouts FOR SELECT USING (true);