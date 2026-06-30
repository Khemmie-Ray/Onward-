"use client";

import { formatUnits } from "viem";
import { passThresholdText, SCORING } from "@/lib/scoring";

export function PremiumDescription({ stakeAmount }: { stakeAmount: bigint }) {
  const stakeDisplay = formatUnits(stakeAmount, 18);
  const totalWin = parseFloat(stakeDisplay) + SCORING.premiumBonus;

  return (
    <>
      <h2 className="display text-[20px] font-bold text-indigo mb-2">
        Premium round
      </h2>
      <p className="text-[13px] text-fg-soft leading-relaxed mb-4">
        Stake {stakeDisplay} G$. Pass to win {totalWin} G$ back. Fail or quit
        and your stake refills the rewards pool.
      </p>
      <ul className="space-y-2 text-[13px] text-fg-soft">
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>6 holes, very fast popups, hardest pace</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>Pass threshold: {passThresholdText("premium")}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>
            Win: {stakeDisplay} G$ refund + {SCORING.premiumBonus} G$ bonus
          </span>
        </li>
      </ul>
    </>
  );
}
