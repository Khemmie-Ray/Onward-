import React from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import type { Scenario } from "@/lib/scam/patterns";

interface DMCardProps {
  scenario: Extract<Scenario, { kind: "dm" }>;
}

const DMCard = ({ scenario }: DMCardProps) => {
  const platformBg = {
    Telegram: "bg-[#2AABEE]",
    Discord: "bg-[#5865F2]",
    WhatsApp: "bg-[#25D366]",
  }[scenario.platform];

  return (
    <div className="w-full max-w-[340px] rounded-[18px] bg-paper p-4 shadow-[0_8px_24px_rgba(31,58,110,0.12)]">
      <div className="flex items-center gap-3 pb-3 border-b border-shadow">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${platformBg}`}>
          <MessageCircle size={18} strokeWidth={2.5} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-indigo truncate">
              {scenario.sender}
            </span>
            {scenario.avatarStyle === "verified" && (
              <CheckCircle2 size={12} strokeWidth={2.5} className="text-forest flex-shrink-0" />
            )}
          </div>
          <div className="text-[10px] text-fg-faint">{scenario.platform}</div>
        </div>
      </div>
      <div className="pt-3">
        <div className="rounded-[12px] bg-canvas-warm p-3 text-[12.5px] leading-[1.55] text-indigo">
          {scenario.body}
        </div>
      </div>
    </div>
  );
}

export default DMCard;