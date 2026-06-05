import type { Abi } from "viem";
import onwardBadgesJson from "./abi.json";
import whackStakeJson from "./whackStake.json";
import gDollarJson from "./gDollar.json";

export const onwardBadgesAbi = onwardBadgesJson as Abi;
export const whackStakeAbi = whackStakeJson as Abi;
export const gDollarAbi = gDollarJson as Abi;