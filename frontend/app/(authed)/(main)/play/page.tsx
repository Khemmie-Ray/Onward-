"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, Zap, Trophy } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { formatUnits, type Address } from "viem";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreRoundBriefing } from "@/components/dashboard/scam/PreRoundBriefing";
import {
  WhackAScamGame,
  type WhackResult,
  type DisplayItem,
} from "@/components/dashboard/scam/WhackAScamGame";
import { EndRoundModal } from "@/components/dashboard/scam/EndRoundModal";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  useWhackStake,
  useStakeAmount,
  useStakeAllowance,
  useGDollarBalance,
} from "@/hooks/useWhackState";
import { useIdentityContext } from "@/contexts/IdentityContext";
import type { WhackIcon } from "@/lib/scam/whackIcon";
import { passThresholdText, rewardText, SCORING } from "@/lib/scoring";

type Mode = "free" | "premium";
type Phase = "tab-select" | "briefing" | "playing" | "ended";
type FreeStep = "idle" | "starting";
type PremiumStep = "idle" | "init" | "approving" | "staking" | "starting";

type RoundPreview = {
  preview_id: string;
  mode: Mode;
  family_label: string;
  family_description: string;
  exemplar: {
    kind: string;
    content: Record<string, unknown>;
    teaching: string;
  };
  exemplar_icon: WhackIcon;
  display_items: DisplayItem[];
  popup_duration_ms: number;
  total_seconds: number;
  board_progression: number[];
  base_spawn_delay: number;
  spawn_jitter: number;
};

type SubmitResponse = {
  mode: Mode;
  passed: boolean;
  reward_g_amount: number;
  level_before: number;
  level_after: number;
  precision_percent: number;
  threshold: { minPrecisionPercent: number; minCorrect: number };
  onchain: {
    rewardTxHash: string | null;
    stakeResolveTxHash: string | null;
    onchainError: string | null;
  };
};

type DailyCapMessage = { kind: "cap"; message: string } | null;

