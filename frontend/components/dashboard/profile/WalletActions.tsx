"use client";

import { useState } from "react";
import { ClaimCard } from "./ClaimCard";
import { WithdrawCard, SwapComingSoon } from "./WithdrawCard";

type Panel = "claim" | "withdraw" | "swap";

export function WalletActions() {
  const [panel, setPanel] = useState<Panel>("claim");

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-full bg-paper p-1.5 shadow-[0_2px_10px_rgba(31,58,110,0.08)]">
          <TabButton
            label="Claim"
            active={panel === "claim"}
            onClick={() => setPanel("claim")}
          />
          <TabButton
            label="Withdraw"
            active={panel === "withdraw"}
            onClick={() => setPanel("withdraw")}
          />
          {/* <TabButton
            label="Swap"
            active={panel === "swap"}
            onClick={() => setPanel("swap")}
          /> */}
        </div>
      </div>

      {panel === "claim" && (
        <ClaimCard onClaimed={() => setPanel("withdraw")} />
      )}
      {panel === "withdraw" && <WithdrawCard />}
      {/* {panel === "swap" && <SwapComingSoon />} */}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-colors ${
        active ? "bg-indigo text-cream" : "text-fg-soft hover:text-indigo"
      }`}
    >
      {label}
    </button>
  );
}
