-- ============================================================
-- Referral system: codes + attribution
-- ============================================================

-- 1. Add columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES public.users(id);

-- 2. Function to generate a short unique referral code
--    Uses 8 uppercase alphanumeric chars derived from a random seed.
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text;
  i int;
  attempt int := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Ensure uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = result) THEN
      RETURN result;
    END IF;

    attempt := attempt + 1;
    IF attempt > 50 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 50 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3. Backfill: give every existing user without a code a fresh one
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users WHERE referral_code IS NULL LOOP
    UPDATE public.users
    SET referral_code = generate_referral_code()
    WHERE id = u.id;
  END LOOP;
END$$;

-- 4. Trigger: auto-generate a code for any new user on insert
CREATE OR REPLACE FUNCTION set_referral_code_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_referral_code ON public.users;
CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code_on_insert();

-- 5. Index for fast referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referred_by
  ON public.users(referred_by_user_id);