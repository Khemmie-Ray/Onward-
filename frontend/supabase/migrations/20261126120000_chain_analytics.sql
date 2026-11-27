-- frontend/supabase/migrations/20261126120000_chain_analytics.sql
-- On-chain analytics: raw chain data for Onward's three contracts, kept in
-- sync by scripts/chain-sync.ts and /api/cron/chain-sync, plus the three
-- GoodBuilders metrics rebuilt from GoodDollar's Dune template so the numbers
-- follow the same definitions.
--
-- All addresses are stored lowercase.

-- Transactions sent to (or from) Onward's contracts, including failed ones.
CREATE TABLE IF NOT EXISTS public.chain_txs (
  hash          text PRIMARY KEY,
  block_number  bigint NOT NULL,
  block_time    timestamptz NOT NULL,
  from_address  text NOT NULL,
  to_address    text,
  success       boolean NOT NULL
);
CREATE INDEX IF NOT EXISTS chain_txs_block_time_idx ON public.chain_txs (block_time);
CREATE INDEX IF NOT EXISTS chain_txs_from_idx ON public.chain_txs (from_address);

-- G$ Transfer events where one side is an Onward contract.
CREATE TABLE IF NOT EXISTS public.chain_gd_transfers (
  tx_hash       text NOT NULL,
  log_index     integer NOT NULL,
  block_number  bigint NOT NULL,
  block_time    timestamptz NOT NULL,
  from_address  text NOT NULL,
  to_address    text NOT NULL,
  value         numeric NOT NULL, -- raw units, 18 decimals
  PRIMARY KEY (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS chain_gd_transfers_block_time_idx ON public.chain_gd_transfers (block_time);

-- GoodDollar identity WhitelistedAdded events, fetched for wallets that
-- interacted with Onward.
CREATE TABLE IF NOT EXISTS public.chain_whitelist_events (
  tx_hash     text NOT NULL,
  log_index   integer NOT NULL,
  address     text NOT NULL,
  block_time  timestamptz NOT NULL,
  PRIMARY KEY (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS chain_whitelist_events_address_idx ON public.chain_whitelist_events (address);

-- Per-address facts: whether it is a contract (excluded from user counts,
-- like Dune's creation_traces check) and when its whitelist was last checked.
CREATE TABLE IF NOT EXISTS public.chain_addresses (
  address               text PRIMARY KEY,
  is_contract           boolean,
  whitelist_checked_at  timestamptz
);

-- Sync progress per source.
CREATE TABLE IF NOT EXISTS public.chain_sync_state (
  key         text PRIMARY KEY,
  last_block  bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chain_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_gd_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_whitelist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_sync_state ENABLE ROW LEVEL SECURITY;

-- Onward's contracts: OnwardBadges, OnwardClaims, WhackStake.
CREATE OR REPLACE FUNCTION public.analytics_project_contracts()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    '0x5b6c4cc464fb14ed2fa78090924186d5f057875b',
    '0xf66cfe1d3bf53a4cc9ced5e9b39945e3769a5c87',
    '0x09c44c654653187b480abddfdb48aba11fb38765'
  ]::text[];
$$;


-- 1. Daily transactions and G$ volume (template: transactions_table).
--    First row (block_date NULL) is the season total.
CREATE OR REPLACE FUNCTION public.analytics_daily_transactions(p_start date)
RETURNS TABLE (
  block_date          date,
  direct_tx_count     bigint,
  gd_token_transfers  bigint,
  gd_volume           numeric,
  gd_net_flow         numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH pc AS (
    SELECT unnest(public.analytics_project_contracts()) AS address
  ),
  season AS (
    SELECT (p_start::timestamp AT TIME ZONE 'UTC') AS start_at
  ),
  daily_txs AS (
    SELECT (t.block_time AT TIME ZONE 'UTC')::date AS block_date,
           count(*) AS direct_tx_count
    FROM public.chain_txs t, season s
    WHERE (t.to_address IN (SELECT address FROM pc)
           OR t.from_address IN (SELECT address FROM pc))
      AND t.block_time >= s.start_at
    GROUP BY 1
  ),
  gd_transfers AS (
    SELECT (g.block_time AT TIME ZONE 'UTC')::date AS block_date,
           g.value / 1e18 AS gd_amount,
           CASE WHEN g.to_address IN (SELECT address FROM pc)
                 AND g.from_address NOT IN (SELECT address FROM pc)
                THEN g.value / 1e18 ELSE 0 END AS inflow,
           CASE WHEN g.from_address IN (SELECT address FROM pc)
                 AND g.to_address NOT IN (SELECT address FROM pc)
                THEN g.value / 1e18 ELSE 0 END AS outflow
    FROM public.chain_gd_transfers g, season s
    WHERE (g.to_address IN (SELECT address FROM pc)
           OR g.from_address IN (SELECT address FROM pc))
      AND g.block_time >= s.start_at
  ),
  daily_gd AS (
    SELECT block_date,
           count(*) AS gd_token_transfers,
           sum(gd_amount) AS gd_volume,
           sum(inflow) - sum(outflow) AS gd_net_flow
    FROM gd_transfers
    GROUP BY block_date
  ),
  joined AS (
    SELECT coalesce(t.block_date, g.block_date) AS block_date,
           coalesce(t.direct_tx_count, 0) AS direct_tx_count,
           coalesce(g.gd_token_transfers, 0) AS gd_token_transfers,
           coalesce(g.gd_volume, 0) AS gd_volume,
           coalesce(g.gd_net_flow, 0) AS gd_net_flow
    FROM daily_txs t
    FULL OUTER JOIN daily_gd g ON t.block_date = g.block_date
  )
  SELECT * FROM (
    SELECT NULL::date,
           coalesce(sum(direct_tx_count), 0)::bigint,
           coalesce(sum(gd_token_transfers), 0)::bigint,
           coalesce(sum(gd_volume), 0),
           coalesce(sum(gd_net_flow), 0)
    FROM joined
    UNION ALL
    SELECT block_date, direct_tx_count, gd_token_transfers, gd_volume, gd_net_flow
    FROM joined
  ) r
  ORDER BY 1 DESC NULLS FIRST;
$$;


-- 2. Whitelisted active users (template: users_table -> dau_whitelisted).
--    Wallets that interacted with Onward's contracts and were GoodID verified
--    before interacting that day. Contracts are excluded. First row is the
--    season total (any wallet that is whitelisted, as in the template).
CREATE OR REPLACE FUNCTION public.analytics_whitelisted_users(p_start date)
RETURNS TABLE (
  block_date       date,
  dau_whitelisted  bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH pc AS (
    SELECT unnest(public.analytics_project_contracts()) AS address
  ),
  season AS (
    SELECT (p_start::timestamp AT TIME ZONE 'UTC') AS start_at
  ),
  tx_users AS (
    SELECT (t.block_time AT TIME ZONE 'UTC')::date AS block_date,
           t.block_time,
           CASE WHEN t.to_address IN (SELECT address FROM pc) THEN t.from_address
                WHEN t.from_address IN (SELECT address FROM pc) THEN t.to_address
           END AS user_address
    FROM public.chain_txs t, season s
    WHERE (t.to_address IN (SELECT address FROM pc)
           OR t.from_address IN (SELECT address FROM pc))
      AND t.block_time >= s.start_at
  ),
  gd_transfer_users AS (
    SELECT (g.block_time AT TIME ZONE 'UTC')::date AS block_date,
           g.block_time,
           CASE WHEN g.to_address IN (SELECT address FROM pc) THEN g.from_address
                WHEN g.from_address IN (SELECT address FROM pc) THEN g.to_address
           END AS user_address
    FROM public.chain_gd_transfers g, season s
    WHERE (g.to_address IN (SELECT address FROM pc)
           OR g.from_address IN (SELECT address FROM pc))
      AND g.block_time >= s.start_at
  ),
  all_users AS (
    SELECT block_date, block_time, user_address FROM tx_users
    UNION
    SELECT block_date, block_time, user_address FROM gd_transfer_users
  ),
  filtered_users AS (
    SELECT a.block_date, a.user_address, min(a.block_time) AS earliest_time
    FROM all_users a
    WHERE a.user_address IS NOT NULL
      AND a.user_address NOT IN (SELECT address FROM pc)
      AND NOT EXISTS (
        SELECT 1 FROM public.chain_addresses ca
        WHERE ca.address = a.user_address AND ca.is_contract IS TRUE
      )
    GROUP BY a.block_date, a.user_address
  ),
  user_whitelist AS (
    SELECT address AS user_address, min(block_time) AS whitelist_time
    FROM public.chain_whitelist_events
    GROUP BY address
  )
  SELECT * FROM (
    SELECT NULL::date, count(DISTINCT f.user_address)::bigint
    FROM filtered_users f
    JOIN user_whitelist w ON f.user_address = w.user_address
    UNION ALL
    SELECT f.block_date,
           count(DISTINCT CASE WHEN w.whitelist_time <= f.earliest_time
                               THEN f.user_address END)::bigint
    FROM filtered_users f
    JOIN user_whitelist w ON f.user_address = w.user_address
    GROUP BY f.block_date
  ) r
  ORDER BY 1 DESC NULLS FIRST;
$$;


-- 3. Onboarded users (template: users_table -> project_onboarded_users).
--    Wallets GoodID verified during the season that interacted with Onward's
--    contracts within 24 hours of verifying. First row is the season total.
CREATE OR REPLACE FUNCTION public.analytics_onboarded_users(p_start date)
RETURNS TABLE (
  cohort_date      date,
  onboarded_users  bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH pc AS (
    SELECT unnest(public.analytics_project_contracts()) AS address
  ),
  season AS (
    SELECT (p_start::timestamp AT TIME ZONE 'UTC') AS start_at
  ),
  project_interactions AS (
    SELECT t.block_time,
           CASE WHEN t.to_address IN (SELECT address FROM pc) THEN t.from_address
                WHEN t.from_address IN (SELECT address FROM pc) THEN t.to_address
           END AS user_address
    FROM public.chain_txs t, season s
    WHERE (t.to_address IN (SELECT address FROM pc)
           OR t.from_address IN (SELECT address FROM pc))
      AND t.block_time >= s.start_at
      AND t.success
    UNION ALL
    SELECT g.block_time,
           CASE WHEN g.to_address IN (SELECT address FROM pc) THEN g.from_address
                WHEN g.from_address IN (SELECT address FROM pc) THEN g.to_address
           END AS user_address
    FROM public.chain_gd_transfers g, season s
    WHERE (g.to_address IN (SELECT address FROM pc)
           OR g.from_address IN (SELECT address FROM pc))
      AND g.block_time >= s.start_at
  ),
  whitelist AS (
    SELECT w.address AS user_address,
           w.block_time AS whitelist_time,
           (w.block_time AT TIME ZONE 'UTC')::date AS whitelist_date
    FROM public.chain_whitelist_events w, season s
    WHERE w.block_time >= s.start_at
  ),
  onboarded AS (
    SELECT DISTINCT w.user_address, w.whitelist_date AS cohort_date
    FROM whitelist w
    JOIN project_interactions i
      ON i.user_address = w.user_address
     AND i.block_time >= w.whitelist_time
     AND i.block_time <= w.whitelist_time + interval '24 hours'
    WHERE i.user_address IS NOT NULL
  ),
  all_dates AS (
    SELECT d::date AS cohort_date
    FROM generate_series(p_start, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS d
  )
  SELECT * FROM (
    SELECT NULL::date, count(DISTINCT user_address)::bigint FROM onboarded
    UNION ALL
    SELECT ad.cohort_date, coalesce(o.onboarded_users, 0)::bigint
    FROM all_dates ad
    LEFT JOIN (
      SELECT cohort_date, count(DISTINCT user_address) AS onboarded_users
      FROM onboarded
      GROUP BY cohort_date
    ) o ON ad.cohort_date = o.cohort_date
  ) r
  ORDER BY 1 DESC NULLS FIRST;
$$;

-- Wallets whose details the sync should (re)check: new wallets, wallets not
-- yet verified (every 12 hours, they may verify later) and verified wallets
-- (weekly, to catch re-verification).
CREATE OR REPLACE FUNCTION public.chain_addresses_due(p_limit integer)
RETURNS TABLE (address text, is_contract boolean)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH pc AS (
    SELECT unnest(public.analytics_project_contracts()) AS address
  ),
  candidates AS (
    SELECT t.from_address AS address FROM public.chain_txs t
    WHERE t.to_address IN (SELECT address FROM pc)
    UNION
    SELECT g.from_address FROM public.chain_gd_transfers g
    WHERE g.to_address IN (SELECT address FROM pc)
    UNION
    SELECT g.to_address FROM public.chain_gd_transfers g
    WHERE g.from_address IN (SELECT address FROM pc)
  )
  SELECT c.address, ca.is_contract
  FROM candidates c
  LEFT JOIN public.chain_addresses ca ON ca.address = c.address
  WHERE c.address NOT IN (SELECT address FROM pc)
    AND (
      ca.address IS NULL
      OR ca.is_contract IS NULL
      OR (ca.is_contract IS FALSE AND (
            ca.whitelist_checked_at IS NULL
            OR (ca.whitelist_checked_at < now() - interval '12 hours'
                AND NOT EXISTS (SELECT 1 FROM public.chain_whitelist_events w
                                WHERE w.address = c.address))
            OR ca.whitelist_checked_at < now() - interval '7 days'
          ))
    )
  ORDER BY ca.whitelist_checked_at NULLS FIRST
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.chain_addresses_due(integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.analytics_daily_transactions(date) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.analytics_whitelisted_users(date) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.analytics_onboarded_users(date) FROM public, anon, authenticated;