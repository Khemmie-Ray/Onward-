"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  User as UserIcon,
  X,
} from "lucide-react";
import { useConnection } from "wagmi";
import { celo } from "wagmi/chains";
import { type Address } from "viem";
import { useWeb3Auth } from "@web3auth/modal/react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  useTokenBalances,
  formatBalance,
  type TokenBalance,
} from "@/hooks/useTokenBalances";

export function WalletPill({
  address,
  avatarId,
  onDisconnect,
}: {
  address: string;
  avatarId: string | null;
  onDisconnect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { chainId } = useConnection();
  const { balances, isLoading, refetch } = useTokenBalances(
    address as Address | undefined,
  );

  const onCeloMainnet = chainId === celo.id;
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("[copy address failed]", err);
    }
  };

  const handleDisconnect = () => {
    close();
    onDisconnect();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-paper py-1.5 pl-1.5 pr-3.5 shadow-[0_4px_12px_rgba(31,58,110,0.06)] transition-shadow hover:shadow-[0_6px_16px_rgba(31,58,110,0.10)]"
      >
        <UserAvatar avatarId={avatarId} size={32} />
        <span className="text-[12px] font-semibold text-indigo">
          {truncated}
        </span>
      </button>

      {mounted &&
        createPortal(
          <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-indigo/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your wallet"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-full flex-col bg-canvas transition-transform duration-300 ease-out sm:max-w-[380px] md:max-w-[400px] ${
          open
            ? "translate-x-0 shadow-[-8px_0_32px_rgba(31,58,110,0.15)]"
            : "pointer-events-none translate-x-full shadow-none"
        }`}
      >

        <div className="flex items-center justify-between gap-3 border-b border-shadow/40 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar avatarId={avatarId} size={40} />
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-fg-soft">
                Your wallet
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-indigo transition-opacity hover:opacity-80"
              >
                <span className="truncate font-mono">{truncated}</span>
                {copied ? (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-forest"
                  />
                ) : (
                  <Copy
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-fg-soft"
                  />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close wallet panel"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-soft transition-colors hover:bg-canvas-warm hover:text-indigo"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-canvas-warm px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  onCeloMainnet ? "bg-forest" : "bg-terracotta animate-pulse"
                }`}
              />
              <span className="text-[12px] font-semibold text-indigo">
                {onCeloMainnet ? "Celo Network" : "Wrong network"}
              </span>
            </div>
            {!onCeloMainnet && (
              <span className="text-[11px] font-medium text-terracotta">
                Balances may not load
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-soft">
              Balances
            </span>
            <button
              onClick={refetch}
              aria-label="Refresh balances"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-fg-soft transition-colors hover:text-indigo"
            >
              <RefreshCw
                size={12}
                strokeWidth={2.5}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="space-y-2.5">
            {balances.map((token) => (
              <BalanceRow key={token.symbol} token={token} />
            ))}
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-fg-soft/80">
            These balances live on the Celo network at your address above.
            Anything you earn on Onward arrives here.
          </p>
        </div>
        <div className="space-y-1 border-t border-shadow/50 p-3">
          <Link
            href="/profile"
            onClick={close}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-indigo transition-colors hover:bg-canvas-warm"
          >
            <UserIcon size={16} strokeWidth={2} />
            Profile
          </Link>
          <button
            onClick={handleDisconnect}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-terracotta transition-colors hover:bg-terracotta-tint"
          >
            <LogOut size={16} strokeWidth={2} />
            Sign out
          </button>
        </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}

function BalanceRow({ token }: { token: TokenBalance }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-paper px-4 py-3.5 shadow-[0_2px_8px_rgba(31,58,110,0.04)]">
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-indigo">{token.symbol}</div>
        <div className="truncate text-[11px] text-fg-soft">{token.name}</div>
      </div>
      <div className="shrink-0 text-right">
        {token.isLoading ? (
          <Loader2
            size={14}
            strokeWidth={2.5}
            className="animate-spin text-fg-soft"
          />
        ) : (
          <div className="display text-[16px] font-bold tabular-nums text-indigo">
            {formatBalance(token.formatted)}
          </div>
        )}
      </div>
    </div>
  );
}