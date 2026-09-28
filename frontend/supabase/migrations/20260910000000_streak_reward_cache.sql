CREATE TABLE IF NOT EXISTS public.streak_reward_cache (
  milestone_day integer PRIMARY KEY,
  amount_g      numeric NOT NULL,
  refreshed_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.streak_reward_cache (milestone_day, amount_g)
VALUES (7, 0), (14, 0), (30, 0), (60, 0)
ON CONFLICT (milestone_day) DO NOTHING;