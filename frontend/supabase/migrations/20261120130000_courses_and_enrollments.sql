
CREATE TABLE IF NOT EXISTS public.courses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  description  text,
  image_url    text,                                -- card art, e.g. /images/course-web3-art.png
  order_index  int  NOT NULL,                       -- display order on the Courses page
  status       text NOT NULL DEFAULT 'available',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_status_check
    CHECK (status IN ('available', 'coming_soon'))
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

INSERT INTO public.courses (slug, title, description, image_url, order_index, status)
VALUES (
  'web3',
  'Web3 & Blockchain',
  'Wallets, tokens, networks and how to stay safe while you use them.',
  '/images/course-web3-art.png',
  1,
  'available'
)
ON CONFLICT (slug) DO NOTHING;

-- Tracks belong to a course. Nullable so the existing track seed script keeps
-- working; every track that exists today is assigned to Web3 below.
ALTER TABLE public.learn_tracks
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS learn_tracks_course_idx
  ON public.learn_tracks (course_id, order_index);

UPDATE public.learn_tracks
SET course_id = (SELECT id FROM public.courses WHERE slug = 'web3')
WHERE course_id IS NULL;

-- Who is enrolled in which course. One row per user per course.
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  source       text NOT NULL DEFAULT 'self',
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT course_enrollments_source_check
    CHECK (source IN ('self', 'backfill'))
);

CREATE INDEX IF NOT EXISTS course_enrollments_course_idx
  ON public.course_enrollments (course_id, enrolled_at);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Enrol everyone who already learned: anyone who started or finished a lesson
-- in a course. enrolled_at is their first lesson activity in that course.
-- Safe to run again; existing enrolments are left alone.
CREATE OR REPLACE FUNCTION public.backfill_course_enrollments()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH activity AS (
    SELECT lp.user_id, t.course_id, lp.started_at AS at
    FROM public.learn_progress lp
    JOIN public.learn_modules m ON m.id = lp.module_id
    JOIN public.learn_tracks  t ON t.id = m.track_id
    WHERE t.course_id IS NOT NULL
    UNION ALL
    SELECT lc.user_id, t.course_id, lc.completed_at AS at
    FROM public.learn_completions lc
    JOIN public.learn_modules m ON m.id = lc.module_id
    JOIN public.learn_tracks  t ON t.id = m.track_id
    WHERE t.course_id IS NOT NULL
  ),
  inserted AS (
    INSERT INTO public.course_enrollments (user_id, course_id, enrolled_at, source)
    SELECT user_id, course_id, min(at), 'backfill'
    FROM activity
    GROUP BY user_id, course_id
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int FROM inserted;
$$;

REVOKE ALL ON FUNCTION public.backfill_course_enrollments() FROM public, anon, authenticated;

SELECT public.backfill_course_enrollments() AS learners_enrolled;