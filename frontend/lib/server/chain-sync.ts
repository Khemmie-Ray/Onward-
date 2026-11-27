import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BLOCKSCOUT = "https://celo.blockscout.com/api";
const GD_TOKEN = "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";
const IDENTITY = "0xc361a6e67822a0edc17d899227dd9fc50bd62f42";
const WHITELISTED_ADDED_TOPIC =
  "0xee1504a83b6d4a361f4c1dc78ab59bfa30d6a3b6612c403e86bb01ef2984295f";

export const PROJECT_CONTRACTS = [
  "0x5b6c4cc464fb14ed2fa78090924186d5f057875b", // OnwardBadges
  "0xf66cfe1d3bf53a4cc9ced5e9b39945e3769a5c87", // OnwardClaims
  "0x09c44c654653187b480abddfdb48aba11fb38765", // WhackStake
] as const;

const PAGE = 1000;
const ADDRESS_BATCH = 50;

const rpc = createPublicClient({
  chain: celo,
  transport: http(process.env.CELO_RPC_URL ?? "https://forno.celo.org"),
});

type Log = (msg: string) => void;
type Options = { deadline: number; log?: Log };

export type ChainSyncResult = {
  txs: number;
  gdTransfers: number;
  addressesChecked: number;
  whitelistEvents: number;
  finished: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pad = (address: string) => `0x${address.slice(2).padStart(64, "0")}`;
const hexOrDec = (v: string | undefined) =>
  !v || v === "0x" ? 0 : Number(v.startsWith("0x") ? BigInt(v) : BigInt(v));
const isoFromSeconds = (s: string) =>
  new Date(hexOrDec(s) * 1000).toISOString();

type BlockscoutResponse<T> = { status?: string; message?: string; result?: T };

const MIN_GAP_MS = process.env.BLOCKSCOUT_API_KEY ? 150 : 400;
const MAX_ATTEMPTS = 7;
let nextSlot = 0;

async function waitForSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + MIN_GAP_MS;
  if (at > now) await sleep(at - now);
}

