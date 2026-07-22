import type { Abi } from "viem";
import onwardBadgesJson from "./abi.json";
import whackStakeJson from "./whackStake.json";
import gDollarJson from "./gDollar.json";
import claimsJson from "./claims.json";

export const onwardBadgesAbi = onwardBadgesJson as Abi;
export const whackStakeAbi = whackStakeJson as Abi;
export const gDollarAbi = gDollarJson as Abi;
export const onwardClaimsAbi = claimsJson as Abi;