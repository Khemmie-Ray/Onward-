
ALTER TABLE public.point_claims
  ADD COLUMN IF NOT EXISTS claim_id text UNIQUE;