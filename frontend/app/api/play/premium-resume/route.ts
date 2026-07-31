import { NextResponse } from "next/server";
import { type Address, keccak256, toBytes } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { publicClient } from "@/lib/onchain/badges";
import { whackStakeAbi } from "@/constants/abis";

const WHACK_STAKE_ADDRESS = process.env
  .NEXT_PUBLIC_WHACKSTAKE_ADDRESS as Address;

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;
  const wallet = user.wallet_address as Address;

  try {
    const [roundIdHash, amount, exists] = (await publicClient.readContract({
      address: WHACK_STAKE_ADDRESS,
      abi: whackStakeAbi,
      functionName: "getActiveStake",
      args: [wallet],
    })) as readonly [`0x${string}`, bigint, boolean];

    if (!exists || amount === 0n) {
      return NextResponse.json({ resumable: false });
    }

    const { data: sessions } = await supabaseAdmin
      .from("game_sessions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("mode", "premium")
      .order("started_at", { ascending: false })
      .limit(20);

    const match = (sessions ?? []).find(
      (s) => keccak256(toBytes(s.id)) === roundIdHash,
    );

    if (match) {
      if (match.status === "submitted" || match.status === "expired") {
        return NextResponse.json({
          resumable: false,
          needsForfeit: true,
          round_id: match.id,
          stake_amount: amount.toString(),
          message:
            "A previous staked round didn't resolve. Forfeit to release your funds.",
        });
      }
     
      return NextResponse.json({
        resumable: true,
        round_id: match.id,
        stake_amount: amount.toString(),
      });
    }

    return NextResponse.json({
      resumable: false,
      needsForfeit: true,
      round_id_hash: roundIdHash,
      stake_amount: amount.toString(),
      message:
        "You have a stake with no playable round. Forfeit to release it.",
    });
  } catch (err) {
    console.error("[premium-resume] failed:", err);
    return NextResponse.json(
      { resumable: false, error: "Could not check existing stake" },
      { status: 500 },
    );
  }
}
