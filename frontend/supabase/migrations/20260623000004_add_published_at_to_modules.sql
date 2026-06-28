ALTER TABLE public.modules 
  ADD COLUMN published_at timestamptz NOT NULL DEFAULT now();