import React from "react";
import { Lock } from "lucide-react";
import type { Scenario } from "@/lib/scam/patterns";

interface WalletPopupCardProps {
  scenario: Extract<Scenario, { kind: "wallet_popup" }>;
}

const WalletPopupCard = ({ scenario }: WalletPopupCardProps) => {
  return (
    <div className="w-full max-w-[320px] rounded-[18px] bg-indigo p-4 shadow-[0_12px_32px_rgba(31,58,110,0.30)]">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <Lock size={14} strokeWidth={2.5} className="text-mustard" />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mustard">
          Wallet Action
        </span>
      </div>

      <div className="pt-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-paper/60 mb-1">
          {scenario.title}
        </div>
        <div className="display text-[16px] font-semibold leading-[1.3] text-paper mb-2">
          {scenario.action}
        </div>
        <div className="text-[11.5px] leading-[1.5] text-paper/75">{scenario.detail}</div>

        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-[10px] bg-white/10 py-2.5 text-center text-[12px] font-bold text-paper/80 cursor-pointer">
            Cancel
          </div>
          <div className="flex-1 rounded-[10px] bg-terracotta py-2.5 text-center text-[12px] font-bold text-paper cursor-pointer">
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletPopupCard;