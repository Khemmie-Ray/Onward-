

alter table users
  add column if not exists is_test boolean not null default false;

-- Optional: index if you expect many users; the leaderboard filter reads this.
create index if not exists idx_users_is_test on users (is_test) where is_test = true;