-- from migration.sql
CREATE TABLE IF NOT EXISTS public.leaderboard_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL UNIQUE,
  period_end date NOT NULL,
  week_slug text NOT NULL,
  winners_count integer NOT NULL DEFAULT 0,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leaderboard_periods_period_start_idx
  ON public.leaderboard_periods (period_start DESC);