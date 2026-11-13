"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useConnection } from "wagmi";
import { formatUnits, type Address } from "viem";
import { useTokenBalances, formatBalance } from "@/hooks/useTokenBalances";
import { usePendingClaim } from "@/hooks/usePendingClaim";
import { LoopSigil } from "@/components/home/motifs";
import { WalletActions } from "@/components/dashboard/profile/WalletActions";

export default function WalletPage() {
  const { address } = useConnection();
  const addr = address as Address | undefined;

  return (
    <div className="w-full animate-[fade-up_0.6s_ease_both]">
      <div className="mb-5 flex items-center justify-end gap-3">
        {addr && <CopyAddress address={addr} />}
      </div>

      <BalanceHero address={addr} />

      <div className="mt-5">
        <WalletActions />
      </div>
    </div>
  );
}

function BalanceHero({ address }: { address: Address | undefined }) {
  const { balances } = useTokenBalances(address);
  const { pendingBalance } = usePendingClaim();

  const gDollar = balances.find((b) => b.symbol === "G$");
  const celo = balances.find((b) => b.symbol === "CELO");
  const usdt = balances.find((b) => b.symbol === "USDT");

  const gNumber = gDollar ? Number(gDollar.formatted) : 0;
  const [whole, frac] = gNumber
    .toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .split(".");

  const pendingG =
    pendingBalance > 0n ? Number(formatUnits(pendingBalance, 18)) : 0;

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#271d4e_0%,#3a2a6b_60%,#48307a_100%)] px-6 py-6 text-cream sm:px-8">
      <LoopSigil
        size={230}
        color="var(--color-cream)"
        className="pointer-events-none absolute -right-10 -top-14 opacity-[0.06]"
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Coin symbol="G$" size={26} />
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-cream/70">
              G$ balance
            </span>
          </div>
          <div className="display text-[44px] font-bold leading-none tabular-nums sm:text-[52px]">
            {whole}
            <span className="text-cream/40">.{frac}</span>
          </div>
        </div>

        <div className="w-full rounded-2xl bg-cream/5 p-4 lg:w-65">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/50">
            Other balances
          </div>
          <BalanceRow
            symbol="CELO"
            value={celo ? formatBalance(celo.formatted) : "0"}
          />
          <div className="my-2.5 h-px bg-cream/10" />
          <BalanceRow
            symbol="USDT"
            value={usdt ? formatBalance(usdt.formatted) : "0"}
          />
        </div>
      </div>
    </div>
  );
}

function BalanceRow({
  symbol,
  value,
}: {
  symbol: "CELO" | "USDT";
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Coin symbol={symbol} size={26} />
        <span className="text-[13px] font-bold text-cream">{symbol}</span>
      </div>
      <span className="text-[15px] font-bold tabular-nums text-cream">
        {value}
      </span>
    </div>
  );
}

function Coin({
  symbol,
  size,
}: {
  symbol: "G$" | "CELO" | "USDT";
  size: number;
}) {
  const map = {
    G$: { bg: "bg-mustard", fg: "text-indigo", label: "G$" },
    CELO: { bg: "bg-[#FBCB46]", fg: "text-indigo", label: "C" },
    USDT: { bg: "bg-forest", fg: "text-cream", label: "₮" },
  }[symbol];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${map.bg} ${map.fg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {map.label}
    </span>
  );
}

function CopyAddress({ address }: { address: Address }) {
  const [copied, setCopied] = useState(false);
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked; address stays visible for manual copy
    }
  };

  return (
    <button
      onClick={copy}
      aria-label="Copy wallet address"
      className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[12px] font-bold text-indigo shadow-[0_2px_10px_rgba(31,58,110,0.08)] transition hover:-translate-y-0.5"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-forest" />
      <span className="font-mono">{truncated}</span>
      {copied ? (
        <Check size={13} strokeWidth={2.8} className="text-forest" />
      ) : (
        <Copy size={13} strokeWidth={2.5} className="text-fg-soft" />
      )}
    </button>
  );
}
