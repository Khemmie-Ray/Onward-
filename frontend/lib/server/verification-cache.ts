import type { Address } from "viem";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isVerifiedOnchainSafe } from "@/lib/onchain/identity";

const FRESH_IF_VERIFIED_MS = 24 * 60 * 60 * 1000;
const FRESH_IF_UNVERIFIED_MS = 5 * 60 * 1000;

export async function isVerifiedCached(
  userId: string,
  walletAddress: Address,
): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("is_verified, verified_checked_at")
    .eq("id", userId)
    .single();

  const cached = user?.is_verified === true;
  const checkedAt = user?.verified_checked_at
    ? new Date(user.verified_checked_at).getTime()
    : 0;
  const age = Date.now() - checkedAt;
  const window = cached ? FRESH_IF_VERIFIED_MS : FRESH_IF_UNVERIFIED_MS;

  if (checkedAt > 0 && age < window) {
    return cached;
  }

  const onchain = await isVerifiedOnchainSafe(walletAddress);

  await supabaseAdmin
    .from("users")
    .update({
      is_verified: onchain,
      verified_checked_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return onchain;
}
