import React from "react";
import { CheckCircle2 } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import type { Scenario } from "@/lib/scam/patterns";

interface TweetCardProps {
  scenario: Extract<Scenario, { kind: "tweet" }>;
}

const TweetCard = ({ scenario }: TweetCardProps) => {
  return (
    <div className="w-full max-w-[340px] rounded-[18px] bg-paper p-4 shadow-[0_8px_24px_rgba(31,58,110,0.12)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo flex-shrink-0">
          <LoopSigil size={20} color="var(--color-mustard)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-bold text-indigo truncate">
              {scenario.displayName}
            </span>
            {scenario.verified && (
              <CheckCircle2 size={12} strokeWidth={2.5} className="text-[#1DA1F2] flex-shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-fg-faint mb-2">{scenario.handle}</div>
          <p className="text-[12.5px] leading-[1.55] text-indigo">{scenario.body}</p>
        </div>
      </div>
    </div>
  );
}

export default TweetCard;