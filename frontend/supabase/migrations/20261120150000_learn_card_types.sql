
ALTER TABLE public.learn_cards
  DROP CONSTRAINT IF EXISTS learn_cards_type_check;

ALTER TABLE public.learn_cards
  ADD CONSTRAINT learn_cards_type_check CHECK (type IN (
    -- current lessons (retired for new content)
    'flip',
    'visual',
    'spotter',
    -- shared: old lessons store options as text, new ones as objects
    'choice',
    -- new formats
    'concept',
    'match_pairs',
    'sort_buckets',
    'order_steps',
    'fill_gap',
    'spot_scam',
    'recap'
  ));