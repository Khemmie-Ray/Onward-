import { supabaseAdmin } from "@/lib/supabase/admin";

export const SEASON_START = "2026-11-17";
export const SEASON_LABEL = "GoodBuilders Season 5";

export type AnalyticsView = "season" | "all";

export type DailyTx = {
  date: string;
  txs: number;
  gdTransfers: number;
  gdVolume: number;
  gdNetFlow: number;
};
export type DailyCount = { date: string; count: number };

export type AnalyticsData = {
  totals: {
    txs: number;
    gdTransfers: number;
    gdVolume: number;
    gdNetFlow: number;
    whitelistedUsers: number;
    onboardedUsers: number;
  };
  daily: DailyTx[];
  whitelistedDaily: DailyCount[];
  onboardedDaily: DailyCount[];
  lastSyncedAt: string | null;
  /** First day (UTC) the numbers cover. */
  start: string;
};

const num = (v: unknown) => Number(v ?? 0);

/** First UTC day any Onward contract saw a transaction. */
async function firstActivityDate(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("chain_txs")
    .select("block_time")
    .order("block_time", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.block_time ? data.block_time.slice(0, 10) : SEASON_START;
}

export async function loadAnalytics(
  view: AnalyticsView,
): Promise<AnalyticsData> {
  const start = view === "season" ? SEASON_START : await firstActivityDate();
  const [txRes, wlRes, obRes, syncRes] = await Promise.all([
    supabaseAdmin.rpc("analytics_daily_transactions", { p_start: start }),
    supabaseAdmin.rpc("analytics_whitelisted_users", { p_start: start }),
    supabaseAdmin.rpc("analytics_onboarded_users", { p_start: start }),
    supabaseAdmin
      .from("chain_sync_state")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  for (const res of [txRes, wlRes, obRes]) {
    if (res.error) throw new Error(`analytics: ${res.error.message}`);
  }

  const txRows = txRes.data ?? [];
  const wlRows = wlRes.data ?? [];
  const obRows = obRes.data ?? [];

  const txTotal = txRows.find((r) => r.block_date === null);
  const wlTotal = wlRows.find((r) => r.block_date === null);
  const obTotal = obRows.find((r) => r.cohort_date === null);

  return {
    totals: {
      txs: num(txTotal?.direct_tx_count),
      gdTransfers: num(txTotal?.gd_token_transfers),
      gdVolume: num(txTotal?.gd_volume),
      gdNetFlow: num(txTotal?.gd_net_flow),
      whitelistedUsers: num(wlTotal?.dau_whitelisted),
      onboardedUsers: num(obTotal?.onboarded_users),
    },
    daily: txRows
      .filter((r) => r.block_date !== null)
      .map((r) => ({
        date: r.block_date as string,
        txs: num(r.direct_tx_count),
        gdTransfers: num(r.gd_token_transfers),
        gdVolume: num(r.gd_volume),
        gdNetFlow: num(r.gd_net_flow),
      })),
    whitelistedDaily: wlRows
      .filter((r) => r.block_date !== null)
      .map((r) => ({
        date: r.block_date as string,
        count: num(r.dau_whitelisted),
      })),
    onboardedDaily: obRows
      .filter((r) => r.cohort_date !== null)
      .map((r) => ({
        date: r.cohort_date as string,
        count: num(r.onboarded_users),
      })),
    lastSyncedAt: syncRes.data?.updated_at ?? null,
    start,
  };
}
