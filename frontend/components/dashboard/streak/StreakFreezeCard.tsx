"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Snowflake, Loader2, Check } from "lucide-react";
import { formatUnits } from "viem";
import { useConnection } from "wagmi";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  useStreakProtection,
  useFreezePrice,
  useFreezesOwned,
  useClaimsAllowance,
} from "@/hooks/useStreakProtection";

export function StreakFreezeCard() {
  const authFetch = useAuthFetch();
  const { address: caipAddress } = useConnection();
  const address = caipAddress?.split(":").pop()?.toLowerCase() as
    | `0x${string}`
    | undefined;
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"idle" | "approving" | "buying">("idle");

  const toastId = useRef<string | number | null>(null);

  const { data: statusData } = useQuery<{ is_verified: boolean }>({
    queryKey: ["streak", "status", "verify"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const isVerified = statusData?.is_verified === true;

  const { freezePrice } = useFreezePrice();
  const { freezesOwned, refetch: refetchOwned } = useFreezesOwned(
    address,
    !!address,
  );
  const { allowance, refetch: refetchAllowance } = useClaimsAllowance(
    address,
    !!address,
  );
  const { approve, buyFreeze, approveState, freezeState } =
    useStreakProtection();

  const owned = Number(freezesOwned);
  const alreadyOwns = owned > 0;
  const priceDisabled = freezePrice === 0n; // freeze not enabled on-chain yet

  useEffect(() => {
    if (step !== "approving") return;
    if (approveState.isPending) {
      toastId.current = toast.loading("Approve the G$ spend in your wallet…", {
        id: toastId.current ?? undefined,
      });
    } else if (approveState.isConfirming) {
      toastId.current = toast.loading("Confirming approval…", {
        id: toastId.current ?? undefined,
      });
    }
  }, [step, approveState.isPending, approveState.isConfirming]);

  useEffect(() => {
    if (approveState.isSuccess && step === "approving") {
      refetchAllowance();
      setStep("buying");
      buyFreeze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveState.isSuccess, step]);

  useEffect(() => {
    if (step !== "buying") return;
    if (freezeState.isPending) {
      toastId.current = toast.loading("Confirm the freeze purchase…", {
        id: toastId.current ?? undefined,
      });
    } else if (freezeState.isConfirming) {
      toastId.current = toast.loading("Buying your freeze…", {
        id: toastId.current ?? undefined,
      });
    }
  }, [step, freezeState.isPending, freezeState.isConfirming]);

  useEffect(() => {
    if (freezeState.isSuccess && step === "buying") {
      refetchOwned();
      authFetch("/api/streak/freeze-armed", { method: "POST" }).catch(() => {});
      setStep("idle");
      setBusy(false);
      toast.success("Streak freeze active", {
        id: toastId.current ?? undefined,
        description: "A missed day won't break your streak now.",
      });
      toastId.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freezeState.isSuccess, step]);

  useEffect(() => {
    const err = approveState.error ?? freezeState.error;
    if (!err || step === "idle") return;
    const msg = approveState.errorMessage ?? freezeState.errorMessage ?? "";
    const rejected = /reject|denied|user rejected/i.test(msg);
    toast.error(rejected ? "Cancelled" : "Purchase failed", {
      id: toastId.current ?? undefined,
      description: rejected ? undefined : msg || "Please try again.",
    });
    toastId.current = null;
    setStep("idle");
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveState.error, freezeState.error]);

  const handleBuy = () => {
    if (alreadyOwns) return;
    setBusy(true);
    if (allowance < freezePrice) {
      setStep("approving");
      approve(freezePrice);
    } else {
      setStep("buying");
      buyFreeze();
    }
  };

  const priceLabel = priceDisabled ? "[price]" : formatUnits(freezePrice, 18);
  const label =
    step === "approving"
      ? "Approve G$…"
      : step === "buying"
        ? "Buying…"
        : priceDisabled
          ? "Coming soon"
          : `Buy a freeze · ${priceLabel} G$`;

  return (
    <div className="rounded-2xl bg-paper p-4 shadow-[0_2px_10px_rgba(31,58,110,0.05)]">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aubergine-tint text-aubergine">
          <Snowflake size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-indigo">Freeze streak</div>
          <div className="text-[11.5px] text-fg-soft">
            You own {owned} freeze{owned === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <p className="mb-3 text-[12px] leading-snug text-fg-soft">
        Buy ahead. A freeze covers one missed day so your streak stays alive.
      </p>

      {alreadyOwns ? (
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-forest/10 py-2.5 text-[12.5px] font-bold text-forest">
          <Check size={14} strokeWidth={3} /> Freeze owned
        </div>
      ) : !isVerified ? (
        <div className="rounded-full bg-canvas-warm py-2.5 text-center text-[12px] font-semibold text-fg-soft">
          Verify to buy a freeze
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={busy || priceDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-indigo py-2.5 text-[12.5px] font-bold text-indigo transition hover:bg-indigo hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={14} strokeWidth={2.8} className="animate-spin" />
          ) : (
            label
          )}
        </button>
      )}
    </div>
  );
}
