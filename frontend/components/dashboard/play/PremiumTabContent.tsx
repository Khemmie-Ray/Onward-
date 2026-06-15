"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { formatUnits } from "viem";
import { passThresholdText, SCORING } from "@/lib/scoring";
import type { DailyCapMessage, PremiumStep } from "./type";

export function PremiumTabContent({
  capMessage,
  errorMessage,
  step,
  hasEnoughBalance,
  balance,
  stakeAmount,
  needsApproval,
  onStart,
  isVerified,
  onVerify,
}: {
  capMessage: DailyCapMessage;
  errorMessage: string | null;
  step: PremiumStep;
  hasEnoughBalance: boolean;
  balance: bigint;
  stakeAmount: bigint;
  needsApproval: boolean;
  onStart: () => void;
  isVerified: boolean;
  onVerify: () => void;
}) {
  if (!isVerified) {
    return (
      <div className="text-center py-2">
        <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-mustard/15">
          <Lock size={20} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[20px] font-bold text-indigo mb-2">
          Verify to play premium
        </h2>
        <p className="text-sm text-fg-soft mb-5">
          Premium rounds require a verified GoodID so your bonus pays
          directly to your wallet. Free rounds work without it.
        </p>
        <button
          onClick={onVerify}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo text-cream font-bold text-sm hover:bg-indigo/90 transition"
        >
          Verify with GoodID
          <ArrowRight size={14} strokeWidth={2.8} />
        </button>
      </div>
    );
  }

  if (capMessage) {
    return (
      <div className="text-center py-2">
        <Lock size={20} className="mx-auto text-fg-soft mb-3" />
        <h2 className="display text-[20px] font-bold text-indigo mb-2">
          Premium done for today
        </h2>
        <p className="text-sm text-fg-soft">{capMessage.message}</p>
      </div>
    );
  }

  const balanceDisplay = formatUnits(balance, 18);
  const stakeDisplay = formatUnits(stakeAmount, 18);
  const isWorking = step !== "idle";

  const idleLabel = needsApproval
    ? `Approve & stake ${stakeDisplay} G$`
    : `Stake ${stakeDisplay} G$ & play`;

  const workingLabel: Record<Exclude<PremiumStep, "idle">, string> = {
    init: "Initializing…",
    approving: "Approving G$ allowance…",
    staking: "Staking onchain…",
    starting: "Starting round…",
  };

  const buttonLabel = step === "idle" ? idleLabel : workingLabel[step];

  return (
    <div>
      <h2 className="display text-[22px] font-bold text-indigo mb-1">
        Premium round
      </h2>
      <p className="text-sm text-fg-soft mb-4">
        Stake {stakeDisplay} G$. Pass to get it back + {SCORING.premiumBonus}{" "}
        G$ bonus. Fail or quit and your stake refills the rewards pool.
      </p>
      <ul className="mb-4 space-y-2 text-sm text-fg-soft">
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>6 holes, very fast popups, hardest pace</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>Pass threshold: {passThresholdText("premium")}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-mustard font-bold mt-0.5">→</span>
          <span>
            Win: {stakeDisplay} G$ refund + {SCORING.premiumBonus} G$ bonus
          </span>
        </li>
      </ul>

      <div className="mb-4 flex justify-between text-xs text-fg-soft px-1">
        <span>Your balance</span>
        <span className="font-bold tabular-nums text-indigo">
          {parseFloat(balanceDisplay).toLocaleString()} G$
        </span>
      </div>

      {step !== "idle" && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-mustard/10 border border-mustard/30">
          <div className="flex items-center gap-2 text-sm text-indigo font-semibold">
            <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
            {workingLabel[step]}
          </div>
          <div className="mt-2 flex gap-1">
            <StepDot done={step !== "init"} active={step === "init"} />
            <StepDot
              done={step === "staking" || step === "starting"}
              active={step === "approving"}
            />
            <StepDot done={step === "starting"} active={step === "staking"} />
            <StepDot done={false} active={step === "starting"} />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
          {errorMessage}
        </div>
      )}

      {!hasEnoughBalance && !isWorking ? (
        <div className="text-center">
          <div className="mb-3 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
            You need at least {stakeDisplay} G$ to play premium.
          </div>
        </div>
      ) : (
        <button
          onClick={onStart}
          disabled={isWorking || !hasEnoughBalance}
          className="w-full py-4 rounded-xl bg-mustard text-indigo font-bold text-base disabled:bg-mustard/40 disabled:cursor-not-allowed hover:bg-mustard/90 transition"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

function StepDot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <div
      className={`flex-1 h-1 rounded-full transition-colors ${
        done ? "bg-mustard" : active ? "bg-mustard/60" : "bg-mustard/20"
      }`}
    />
  );
}