"use client";

import { useState } from "react";
import { ClaimCard } from "./ClaimCard";
import { WithdrawCard } from "./WithdrawCard";

type Panel = "withdraw" | "convert";

export function WalletActions() {
  const [panel, setPanel] = useState<Panel>("withdraw");

  return (
    <div className="w-full rounded-[24px] bg-paper p-4 shadow-[0_8px_30px_rgba(31,58,110,0.06)] sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-indigo">
          Wallet actions
        </h2>
        <div className="inline-flex gap-1 self-start rounded-full bg-canvas-warm p-1 sm:self-auto">
          <TabButton
            label="Withdraw"
            dot="bg-forest"
            active={panel === "withdraw"}
            onClick={() => setPanel("withdraw")}
          />
          <TabButton
            label="Convert"
            dot="bg-mustard"
            active={panel === "convert"}
            onClick={() => setPanel("convert")}
          />
        </div>
      </div>

      {panel === "withdraw" ? (
        <WithdrawCard />
      ) : (
        <ClaimCard onClaimed={() => setPanel("withdraw")} />
      )}
    </div>
  );
}

function TabButton({
  label,
  dot,
  active,
  onClick,
}: {
  label: string;
  dot: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-colors ${
        active ? "bg-indigo text-cream" : "text-fg-soft hover:text-indigo"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </button>
  );
}