function retryDelay(res: Response | null, attempt: number): number {
  const retryAfter = Number(res?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const reset = Number(res?.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return reset > 1000 ? reset : reset * 1000;
  }
  return Math.min(60_000, 5000 * 2 ** attempt); 
}

async function blockscout<T>(params: Record<string, string>): Promise<T[]> {
  const url = new URL(BLOCKSCOUT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (process.env.BLOCKSCOUT_API_KEY) {
    url.searchParams.set("apikey", process.env.BLOCKSCOUT_API_KEY);
  }

  let lastProblem = "";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await waitForSlot();
    let res: Response;
    try {
      res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      lastProblem = err instanceof Error ? err.message : "network error";
      await sleep(retryDelay(null, attempt));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      lastProblem =
        res.status === 429
          ? "rate limited (429)"
          : `server error (${res.status})`;
      const wait = retryDelay(res, attempt);
      
      nextSlot = Math.max(nextSlot, Date.now() + wait);
      await sleep(wait);
      continue;
    }
    const body = (await res.json().catch(() => null)) as BlockscoutResponse<
      T[]
    > | null;
    if (!body)
      throw new Error(`Blockscout returned no JSON for ${params.action}`);
    if (Array.isArray(body.result)) return body.result;
    // Etherscan-style "nothing found" replies use status 0 with an empty result.
    if (
      body.status === "0" &&
      /no (transactions|token transfers|logs|records)|not found/i.test(
        body.message ?? "",
      )
    ) {
      return [];
    }
    throw new Error(
      `Blockscout ${params.action} failed: ${body.message ?? "unknown"}`,
    );
  }
  throw new Error(`Blockscout ${params.action} kept failing: ${lastProblem}`);
}

async function getLastBlock(key: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("chain_sync_state")
    .select("last_block")
    .eq("key", key)
    .maybeSingle();
  return Number(data?.last_block ?? 0);
}

async function setLastBlock(key: string, block: number) {
  const { error } = await supabaseAdmin
    .from("chain_sync_state")
    .upsert({ key, last_block: block, updated_at: new Date().toISOString() });
  if (error) throw new Error(`chain_sync_state: ${error.message}`);
}

type RawTx = {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string | null;
  isError?: string;
  txreceipt_status?: string;
};

/** Transactions to or from one contract. Returns rows written. */
async function syncTxs(
  contract: string,
  opts: Options,
): Promise<[number, boolean]> {
  const key = `txs:${contract}`;
  let start = await getLastBlock(key);
  let written = 0;

  while (Date.now() < opts.deadline) {
    const page = await blockscout<RawTx>({
      module: "account",
      action: "txlist",
      address: contract,
      startblock: String(start),
      sort: "asc",
      page: "1",
      offset: String(PAGE),
    });
    if (page.length === 0) return [written, true];

    const rows = page.map((t) => ({
      hash: t.hash.toLowerCase(),
      block_number: hexOrDec(t.blockNumber),
      block_time: isoFromSeconds(t.timeStamp),
      from_address: t.from.toLowerCase(),
      to_address: t.to ? t.to.toLowerCase() : null,
      success: t.isError !== "1" && t.txreceipt_status !== "0",
    }));
    const { error } = await supabaseAdmin
      .from("chain_txs")
      .upsert(rows, { onConflict: "hash" });
    if (error) throw new Error(`chain_txs: ${error.message}`);
    written += rows.length;

    const maxBlock = Math.max(...rows.map((r) => r.block_number));

    const next = page.length < PAGE ? maxBlock : Math.max(maxBlock, start + 1);
    await setLastBlock(key, next);
    opts.log?.(
      `txs ${contract.slice(0, 8)}… up to block ${maxBlock} (+${rows.length})`,
    );
    if (page.length < PAGE) return [written, true];
    start = next;
  }
  return [written, false];
}

type RawLog = {
  transactionHash: string;
  logIndex: string;
  blockNumber: string;
  timeStamp: string;
  topics: (string | null)[];
  data: string;
};

type RawTokenTx = {
  hash: string;
  logIndex?: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  contractAddress?: string;
};

async function syncGdTransfers(
  contract: string,
  opts: Options,
): Promise<[number, boolean]> {
  const key = `gd:${contract}`;
  let start = await getLastBlock(key);
  let written = 0;

  while (Date.now() < opts.deadline) {
    const page = await blockscout<RawTokenTx>({
      module: "account",
      action: "tokentx",
      address: contract,
      contractaddress: GD_TOKEN,
      startblock: String(start),
      sort: "asc",
      page: "1",
      offset: String(PAGE),
    });
    if (page.length === 0) return [written, true];


    const seen = new Map<string, number>();
    const rows = page
      .filter(
        (t) =>
          !t.contractAddress || t.contractAddress.toLowerCase() === GD_TOKEN,
      )
      .map((t) => {
        const hash = t.hash.toLowerCase();
        const ordinal = seen.get(hash) ?? 0;
        seen.set(hash, ordinal + 1);
        const logIndex =
          t.logIndex !== undefined && t.logIndex !== ""
            ? hexOrDec(t.logIndex)
            : 1_000_000 + ordinal;
        return {
          tx_hash: hash,
          log_index: logIndex,
          block_number: hexOrDec(t.blockNumber),
          block_time: isoFromSeconds(t.timeStamp),
          from_address: t.from.toLowerCase(),
          to_address: t.to.toLowerCase(),
          value: BigInt(t.value || "0").toString(),
        };
      });
    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("chain_gd_transfers")
        .upsert(rows, { onConflict: "tx_hash,log_index" });
      if (error) throw new Error(`chain_gd_transfers: ${error.message}`);
      written += rows.length;
    }

    const maxBlock = Math.max(...page.map((t) => hexOrDec(t.blockNumber)));
    const full = page.length >= PAGE;
    const next = full ? Math.max(maxBlock, start + 1) : maxBlock;
    await setLastBlock(key, next);
    opts.log?.(
      `G$ ${contract.slice(0, 8)}… up to block ${maxBlock} (+${rows.length})`,
    );
    if (!full) return [written, true];
    start = next;
  }
  return [written, false];
}

