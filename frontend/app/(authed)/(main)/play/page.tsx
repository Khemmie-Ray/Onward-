"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { type Address } from "viem";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreRoundBriefing } from "@/components/dashboard/play/PreRoundBriefing";
import { WhackAScam } from "@/components/dashboard/play/WhackAScamGame";
import { EndRoundModal } from "@/components/dashboard/play/EndRoundModal";
import { FreeTabContent } from "@/components/dashboard/play/FreeTabContent";
import { PremiumTabContent } from "@/components/dashboard/play/PremiumTabContent";
import type {
  Mode,
  FreeStep,
  PremiumStep,
  RoundPreview,
  SubmitResponse,
  WhackResult,
  DailyCapMessage,
} from "@/components/dashboard/play/type";

import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  useWhackStake,
  useStakeAmount,
  useStakeAllowance,
  useGDollarBalance,
} from "@/hooks/useWhackState";
import { useIdentityContext } from "@/contexts/IdentityContext";

type Phase = "tab-select" | "briefing" | "playing" | "ended";

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

  // ─── Free round flow ────────────────────────────────────
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

  // ─── Premium round flow ─────────────────────────────────
  const isPremiumTab = activeTab === "premium";
  const { stakeAmount } = useStakeAmount(isPremiumTab);
  const { balance, refetch: refetchBalance } = useGDollarBalance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { allowance, refetch: refetchAllowance } = useStakeAllowance(
    address as Address | undefined,
    isPremiumTab,
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
      const initRes = await authFetch("/api/play/stake-init", {
        method: "POST",
      });
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
        e instanceof Error ? e.message : "Premium round init failed",
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
            : "Stake confirmed but round failed to start",
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
          e instanceof Error ? e.message : "Failed to start round",
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
          whacks: r.whacks,
          spawned_scams: r.spawnedScams,
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

  const handleAbandon = async () => {
    if (!roundId) {
      resetToTabSelect();
      return;
    }
    try {
      await authFetch("/api/play/abandon", {
        method: "POST",
        body: JSON.stringify({ round_id: roundId }),
      });
    } catch (e) {
      console.error("[play abandon failed]", e);
    }
    resetToTabSelect();
  };

  if (phase === "briefing" && preview) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col lg:w-[40%] md:w-[40%] w-full mx-auto">
        <header className="flex items-center justify-between px-6 py-5 w-full">
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

  if (phase === "playing" && preview && roundId) {
    return (
      <div className="bg-canvas flex items-center justify-center px-4">
        <WhackAScam
          roundId={roundId}
          items={preview.display_items}
          onComplete={handleGameComplete}
          onAbandon={handleAbandon}
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
