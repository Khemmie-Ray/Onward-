import { supabaseAdmin } from "@/lib/supabase/admin";
import { PointSource } from "../supabase/types";

export interface AwardPointsInput {
  userId: string;
  delta: number;
  source: PointSource;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

export interface AwardPointsResult {
  newBalance: number;
  wasNew: boolean;
}

const POSITIVE_ONLY_SOURCES: ReadonlySet<PointSource> = new Set([
  "free_round_pass",
  "module_complete",
  "daily_login",
  "referral",
  "leaderboard_weekly",
  "streak_milestone",
  "contest_win",
]);

const NEGATIVE_ONLY_SOURCES: ReadonlySet<PointSource> = new Set([
  "claim_redemption",
]);

function validateDelta(delta: number, source: PointSource): void {
  if (delta === 0) throw new Error(`awardPoints: delta cannot be zero`);
  if (!Number.isInteger(delta))
    throw new Error(`awardPoints: delta must be integer`);
  if (POSITIVE_ONLY_SOURCES.has(source) && delta <= 0) {
    throw new Error(`awardPoints: source '${source}' requires positive delta`);
  }
  if (NEGATIVE_ONLY_SOURCES.has(source) && delta >= 0) {
    throw new Error(`awardPoints: source '${source}' requires negative delta`);
  }
}

export async function awardPoints(
  input: AwardPointsInput,
): Promise<AwardPointsResult> {
  const { userId, delta, source, referenceId, metadata } = input;

  if (!userId) throw new Error("awardPoints: userId required");
  if (!referenceId?.trim())
    throw new Error("awardPoints: referenceId required");
  validateDelta(delta, source);

  console.log("[awardPoints] RPC PAYLOAD", {
    p_delta: delta,
    p_source: source,
    p_user_id: userId,
  });
  
  const { data, error } = await supabaseAdmin.rpc("award_points", {
    p_user_id: userId,
    p_delta: delta,
    p_source: source,
    p_reference_id: referenceId,
    p_metadata: metadata ?? null,
  });

  if (error) {
    throw new Error(`awardPoints rpc failed: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`awardPoints: empty result`);
  }

  const row = data[0] as { new_balance: number; was_new: boolean };
  return { newBalance: row.new_balance, wasNew: row.was_new };
}

export async function getPointsBalance(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_points")
    .select("balance, lifetime_earned, lifetime_claimed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`getPointsBalance failed: ${error.message}`);
  if (!data) return { balance: 0, lifetimeEarned: 0, lifetimeClaimed: 0 };

  return {
    balance: data.balance,
    lifetimeEarned: data.lifetime_earned,
    lifetimeClaimed: data.lifetime_claimed,
  };
}
