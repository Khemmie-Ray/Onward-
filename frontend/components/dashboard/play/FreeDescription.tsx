"use client";

import { passThresholdText, rewardText } from "@/lib/scoring";

export function FreeDescription() {
  return (
    <>
      <h2 className="display text-[20px] font-bold text-indigo mb-2">
        Today&apos;s free round
      </h2>
      <p className="text-[13px] text-fg-soft leading-relaxed mb-4">
        60 seconds. One round per UTC day. Pass to earn {rewardText("free")} and add to your streak.
      </p>
      <ul className="space-y-2 text-[13px] text-fg-soft">
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Pass threshold: {passThresholdText("free")}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Reward: 25 points</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Adds a day to your streak</span>
        </li>
      </ul>
    </>
  );
}
