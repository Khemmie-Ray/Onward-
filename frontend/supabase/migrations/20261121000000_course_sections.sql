
-- ── course_modules ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_modules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug             text UNIQUE NOT NULL,
  title            text NOT NULL,
  description      text,
  order_index      int  NOT NULL,
  status           text NOT NULL DEFAULT 'available',
  icon             text,
  legacy_track_id  uuid UNIQUE REFERENCES public.learn_tracks(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_modules_status_check
    CHECK (status IN ('available', 'coming_soon', 'draft'))
);

CREATE INDEX IF NOT EXISTS course_modules_course_idx
  ON public.course_modules (course_id, order_index);

-- ── course_sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_sections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id           uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  slug                text UNIQUE NOT NULL,
  title               text NOT NULL,
  description         text,
  order_in_module     int  NOT NULL,
  estimated_minutes   int  NOT NULL DEFAULT 6,
  points_reward       int  NOT NULL DEFAULT 100,
  first_card_tease    text,
  what_you_will_learn text[] NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'live',
  legacy_module_id    uuid UNIQUE REFERENCES public.learn_modules(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_sections_status_check
    CHECK (status IN ('draft', 'live')),
  CONSTRAINT course_sections_module_order_unique
    UNIQUE (module_id, order_in_module)
);

CREATE INDEX IF NOT EXISTS course_sections_module_idx
  ON public.course_sections (module_id, order_in_module);

-- ── section_versions ────────────────────────────────────────────────────────
-- items is the section's exercises in order, in the shape checked by
-- lib/learn/content-schema.ts (Item). Only one version per section can be
-- published at a time; older ones are kept as retired.
CREATE TABLE IF NOT EXISTS public.section_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  version       int  NOT NULL,
  status        text NOT NULL DEFAULT 'draft',
  items         jsonb NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  CONSTRAINT section_versions_status_check
    CHECK (status IN ('draft', 'published', 'retired')),
  CONSTRAINT section_versions_items_is_array
    CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT section_versions_section_version_unique
    UNIQUE (section_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS section_versions_one_published_idx
  ON public.section_versions (section_id)
  WHERE status = 'published';

-- ── section_completions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.section_completions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_id            uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  version_id            uuid REFERENCES public.section_versions(id) ON DELETE SET NULL,
  completed_at          timestamptz NOT NULL DEFAULT now(),
  score                 int,
  points_awarded        int  NOT NULL DEFAULT 0,
  badge_token_id        text,
  badge_tx_hash         text,
  source                text NOT NULL DEFAULT 'live',
  legacy_completion_id  uuid UNIQUE REFERENCES public.learn_completions(id) ON DELETE SET NULL,
  CONSTRAINT section_completions_source_check
    CHECK (source IN ('live', 'copied')),
  CONSTRAINT section_completions_user_section_unique
    UNIQUE (user_id, section_id)
);

CREATE INDEX IF NOT EXISTS section_completions_user_idx
  ON public.section_completions (user_id, completed_at);

-- ── section_progress ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.section_progress (
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_id      uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  current_card    int  NOT NULL DEFAULT 0,
  started_at      timestamptz NOT NULL DEFAULT now(),
  last_active_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_id)
);

-- ── Row level security (the app uses the service-role client) ───────────────
ALTER TABLE public.course_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_progress    ENABLE ROW LEVEL SECURITY;

