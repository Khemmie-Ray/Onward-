import { publicClient } from "@/lib/onchain/badges";
import { onwardClaimsAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

export const PRE_PIVOT_G_DISTRIBUTED = 170;

const WEI = 1_000_000_000_000_000_000n;

const WHACKSTAKE_VOLUME_ABI = [
  {
    name: "totalBonusPaid",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function toWholeG(wei: bigint): number {
  return Number(wei / WEI);
}

export async function getPlatformVolumeG(): Promise<number> {
  const [claimed, ubi, bonus] = await Promise.all([
    readCounter(
      CONTRACT_ADDRESSES.onwardClaims,
      onwardClaimsAbi,
      "totalClaimedG",
    ),
    readCounter(
      CONTRACT_ADDRESSES.onwardClaims,
      onwardClaimsAbi,
      "totalUbiClaimedG",
    ),
    readCounter(
      CONTRACT_ADDRESSES.whackStake,
      WHACKSTAKE_VOLUME_ABI,
      "totalBonusPaid",
    ),
  ]);

  return (
    PRE_PIVOT_G_DISTRIBUTED +
    toWholeG(claimed) +
    toWholeG(ubi) +
    toWholeG(bonus)
  );
}

export async function getVolumeBreakdownG(): Promise<{
  prePivot: number;
  pointsConverted: number;
  ubi: number;
  whackstakeBonus: number;
  total: number;
}> {
  const [claimed, ubi, bonus] = await Promise.all([
    readCounter(
      CONTRACT_ADDRESSES.onwardClaims,
      onwardClaimsAbi,
      "totalClaimedG",
    ),
    readCounter(
      CONTRACT_ADDRESSES.onwardClaims,
      onwardClaimsAbi,
      "totalUbiClaimedG",
    ),
    readCounter(
      CONTRACT_ADDRESSES.whackStake,
      WHACKSTAKE_VOLUME_ABI,
      "totalBonusPaid",
    ),
  ]);

  const pointsConverted = toWholeG(claimed);
  const ubiG = toWholeG(ubi);
  const whackstakeBonus = toWholeG(bonus);

  return {
    prePivot: PRE_PIVOT_G_DISTRIBUTED,
    pointsConverted,
    ubi: ubiG,
    whackstakeBonus,
    total: PRE_PIVOT_G_DISTRIBUTED + pointsConverted + ubiG + whackstakeBonus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readCounter(
  address: `0x${string}`,
  abi: any,
  functionName: string,
): Promise<bigint> {
  try {
    return (await publicClient.readContract({
      address,
      abi,
      functionName,
    })) as bigint;
  } catch (err) {
    console.error(`[volume] ${functionName} read failed`, err);
    return 0n;
  }
}
