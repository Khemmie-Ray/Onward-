-- Migration: add "pending" to game_sessions.status enum


alter table game_sessions
  drop constraint if exists game_sessions_status_check;

alter table game_sessions
  add constraint game_sessions_status_check
  check (status in ('pending', 'active', 'submitted', 'expired'));

alter table game_sessions
  add column if not exists last_heartbeat_at timestamptz;

create index if not exists idx_game_sessions_pending_lookup
  on game_sessions(user_id, mode, status, started_at)
  where status = 'pending';


create index if not exists idx_game_sessions_stale_active
  on game_sessions(user_id, status, last_heartbeat_at)
  where status = 'active';