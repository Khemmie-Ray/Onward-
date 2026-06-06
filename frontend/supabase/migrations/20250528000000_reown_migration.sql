
ALTER TABLE users
DROP COLUMN IF EXISTS privy_did;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_wallet_address_lower_key'
  ) THEN
    CREATE UNIQUE INDEX users_wallet_address_lower_key
      ON users (LOWER(wallet_address));
  END IF;
END $$;

UPDATE users
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);
