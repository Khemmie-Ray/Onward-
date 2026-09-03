CREATE TABLE IF NOT EXISTS public.contest_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,        
  seq          int  NOT NULL,              
  type         text NOT NULL,               
  title        text NOT NULL,
  subtitle     text,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'scheduled', 

  settings     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_config_window
  ON public.contest_config (starts_at, ends_at);

ALTER TABLE public.contest_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contest_config readable" ON public.contest_config;
CREATE POLICY "contest_config readable" ON public.contest_config
  FOR SELECT USING (true);

-- ── Seed: contests 1–3 defined, 4–6 as placeholders to fill in later ──

INSERT INTO public.contest_config (slug, seq, type, title, subtitle, starts_at, ends_at, status, settings)
VALUES
  -- Contest 1 & 2 were play-based. Dates are historical; adjust if needed.
  ('play-2026-08-03', 1, 'play',
   'Whack-a-Scam launch contest', 'Play premium rounds to climb the board',
   '2026-08-03T00:00:00Z', '2026-08-10T23:59:59Z', 'closed', '{}'::jsonb),

  ('play-2026-08-17', 2, 'play',
   'Whack-a-Scam contest', 'Play premium rounds to climb the board',
   '2026-08-17T00:00:00Z', '2026-08-23T23:59:59Z', 'closed', '{}'::jsonb),

  -- Contest 3: the referral contest.
  ('referral-2026-08-30', 3, 'referral',
   'Bring a friend to crypto safety',
   'Invite people new to GoodDollar and earn for every one who stays',
   '2026-08-30T00:00:00Z', '2026-09-06T23:59:59Z', 'scheduled',
   jsonb_build_object(
     'reward_per_referral', 5000,
     'max_referrals', 5,
     'streak_days_required', 3
   )),

  -- Contests 4–6: placeholders. Fill in type/title/dates/settings when known.
  -- status 'draft' keeps them from ever being picked as active.
  ('contest-4-placeholder', 4, 'play',
   'Contest 4 (to be announced)', NULL,
   '2099-01-01T00:00:00Z', '2099-01-07T23:59:59Z', 'draft', '{}'::jsonb),

  ('contest-5-placeholder', 5, 'play',
   'Contest 5 (to be announced)', NULL,
   '2099-01-01T00:00:00Z', '2099-01-07T23:59:59Z', 'draft', '{}'::jsonb),

  ('contest-6-placeholder', 6, 'play',
   'Contest 6 (to be announced)', NULL,
   '2099-01-01T00:00:00Z', '2099-01-07T23:59:59Z', 'draft', '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;