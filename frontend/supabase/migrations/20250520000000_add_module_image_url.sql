
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Helpful for the seed script which uses upsert on slug
COMMENT ON COLUMN modules.image_url IS
  'Pinata gateway URL (or any HTTPS image URL) for the soulbound badge art. '
  'Used by /profile profile page and /modules library page.';