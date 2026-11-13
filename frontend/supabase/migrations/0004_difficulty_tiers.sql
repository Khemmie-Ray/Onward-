
create table if not exists difficulty_tiers (
  key                text primary key,

  label              text not null,
  rank               int  not null,             

  total_seconds      int  not null,
  popup_duration_ms  int  not null,              
  base_spawn_delay   int  not null,              
  spawn_jitter       int  not null,              
  board_size         int  not null,             
  list_size          int  not null,              
  scam_ratio         numeric(3,2) not null,     

  min_pattern_difficulty int not null default 1,
  max_pattern_difficulty int not null default 5,

  min_precision      numeric(3,2),
  min_correct        int,
  min_recall         numeric(3,2),

  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint difficulty_band_valid
    check (min_pattern_difficulty between 1 and 5
       and max_pattern_difficulty between 1 and 5
       and min_pattern_difficulty <= max_pattern_difficulty),
  constraint scam_ratio_valid
    check (scam_ratio > 0 and scam_ratio < 1)
);

alter table game_sessions
  add column if not exists difficulty text not null default 'easy';

insert into difficulty_tiers
  (key, label, rank, total_seconds, popup_duration_ms, base_spawn_delay,
   spawn_jitter, board_size, list_size, scam_ratio,
   min_pattern_difficulty, max_pattern_difficulty,
   min_precision, min_correct, min_recall)
values
  ('easy', 'Easy', 1,
   60, 1550, 450, 300, 6, 100, 0.40,
   1, 2,
   null, null, null),

  ('hard', 'Hard', 2,
   60, 1150, 340, 240, 6, 110, 0.45,
   2, 4,
   0.65, null, 0.60),

  ('superhard', 'Superhard', 3,
   60, 900, 260, 200, 6, 120, 0.50,
   3, 5,
   0.70, null, 0.70)
on conflict (key) do update set
  label = excluded.label,
  rank = excluded.rank,
  total_seconds = excluded.total_seconds,
  popup_duration_ms = excluded.popup_duration_ms,
  base_spawn_delay = excluded.base_spawn_delay,
  spawn_jitter = excluded.spawn_jitter,
  board_size = excluded.board_size,
  list_size = excluded.list_size,
  scam_ratio = excluded.scam_ratio,
  min_pattern_difficulty = excluded.min_pattern_difficulty,
  max_pattern_difficulty = excluded.max_pattern_difficulty,
  min_precision = excluded.min_precision,
  min_correct = excluded.min_correct,
  min_recall = excluded.min_recall,
  updated_at = now();