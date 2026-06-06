-- ============================================================
-- Username uniqueness + avatar selection
-- ============================================================
--
-- Adds:
--   1. avatar_id column to users (which of the 12 avatars they picked)
--   2. display_name_normalized — lowercased version for unique lookups
--   3. UNIQUE constraint on display_name_normalized
--
-- We don't unique-constrain display_name directly because we want case-insensitive
-- collision detection ("Kemi" and "kemi" should conflict). Storing a normalized
-- column and uniquing that is the cleanest way to do this in Postgres.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_id TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name_normalized TEXT
    GENERATED ALWAYS AS (lower(display_name)) STORED;

-- Unique on the normalized column (NULL values are allowed and don't conflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_display_name_normalized_unique
  ON users(display_name_normalized)
  WHERE display_name_normalized IS NOT NULL;

-- Fast lookups for availability checks
CREATE INDEX IF NOT EXISTS idx_users_display_name_lookup
  ON users(display_name_normalized);
