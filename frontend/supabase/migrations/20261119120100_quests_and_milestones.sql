-- Daily quests, monthly quests and one-time milestones.
--
-- How rewards are paid: none of these tables hold points. Every reward is a
-- row in point_transactions written through award_points(), and the existing
-- UNIQUE (user_id, source, reference_id) makes each one pay exactly once:
--
--   daily quest full clear  source 'daily_quest'       ref 'daily_quest:YYYY-MM-DD'
--   monthly quest           source 'monthly_quest'     ref 'monthly_quest:YYYY-MM'
--   milestone               source 'milestone'         ref 'milestone:<milestone id>'
--   quality referral stage  source 'referral_quality'  ref 'referral_quality:<referred user id>:<stage>'
--
-- Quality referrals need no table: stages and the 25,000 lifetime pool are
-- derived from point_transactions.
--
-- Streak milestones are NOT here. They stay on-chain (OnwardClaims.streakClaim)
-- with streak_reward_claims as the off-chain record.
--
-- Activity tables (learn_completions, game_sessions, point_transactions) stay
-- the source of truth. The quest tables only record outcomes.

-- ─── Daily quest pool ────────────────────────────────────────────────────────
-- Add quests by inserting rows. Retire a quest with active = false; never
-- delete one that users have been assigned. A brand-new kind of metric needs
-- code in the evaluator first, then a change to the named CHECK below.

