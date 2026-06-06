-- ============================================================
-- Username uniqueness + avatar selection
-- ============================================================

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
