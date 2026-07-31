"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { formatUnits } from "viem";
import type { DailyCapMessage, PremiumStep } from "./type";

export function PremiumAction({
  step,
  capMessage,
  errorMessage,
  hasEnoughBalance,
  balance,
  stakeAmount,
  needsApproval,
  isVerified,
  onStart,
  onVerify,
  resumeInfo,
  checkingResume,
  onResumeStake,
  onForfeitStake,
}: {
  step: PremiumStep;
  capMessage: DailyCapMessage;
  errorMessage: string | null;
  hasEnoughBalance: boolean;
  balance: bigint;
  stakeAmount: bigint;
  needsApproval: boolean;
  isVerified: boolean;
  onStart: () => void;
  onVerify: () => void;
  resumeInfo: {
    resumable: boolean;
    round_id?: string;
    needsForfeit?: boolean;
    message?: string;
  } | null;
  checkingResume: boolean;
  onResumeStake: () => void;
  onForfeitStake: () => void;
}) {
  if (!isVerified) {
    return (
      <div className="text-center w-full">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-mustard/15">
          <Lock size={24} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[22px] font-bold text-indigo mb-2">
          Verify to play premium
        </h2>
        <p className="text-sm text-fg-soft mb-6 max-w-70 mx-auto">
          Premium rounds need a verified GoodID so your bonus and points pay
          directly to your wallet.
        </p>
        <button
          onClick={onVerify}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo text-cream font-bold text-sm hover:bg-indigo/90 transition w-full lg:w-[50%] md:w-[50%]"
        >
          Verify to play
          <ArrowRight size={14} strokeWidth={2.8} />
        </button>
      </div>
    );
  }

  if (capMessage) {
    return (
      <div className="text-center w-full">
        <Lock size={24} className="mx-auto text-fg-soft mb-4" />
        <h2 className="display text-[22px] font-bold text-indigo mb-2">
          Premium done for today
        </h2>
        <p className="text-sm text-fg-soft max-w-70 mx-auto">
          {capMessage.message}
        </p>
      </div>
    );
  }
  if (checkingResume) {
    return (
      <div className="text-center w-full py-6">
        <Loader2
          size={24}
          strokeWidth={2.5}
          className="mx-auto text-mustard animate-spin mb-3"
        />
        <p className="text-sm text-fg-soft">Checking for an active stake…</p>
      </div>
    );
  }

  if (resumeInfo?.resumable && resumeInfo.round_id) {
    const isWorkingResume = step !== "idle";
    return (
      <div className="w-full text-center">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-mustard/15">
          <ArrowRight size={24} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[22px] font-bold text-indigo mb-2">
          You have a staked round
        </h2>
        <p className="text-sm text-fg-soft mb-6 max-w-70 mx-auto">
          Your stake is locked in a round you haven&apos;t played yet. Jump back
          in and play it now.
        </p>
        {errorMessage && (
          <div className="w-full mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center">
            {errorMessage}
          </div>
        )}
        <button
          onClick={onResumeStake}
          disabled={isWorkingResume}
          className="w-full py-4 rounded-xl bg-mustard text-indigo font-bold text-base disabled:bg-mustard/40 disabled:cursor-not-allowed hover:bg-mustard/90 transition"
        >
          {isWorkingResume ? "Starting round…" : "Resume your staked round"}
        </button>
      </div>
    );
  }
  if (resumeInfo?.needsForfeit) {
    return (
      <div className="w-full text-center">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta/15">
          <Lock size={24} strokeWidth={2.5} className="text-terracotta" />
        </div>
        <h2 className="display text-[22px] font-bold text-indigo mb-2">
          Stuck stake found
        </h2>
        <p className="text-sm text-fg-soft mb-6 max-w-70 mx-auto">
          {resumeInfo.message ??
            "A previous stake didn't attach to a round. Recover it to release your funds."}
        </p>
        {errorMessage && (
          <div className="w-full mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center">
            {errorMessage}
          </div>
        )}
        <button
          onClick={onForfeitStake}
          className="w-full py-4 rounded-xl bg-terracotta text-paper font-bold text-base hover:bg-terracotta/90 transition"
        >
          Recover stuck stake
        </button>
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
    <div className="w-full">
      <h2 className="display text-[20px] font-bold text-indigo mb-2 text-center">
        Premium round
      </h2>
      <p className="text-[13px] text-fg-soft text-center max-w-65 mx-auto mb-4 leading-relaxed">
        Faster popups, harder pace. Higher stakes, higher rewards.
      </p>

      <div className="w-full mb-4 flex justify-between text-xs text-fg-soft px-1">
        <span>Your balance</span>
        <span className="font-bold tabular-nums text-indigo">
          {parseFloat(balanceDisplay).toLocaleString()} G$
        </span>
      </div>

      {step !== "idle" && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-mustard/10 border border-mustard/30">
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
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center">
          {errorMessage}
        </div>
      )}

      {!hasEnoughBalance && !isWorking ? (
        <div className="w-full text-center">
          <div className="px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
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
