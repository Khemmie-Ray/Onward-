-- ============================================================
-- Whack-a-Scam play tables
-- ============================================================

CREATE TABLE IF NOT EXISTS scam_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family TEXT NOT NULL,
  family_label TEXT NOT NULL,
  family_description TEXT NOT NULL,
  is_scam BOOLEAN NOT NULL,
  is_exemplar BOOLEAN NOT NULL DEFAULT false,
  difficulty SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  kind TEXT NOT NULL CHECK (kind IN ('dm', 'tweet', 'wallet_popup', 'page')),
  content JSONB NOT NULL,
  teaching TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scam_patterns_family ON scam_patterns(family);
CREATE INDEX IF NOT EXISTS idx_scam_patterns_is_scam ON scam_patterns(is_scam);
CREATE INDEX IF NOT EXISTS idx_scam_patterns_exemplar
  ON scam_patterns(family) WHERE is_exemplar = true;

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  featured_family TEXT NOT NULL,
  items JSONB NOT NULL,
  popup_duration_ms INT NOT NULL DEFAULT 4000,
  total_seconds INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INT,
  correct_whacks INT,
  wrong_whacks INT,
  missed_scams INT,
  passed BOOLEAN,
  reward_g_amount INT DEFAULT 0,
  reward_tx_hash TEXT,
  level_badge_tx_hash TEXT,
  level_before INT,
  level_after INT
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed
  ON game_sessions(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS streak_days (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  rounds_played INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_streak_days_user ON streak_days(user_id);

ALTER TABLE scam_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scam_patterns readable" ON scam_patterns FOR SELECT USING (true);
CREATE POLICY "game_sessions readable" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "streak_days readable" ON streak_days FOR SELECT USING (true);