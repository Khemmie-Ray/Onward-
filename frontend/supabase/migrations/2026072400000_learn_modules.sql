-- ── Enable RLS everywhere ───────────────────────────────────────────────────
ALTER TABLE public.learn_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.learn_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  description  text,
  order_index  int  NOT NULL,                       -- display order on the Learn screen
  status       text NOT NULL DEFAULT 'available',   -- 'available' | 'coming_soon'
  icon         text,                                -- optional icon key for the track card
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learn_tracks_status_check
    CHECK (status IN ('available', 'coming_soon'))
);

CREATE UNIQUE INDEX IF NOT EXISTS learn_tracks_order_idx
  ON public.learn_tracks (order_index);


CREATE TABLE IF NOT EXISTS public.learn_modules (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id           uuid NOT NULL REFERENCES public.learn_tracks(id) ON DELETE CASCADE,
  slug               text UNIQUE NOT NULL,          
  title              text NOT NULL,
  description        text,
  order_in_track     int  NOT NULL,                
  estimated_minutes  int  NOT NULL DEFAULT 7,
  points_reward      int  NOT NULL DEFAULT 100,     
  first_card_tease   text,
  what_you_will_learn text[] NOT NULL DEFAULT '{}',
  status             text NOT NULL DEFAULT 'live',  
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learn_modules_status_check
    CHECK (status IN ('draft', 'live')),
 
  CONSTRAINT learn_modules_track_order_unique
    UNIQUE (track_id, order_in_track)
);

CREATE INDEX IF NOT EXISTS learn_modules_track_idx
  ON public.learn_modules (track_id, order_in_track);

CREATE TABLE IF NOT EXISTS public.learn_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    uuid NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  order_index  int  NOT NULL,                       
  type         text NOT NULL,                       
  content      jsonb NOT NULL,
  CONSTRAINT learn_cards_type_check
    CHECK (type IN ('flip', 'choice', 'spotter')),
  CONSTRAINT learn_cards_module_order_unique
    UNIQUE (module_id, order_index)
);

CREATE INDEX IF NOT EXISTS learn_cards_module_idx
  ON public.learn_cards (module_id, order_index);

CREATE TABLE IF NOT EXISTS public.learn_progress (
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id      uuid NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  current_card   int  NOT NULL DEFAULT 0,
  started_at     timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);


CREATE TABLE IF NOT EXISTS public.learn_completions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id      uuid NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  completed_at   timestamptz NOT NULL DEFAULT now(),
  quiz_score     int,                                
  points_awarded int  NOT NULL DEFAULT 0,            
  badge_token_id text,                               
  badge_tx_hash  text,                               

  CONSTRAINT learn_completions_user_module_unique
    UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS learn_completions_user_idx
  ON public.learn_completions (user_id);

DROP TRIGGER IF EXISTS learn_tracks_updated ON public.learn_tracks;
CREATE TRIGGER learn_tracks_updated
  BEFORE UPDATE ON public.learn_tracks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS learn_modules_updated ON public.learn_modules;
CREATE TRIGGER learn_modules_updated
  BEFORE UPDATE ON public.learn_modules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();