-- ── updated_at triggers ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS course_modules_updated ON public.course_modules;
CREATE TRIGGER course_modules_updated
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS course_sections_updated ON public.course_sections;
CREATE TRIGGER course_sections_updated
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ── Copy a course's history from the old tables ─────────────────────────────
-- Copies, never moves: the old rows stay exactly as they are. Safe to run as
-- often as you like; each run only adds what isn't there yet, so run it again
-- right before switching over to pick up anything learned since.
-- No points are paid and no badges are minted by copying.
CREATE OR REPLACE FUNCTION public.copy_course_learn_history(p_course_slug text)
RETURNS TABLE (modules_added int, sections_added int, completions_added int, progress_added int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM public.courses WHERE slug = p_course_slug;
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No course with slug %', p_course_slug;
  END IF;

  -- Modules, from the course's tracks. Slugs are lowercased on the way in.
  WITH ins AS (
    INSERT INTO public.course_modules
      (course_id, slug, title, description, order_index, status, icon, legacy_track_id)
    SELECT v_course_id, lower(t.slug), t.title, t.description, t.order_index, t.status, t.icon, t.id
    FROM public.learn_tracks t
    WHERE t.course_id = v_course_id
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO modules_added FROM ins;

  -- Sections, from the modules of those tracks. Same slugs as before.
  WITH ins AS (
    INSERT INTO public.course_sections
      (module_id, slug, title, description, order_in_module, estimated_minutes,
       points_reward, first_card_tease, what_you_will_learn, status, legacy_module_id)
    SELECT cm.id, m.slug, m.title, m.description, m.order_in_track, m.estimated_minutes,
           m.points_reward, m.first_card_tease, m.what_you_will_learn, m.status, m.id
    FROM public.learn_modules m
    JOIN public.course_modules cm ON cm.legacy_track_id = m.track_id
    WHERE cm.course_id = v_course_id
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO sections_added FROM ins;

  -- Completions, keeping the original date, score, points and badge.
  WITH ins AS (
    INSERT INTO public.section_completions
      (user_id, section_id, completed_at, score, points_awarded,
       badge_token_id, badge_tx_hash, source, legacy_completion_id)
    SELECT lc.user_id, cs.id, lc.completed_at, lc.quiz_score, lc.points_awarded,
           lc.badge_token_id, lc.badge_tx_hash, 'copied', lc.id
    FROM public.learn_completions lc
    JOIN public.course_sections cs ON cs.legacy_module_id = lc.module_id
    JOIN public.course_modules cm ON cm.id = cs.module_id
    WHERE cm.course_id = v_course_id
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO completions_added FROM ins;

  -- Where learners are inside sections they haven't finished.
  WITH ins AS (
    INSERT INTO public.section_progress
      (user_id, section_id, current_card, started_at, last_active_at)
    SELECT lp.user_id, cs.id, lp.current_card, lp.started_at, lp.last_active_at
    FROM public.learn_progress lp
    JOIN public.course_sections cs ON cs.legacy_module_id = lp.module_id
    JOIN public.course_modules cm ON cm.id = cs.module_id
    WHERE cm.course_id = v_course_id
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO progress_added FROM ins;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.copy_course_learn_history(text) FROM public, anon, authenticated;

-- ── Check the copy: one row per learner where old and new disagree ─────────
-- Empty result = every old completion has a matching new one.
CREATE OR REPLACE FUNCTION public.compare_course_learn_history(p_course_slug text)
RETURNS TABLE (user_id uuid, old_completions int, new_completions int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH course AS (SELECT id FROM public.courses WHERE slug = p_course_slug),
  old AS (
    SELECT lc.user_id, count(*)::int AS n
    FROM public.learn_completions lc
    JOIN public.learn_modules m ON m.id = lc.module_id
    JOIN public.learn_tracks t ON t.id = m.track_id
    WHERE t.course_id = (SELECT id FROM course)
    GROUP BY lc.user_id
  ),
  new AS (
    SELECT sc.user_id, count(*)::int AS n
    FROM public.section_completions sc
    JOIN public.course_sections cs ON cs.id = sc.section_id
    JOIN public.course_modules cm ON cm.id = cs.module_id
    WHERE cm.course_id = (SELECT id FROM course)
    GROUP BY sc.user_id
  )
  SELECT coalesce(old.user_id, new.user_id), coalesce(old.n, 0), coalesce(new.n, 0)
  FROM old FULL JOIN new ON new.user_id = old.user_id
  WHERE coalesce(old.n, 0) <> coalesce(new.n, 0);
$$;

REVOKE ALL ON FUNCTION public.compare_course_learn_history(text) FROM public, anon, authenticated;

-- First copy of the Web3 course.
SELECT * FROM public.copy_course_learn_history('web3');