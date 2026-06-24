-- ─── user_points ─────────────────────────────────────────────────────────────

ALTER TABLE public.user_points
  DROP CONSTRAINT IF EXISTS user_points_user_id_fkey;

ALTER TABLE public.user_points
  ADD CONSTRAINT user_points_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── point_transactions ──────────────────────────────────────────────────────

ALTER TABLE public.point_transactions
  DROP CONSTRAINT IF EXISTS point_transactions_user_id_fkey;

ALTER TABLE public.point_transactions
  ADD CONSTRAINT point_transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── point_claims ────────────────────────────────────────────────────────────

ALTER TABLE public.point_claims
  DROP CONSTRAINT IF EXISTS point_claims_user_id_fkey;

ALTER TABLE public.point_claims
  ADD CONSTRAINT point_claims_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── spend_events ────────────────────────────────────────────────────────────

ALTER TABLE public.spend_events
  DROP CONSTRAINT IF EXISTS spend_events_user_id_fkey;

ALTER TABLE public.spend_events
  ADD CONSTRAINT spend_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─── Re-run backfill against public.users ────────────────────────────────────

INSERT INTO public.user_points (user_id, balance, lifetime_earned, lifetime_claimed)
SELECT id, 0, 0, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;