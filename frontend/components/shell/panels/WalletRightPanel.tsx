"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Flame, KeyRound } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { StreakRestorePrompt } from "@/components/dashboard/streak/StreakRestorePrompt";
import { StreakFreezeCard } from "@/components/dashboard/streak/StreakFreezeCard";
import { WalletDetails } from "@/components/auth/WalletDetails";

export function WalletRightPanel() {
  const authFetch = useAuthFetch();

  const { data } = useQuery<{ current_streak: number }>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const streak = data?.current_streak ?? 0;

  return (
    <>
      <UBIClaimCard />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-tint text-terracotta">
            <Flame size={17} strokeWidth={2.5} />
          </div>
          <div>
            <div className="display text-[16px] font-bold leading-tight text-indigo">
              Streak shop
            </div>
            <div className="text-[11.5px] text-fg-soft">
              Current streak: {streak} day{streak === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <StreakRestorePrompt />
        <StreakFreezeCard />
      </div>

      <WalletKeysCard />
    </>
  );
}

function WalletKeysCard() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-paper p-4 text-left shadow-[0_2px_10px_rgba(31,58,110,0.05)] transition hover:-translate-y-0.5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo/10 text-indigo">
          <KeyRound size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-indigo">
            Wallet &amp; keys
          </div>
          <div className="text-[11.5px] text-fg-soft">
            Export your private key
          </div>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2.5}
          className="shrink-0 text-fg-soft"
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              aria-hidden
              onClick={close}
              className="absolute inset-0 bg-indigo/70 backdrop-blur-sm"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Wallet and keys"
              className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[22px] bg-canvas shadow-[0_24px_70px_rgba(31,58,110,0.35)]"
            >
              <WalletDetails onBack={close} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
