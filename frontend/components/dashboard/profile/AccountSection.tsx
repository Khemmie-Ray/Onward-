"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect } from "@reown/appkit/react";
import { Check, Copy, LogOut, Wallet } from "lucide-react";

export function AccountSection({ walletAddress }: { walletAddress: string }) {
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSignOut = async () => {
    await disconnect();
    router.push("/");
  };

  return (
    <div className="rounded-[20px] bg-paper p-6 shadow-[0_6px_20px_rgba(31,58,110,0.06)]">
      <h2 className="display text-[18px] font-semibold tracking-[-0.015em] text-indigo mb-1">
        Account
      </h2>
      <p className="text-[12px] text-fg-soft mb-5">Your connected wallet.</p>

      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-2">
          Wallet
        </div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center gap-3 rounded-[12px] bg-canvas-warm p-3 text-left transition-colors hover:bg-shadow"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo">
            <Wallet size={14} strokeWidth={2.5} className="text-mustard" />
          </div>
          <span className="flex-1 font-mono text-[12px] text-indigo truncate">
            {walletAddress}
          </span>
          {copied ? (
            <Check size={14} strokeWidth={2.5} className="text-forest" />
          ) : (
            <Copy size={14} strokeWidth={2.5} className="text-fg-soft" />
          )}
        </button>
      </div>

      <div className="h-px bg-shadow mb-4" />

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 rounded-[12px] bg-terracotta-tint py-3 text-[13px] font-bold text-terracotta transition-colors hover:bg-terracotta hover:text-paper"
      >
        <LogOut size={14} strokeWidth={2.5} />
        Sign out
      </button>
    </div>
  );
}