CREATE TABLE IF NOT EXISTS public.quest_definitions (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  tier        text NOT NULL CHECK (tier IN ('easy', 'medium', 'stretch')),
  metric      text NOT NULL
              CONSTRAINT quest_definitions_metric_check CHECK (metric IN (
                'modules_completed',  -- learn_completions today
                'rounds_played',      -- game_sessions submitted today
                'rounds_passed',      -- game_sessions passed today
                'correct_whacks',     -- sum of game_sessions.correct_whacks today
                'activity_points'     -- points from lessons + rounds today (excludes quest bonuses)
              )),
  target      integer NOT NULL CHECK (target > 0),
  params      jsonb   NOT NULL DEFAULT '{}'::jsonb,  -- optional filters, e.g. {"mode": "free"}
  weight      integer NOT NULL DEFAULT 1 CHECK (weight > 0),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Each user's three quests for the day ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_daily_quests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quest_day     date NOT NULL,                       -- UTC day, same boundary as streaks
  tier          text NOT NULL CHECK (tier IN ('easy', 'medium', 'stretch')),
  quest_id      text NOT NULL REFERENCES public.quest_definitions(id),
  target        integer NOT NULL CHECK (target > 0), -- copied at assignment
  progress      integer NOT NULL DEFAULT 0,          -- display cache only
  completed_at  timestamptz,                         -- set once; monthly counts these
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_daily_quests_one_per_tier UNIQUE (user_id, quest_day, tier)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_quests_user_day
  ON public.user_daily_quests (user_id, quest_day);

CREATE INDEX IF NOT EXISTS idx_user_daily_quests_completed
  ON public.user_daily_quests (user_id, completed_at)
  WHERE completed_at IS NOT NULL;

-- ─── Monthly quest: one row per month ────────────────────────────────────────
-- Progress is not stored: it is the count of completed daily quests that month.

CREATE TABLE IF NOT EXISTS public.monthly_quests (
  month                date PRIMARY KEY CHECK (extract(day FROM month) = 1),
  title                text NOT NULL,
  description          text,
  target_quest_points  integer NOT NULL DEFAULT 50  CHECK (target_quest_points > 0),
  reward_points        integer NOT NULL DEFAULT 250 CHECK (reward_points >= 0),
  badge_slug           text,                         -- on-chain badge to mint
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_monthly_quests (
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month          date NOT NULL REFERENCES public.monthly_quests(month),
  completed_at   timestamptz NOT NULL DEFAULT now(),
  badge_tx_hash  text,
  PRIMARY KEY (user_id, month)
);

-- ─── One-time milestones ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.milestone_definitions (
  id             text PRIMARY KEY,
  category       text NOT NULL
                 CHECK (category IN ('getting_started', 'learning', 'quests', 'seasonal')),
  title          text NOT NULL,
  description    text,
  metric         text NOT NULL
                 CONSTRAINT milestone_definitions_metric_check CHECK (metric IN (
                   'verified',                  -- GoodID verified on Onward
                   'modules_completed',         -- lifetime learn_completions
                   'track_completed',           -- every published lesson in a track ({} = all)
                   'full_clear_days',           -- days with all 3 daily quests done
                   'monthly_quests_completed',  -- rows in user_monthly_quests
                   'season_participant'         -- active during a season
                 )),
  threshold      integer NOT NULL DEFAULT 1 CHECK (threshold > 0),
  params         jsonb   NOT NULL DEFAULT '{}'::jsonb,
  reward_points  integer NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  badge_slug     text,
  sort_order     integer NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- The primary key is the one-time lock.
CREATE TABLE IF NOT EXISTS public.user_milestones (
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_id    text NOT NULL REFERENCES public.milestone_definitions(id),
  achieved_at     timestamptz NOT NULL DEFAULT now(),
  points_awarded  integer NOT NULL DEFAULT 0,  -- what was actually paid
  badge_tx_hash   text,
  PRIMARY KEY (user_id, milestone_id)
);

-- ─── Row level security ──────────────────────────────────────────────────────
-- Server-only, like the rest of the schema: the app reads and writes through
-- the service-role client, so no policies are added.

ALTER TABLE public.quest_definitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_quests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_monthly_quests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones       ENABLE ROW LEVEL SECURITY;

-- ─── Seed: starting quest pool ───────────────────────────────────────────────

INSERT INTO public.quest_definitions (id, title, tier, metric, target) VALUES
  ('lesson_1',   'Finish 1 lesson',  'easy',    'modules_completed', 1),
  ('round_1',    'Play 1 round',     'easy',    'rounds_played',     1),
  ('points_100', 'Earn 100 points',  'easy',    'activity_points',   100),
  ('lesson_2',   'Finish 2 lessons', 'medium',  'modules_completed', 2),
  ('pass_2',     'Pass 2 rounds',    'medium',  'rounds_passed',     2),
  ('whack_60',   'Whack 60 scams',   'medium',  'correct_whacks',    60),
  ('lesson_3',   'Finish 3 lessons', 'stretch', 'modules_completed', 3),
  ('whack_100',  'Whack 100 scams',  'stretch', 'correct_whacks',    100),
  ('points_300', 'Earn 300 points',  'stretch', 'activity_points',   300)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: milestones ────────────────────────────────────────────────────────

INSERT INTO public.milestone_definitions
  (id, category, title, metric, threshold, params, reward_points, badge_slug, sort_order)
VALUES
  ('verified',          'getting_started', 'Verified human',     'verified',                 1,  '{}',             300, NULL,        10),
  ('modules_1',         'learning',        'Curious Mind',       'modules_completed',        1,  '{}',             50,  NULL,        20),
  ('modules_10',        'learning',        'Fast Learner',       'modules_completed',        10, '{}',             50,  NULL,        21),
  ('modules_25',        'learning',        'Scholar',            'modules_completed',        25, '{}',             100, NULL,        22),
  ('modules_50',        'learning',        'Onward Master',      'modules_completed',        50, '{}',             200, NULL,        23),
  ('track_web3',        'learning',        'Web3 & Blockchain',  'track_completed',          1,  '{}',             500, 'course-web3', 24),
  ('quest_first_clear', 'quests',          'Full house',         'full_clear_days',          1,  '{}',             30,  NULL,        30),
  ('quest_clear_7',     'quests',          'Seven strong',       'full_clear_days',          7,  '{}',             75,  NULL,        31),
  ('monthly_1',         'quests',          'First monthly',      'monthly_quests_completed', 1,  '{}',             100, NULL,        32),
  ('monthly_3',         'quests',          'Three months in',    'monthly_quests_completed', 3,  '{}',             250, NULL,        33),
  ('monthly_6',         'quests',          'Half a year',        'monthly_quests_completed', 6,  '{}',             500, NULL,        34),
  ('season_5',          'seasonal',        'Season 5',           'season_participant',       1,  '{"season": 5}',  0,   'season-5',  40)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: first monthly quest (edit the theme before it starts) ─────────────

INSERT INTO public.monthly_quests (month, title, description, target_quest_points, reward_points, badge_slug)
VALUES (
  '2026-12-01',
  'Scam-proof December',
  'Clear your daily quests and sharpen your scam radar.',
  50,
  250,
  'monthly-2026-12'
)
ON CONFLICT (month) DO NOTHING;