const DELEGATED_EOA_PREFIX = "0xef0100"; // EIP-7702 delegation, still an EOA

async function isContract(address: string): Promise<boolean> {
  const code = await rpc.getCode({ address: address as `0x${string}` });
  return Boolean(
    code && code !== "0x" && !code.startsWith(DELEGATED_EOA_PREFIX),
  );
}

/** Contract check and GoodID whitelist events for wallets that interacted. */
async function syncAddresses(
  opts: Options,
): Promise<[number, number, boolean]> {
  let checked = 0;
  let events = 0;
  let failuresInARow = 0;

  while (Date.now() < opts.deadline) {
    const { data: due, error } = await supabaseAdmin.rpc(
      "chain_addresses_due",
      {
        p_limit: ADDRESS_BATCH,
      },
    );
    if (error) throw new Error(`chain_addresses_due: ${error.message}`);
    if (!due || due.length === 0) return [checked, events, true];

    for (const row of due) {
      if (Date.now() >= opts.deadline) return [checked, events, false];
      const address = row.address;
      const contract = row.is_contract ?? (await isContract(address));

      if (!contract) {
        let logs: RawLog[];
        try {
          logs = await blockscout<RawLog>({
            module: "logs",
            action: "getLogs",
            fromBlock: "0",
            toBlock: "latest",
            address: IDENTITY,
            topic0: WHITELISTED_ADDED_TOPIC,
            topic1: pad(address),
            topic0_1_opr: "and",
          });
          failuresInARow = 0;
        } catch (err) {
          // Leave this wallet unchecked so a later run retries it.
          failuresInARow++;
          opts.log?.(
            `whitelist lookup failed for ${address}: ${err instanceof Error ? err.message : err}`,
          );
          if (failuresInARow >= 5) {
            throw new Error(
              "GoodID lookups keep failing on Blockscout. Progress is saved; try again later.",
            );
          }
          continue;
        }
        const rows = logs.map((l) => ({
          tx_hash: l.transactionHash.toLowerCase(),
          log_index: hexOrDec(l.logIndex),
          address,
          block_time: isoFromSeconds(l.timeStamp),
        }));
        if (rows.length > 0) {
          const { error: wErr } = await supabaseAdmin
            .from("chain_whitelist_events")
            .upsert(rows, { onConflict: "tx_hash,log_index" });
          if (wErr) throw new Error(`chain_whitelist_events: ${wErr.message}`);
          events += rows.length;
        }
      }

      const { error: aErr } = await supabaseAdmin
        .from("chain_addresses")
        .upsert({
          address,
          is_contract: contract,
          whitelist_checked_at: contract ? null : new Date().toISOString(),
        });
      if (aErr) throw new Error(`chain_addresses: ${aErr.message}`);
      checked++;
    }
    opts.log?.(`checked ${checked} wallets, ${events} whitelist events`);
  }
  return [checked, events, false];
}

export async function runChainSync(opts: Options): Promise<ChainSyncResult> {
  let txs = 0;
  let gdTransfers = 0;
  let finished = true;

  for (const contract of PROJECT_CONTRACTS) {
    const [n, done] = await syncTxs(contract, opts);
    txs += n;
    finished &&= done;
    const [g, gDone] = await syncGdTransfers(contract, opts);
    gdTransfers += g;
    finished &&= gDone;
  }

  const [addressesChecked, whitelistEvents, addrDone] =
    await syncAddresses(opts);
  finished &&= addrDone;

  return { txs, gdTransfers, addressesChecked, whitelistEvents, finished };
}
