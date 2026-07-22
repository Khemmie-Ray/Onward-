import type { Address } from "viem";

export const CONTRACT_ADDRESSES = {
  onwardBadges: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as Address,
  whackStake: process.env.NEXT_PUBLIC_WHACKSTAKE_ADDRESS! as Address,
  gDollar: process.env.NEXT_PUBLIC_GDOLLAR_ADDRESS! as Address,
  onwardClaims: process.env.NEXT_PUBLIC_CLAIMS_ADDRESS! as Address,
  ubiScheme: process.env.NEXT_PUBLIC_UBISCHEME_ADDRESS! as Address,
  celoFaucet: process.env.NEXT_PUBLIC_FAUCET_ADDRESS! as Address,
} as const;

export const EXPLORER_BASE = "https://celoscan.io/";