export default function PlayPage() {
  const authFetch = useAuthFetch();
  const { address } = useAppKitAccount();
  const { isVerified, startVerifying } = useIdentityContext();

  const [activeTab, setActiveTab] = useState<Mode>("free");
  const [phase, setPhase] = useState<Phase>("tab-select");

  const [freeStep, setFreeStep] = useState<FreeStep>("idle");
  const [premiumStep, setPremiumStep] = useState<PremiumStep>("idle");

  const [preview, setPreview] = useState<RoundPreview | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [result, setResult] = useState<WhackResult | null>(null);
  const [submitData, setSubmitData] = useState<SubmitResponse | null>(null);

  const [freeCapMessage, setFreeCapMessage] = useState<DailyCapMessage>(null);
  const [premiumCapMessage, setPremiumCapMessage] =
    useState<DailyCapMessage>(null);
  const [freeError, setFreeError] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  const resetToTabSelect = useCallback(() => {
    setPhase("tab-select");
    setPreview(null);
    setRoundId(null);
    setResult(null);
    setSubmitData(null);
    setFreeError(null);
    setPremiumError(null);
    setFreeStep("idle");
    setPremiumStep("idle");
  }, []);

  const startFreeRound = async () => {
    setFreeError(null);
    setFreeCapMessage(null);
    setFreeStep("starting");

    try {
      const res = await authFetch("/api/play/start", {
        method: "POST",
        body: JSON.stringify({ mode: "free" }),
      });
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        setFreeCapMessage({
          kind: "cap",
          message: d?.error ?? "Today's free round is done.",
        });
        setFreeStep("idle");
        return;
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: RoundPreview = await res.json();
      setPreview(data);
      setPhase("briefing");
      setFreeStep("idle");
    } catch (e) {
      setFreeError(e instanceof Error ? e.message : "Failed to load round");
      setFreeStep("idle");
    }
  };

  const isPremiumTab = activeTab === "premium";
  const { stakeAmount } = useStakeAmount(isPremiumTab);
  const { balance, refetch: refetchBalance } = useGDollarBalance(
    address as Address | undefined,
    isPremiumTab
  );
  const { allowance, refetch: refetchAllowance } = useStakeAllowance(
    address as Address | undefined,
    isPremiumTab
  );
  const { approve, stake, approveState, stakeState } = useWhackStake();

  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);

  const hasEnoughBalance = balance >= stakeAmount;
  const needsApproval = allowance < stakeAmount;

  const startPremiumRound = async () => {
    if (!address) return;
    setPremiumError(null);
    setPremiumCapMessage(null);
    setPremiumStep("init");

    try {
      const initRes = await authFetch("/api/play/stake-init", { method: "POST" });
      if (initRes.status === 429) {
        const d = await initRes.json().catch(() => ({}));
        setPremiumCapMessage({
          kind: "cap",
          message: d?.error ?? "All 5 premium rounds used today.",
        });
        setPremiumStep("idle");
        return;
      }
      if (!initRes.ok) throw new Error("Failed to initialize stake");
      const initData = (await initRes.json()) as {
        round_id: string;
        round_id_hash: `0x${string}`;
      };
      setPendingHash(initData.round_id_hash);
      sessionStorage.setItem("premium_pending_uuid", initData.round_id);

      if (needsApproval) {
        setPremiumStep("approving");
        approve(stakeAmount);
      } else {
        setPremiumStep("staking");
        stake(initData.round_id_hash);
      }
    } catch (e) {
      setPremiumError(
        e instanceof Error ? e.message : "Premium round init failed"
      );
      setPremiumStep("idle");
    }
  };

  useEffect(() => {
    if (premiumStep === "approving" && approveState.isSuccess && pendingHash) {
      refetchAllowance();
      setPremiumStep("staking");
      stake(pendingHash);
    }
  }, [
    approveState.isSuccess,
    premiumStep,
    pendingHash,
    stake,
    refetchAllowance,
  ]);

  useEffect(() => {
    if (premiumStep !== "staking" || !stakeState.isSuccess) return;

    const pendingUuid = sessionStorage.getItem("premium_pending_uuid");
    if (!pendingUuid) {
      setPremiumError("Lost track of pending round. Try again.");
      setPremiumStep("idle");
      return;
    }

    setPremiumStep("starting");
    refetchBalance();

    (async () => {
      try {
        const res = await authFetch("/api/play/start", {
          method: "POST",
          body: JSON.stringify({ mode: "premium", round_id: pendingUuid }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: RoundPreview = await res.json();
        setPreview(data);
        setPhase("briefing");
        setPremiumStep("idle");
        sessionStorage.removeItem("premium_pending_uuid");
      } catch (e) {
        setPremiumError(
          e instanceof Error
            ? e.message
            : "Stake confirmed but round failed to start"
        );
        setPremiumStep("idle");
      }
    })();
  }, [stakeState.isSuccess, premiumStep, authFetch, refetchBalance]);

  const [isBeginning, setIsBeginning] = useState(false);

  const handleStartPlay = async () => {
    if (!preview) return;
    setIsBeginning(true);
    try {
      const res = await authFetch("/api/play/begin", {
        method: "POST",
        body: JSON.stringify({ preview_id: preview.preview_id }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as { round_id: string };
      setRoundId(data.round_id);
      setPhase("playing");
      setIsBeginning(false);
    } catch (e) {
      if (preview.mode === "free") {
        setFreeError(e instanceof Error ? e.message : "Failed to start round");
      } else {
        setPremiumError(
          e instanceof Error ? e.message : "Failed to start round"
        );
      }
      setIsBeginning(false);
      setPhase("tab-select");
    }
  };

  const handleGameComplete = async (r: WhackResult) => {
    setResult(r);
    setPhase("ended");
    if (!roundId) return;

    try {
      const res = await authFetch("/api/play/submit", {
        method: "POST",
        body: JSON.stringify({
          round_id: roundId,
          whacks: r.whacks, // pattern_ids — server grades from its own stored items
          spawned_scams: r.spawnedScams, // display only, capped server-side
        }),
      });
      if (res.ok) {
        const data: SubmitResponse = await res.json();
        setSubmitData(data);
      }
    } catch (e) {
      console.error("[play submit failed]", e);
    }
  };

  if (phase === "briefing" && preview) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col lg:w-[40%] md:w-[40%] w-full mx-auto">
        <header className="flex items-center justify-between px-6 py-5 w-full ">
          <button
            onClick={resetToTabSelect}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-fg-soft shadow-[0_4px_12px_rgba(31,58,110,0.06)] hover:bg-canvas-warm hover:text-indigo transition"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft border p-3 rounded-full border-fg">
            <p>
              {preview.mode === "premium" ? "Premium Round" : "Daily Round"}
            </p>
          </div>
        </header>
        <div className="flex items-center justify-center px-4 py-6">
          <PreRoundBriefing
            familyLabel={preview.family_label}
            familyDescription={preview.family_description}
            exemplar={preview.exemplar}
            scamIcon={preview.exemplar_icon}
            onReady={handleStartPlay}
            isStarting={isBeginning}
          />
        </div>
      </div>
    );
  }

  if (phase === "playing" && preview) {
    return (
      <div className="bg-canvas flex items-center justify-center px-4">
        <WhackAScamGame
          items={preview.display_items}
          onComplete={handleGameComplete}
          boardProgression={preview.board_progression}
          popupDurationMs={preview.popup_duration_ms}
          baseSpawnDelay={preview.base_spawn_delay}
          spawnJitter={preview.spawn_jitter}
        />
      </div>
    );
  }

  if (phase === "ended" && preview && result) {
    const passed = submitData?.passed ?? null;
    const txPending = passed === true && !submitData?.onchain?.rewardTxHash;

    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <EndRoundModal
          result={result}
          passed={passed}
          mode={preview.mode}
          familyLabel={preview.family_label}
          familyDescription={preview.family_description}
          exemplar={preview.exemplar}
          rewardAmount={submitData?.reward_g_amount ?? 0}
          levelBefore={submitData?.level_before ?? 0}
          levelAfter={submitData?.level_after ?? 0}
          txPending={txPending}
          txHash={submitData?.onchain?.rewardTxHash ?? null}
          onPlayAgain={resetToTabSelect}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 max-w-[500px] mx-auto w-full">
        <Link
          href="/overview"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-fg-soft shadow-[0_4px_12px_rgba(31,58,110,0.06)] hover:bg-canvas-warm hover:text-indigo transition"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </Link>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft">
          Whack-a-Scam
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-[460px] rounded-3xl bg-paper p-5 sm:p-6 shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as Mode)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 mb-5 bg-canvas-warm p-1 rounded-xl">
              <TabsTrigger
                value="free"
                className="data-[state=active]:bg-indigo data-[state=active]:text-cream rounded-lg font-bold text-sm"
              >
                Free
              </TabsTrigger>
              <TabsTrigger
                value="premium"
                className="data-[state=active]:bg-mustard data-[state=active]:text-indigo rounded-lg font-bold text-sm gap-1.5"
              >
                <Zap size={13} strokeWidth={2.5} />
                Premium
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free" className="mt-0">
              <FreeTabContent
                capMessage={freeCapMessage}
                errorMessage={freeError}
                step={freeStep}
                onStart={startFreeRound}
                onSwitchToPremium={() => setActiveTab("premium")}
              />
            </TabsContent>

            <TabsContent value="premium" className="mt-0">
              <PremiumTabContent
                capMessage={premiumCapMessage}
                errorMessage={premiumError}
                step={premiumStep}
                hasEnoughBalance={hasEnoughBalance}
                balance={balance}
                stakeAmount={stakeAmount}
                needsApproval={needsApproval}
                onStart={startPremiumRound}
                isVerified={isVerified}
                onVerify={startVerifying}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FreeTabContent({
  capMessage,
  errorMessage,
  step,
  onStart,
  onSwitchToPremium,
}: {
  capMessage: DailyCapMessage;
  errorMessage: string | null;
  step: FreeStep;
  onStart: () => void;
  onSwitchToPremium: () => void;
}) {
  const isLoading = step === "starting";

  if (capMessage) {
    return (
      <div className="text-center py-2">
        <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-mustard/15">
          <Trophy size={20} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[20px] font-bold text-indigo mb-2">
          Day complete
        </h2>
        <p className="text-sm text-fg-soft mb-5">{capMessage.message}</p>
        <button
          onClick={onSwitchToPremium}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-mustard text-indigo font-bold text-sm hover:bg-mustard/90 transition"
        >
          <Zap size={14} strokeWidth={2.5} />
          Play Premium instead
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="display text-[22px] font-bold text-indigo mb-2">
        Today&apos;s free round
      </h2>
      <p className="text-sm text-fg-soft mb-4">
        60 seconds. One round per UTC day. Pass to earn {rewardText("free")} and add to your streak.
      </p>
      <ul className="mb-5 space-y-2 text-sm text-fg-soft">
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Pass threshold: {passThresholdText("free")}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Reward: {rewardText("free")} + streak day</span>
        </li>
      </ul>

      {errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
          {errorMessage}
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-indigo text-cream font-bold text-base disabled:bg-indigo/50 disabled:cursor-not-allowed hover:bg-indigo/90 transition flex items-center justify-center gap-2"
      >
        {isLoading && (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
        )}
        {isLoading ? "Preparing your round…" : "Play today's round"}
      </button>
    </div>
  );
}

function PremiumTabContent({
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
        Stake {stakeDisplay} G$. Pass to get it back + {SCORING.premiumBonus} G$ bonus. Fail and your
        stake refills the rewards pool.
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
          <span>Win: {stakeDisplay} G$ refund + {SCORING.premiumBonus} G$ bonus</span>
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