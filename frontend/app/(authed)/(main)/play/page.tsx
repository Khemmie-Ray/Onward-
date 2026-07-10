"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { type Address } from "viem";

import { PreRoundBriefing } from "@/components/dashboard/play/PreRoundBriefing";
import { WhackAScam } from "@/components/dashboard/play/WhackAScamGame";
import { EndRoundModal } from "@/components/dashboard/play/EndRoundModal";
import { PlayLeftPanel } from "@/components/dashboard/play/PlayLeftPanel";
import { PlayStage } from "@/components/dashboard/play/PlayStage";
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
  const { address } = useConnection();
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

  const passed = submitData?.passed ?? null;
  const txPending = passed === true && !submitData?.onchain?.rewardTxHash;

  return (
    <div className="px-4 py-2 w-full bg-canvas">
      <div className="flex justify-between lg:flex-row md:flex-row flex-col gap-6">
        <aside className="order-2 lg:order-1 lg:w-[48%] md:w-[48%] w-full">
          <PlayLeftPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stakeAmount={stakeAmount}
          />
        </aside>

        <main className="order-1 lg:order-2 lg:w-[48%] md:w-[48%] w-full">
          {phase === "tab-select" && (
            <PlayStage
              activeTab={activeTab}
              freeStep={freeStep}
              freeCapMessage={freeCapMessage}
              freeError={freeError}
              onStartFree={startFreeRound}
              onSwitchToPremium={() => setActiveTab("premium")}
              premiumStep={premiumStep}
              premiumCapMessage={premiumCapMessage}
              premiumError={premiumError}
              hasEnoughBalance={hasEnoughBalance}
              balance={balance}
              stakeAmount={stakeAmount}
              needsApproval={needsApproval}
              isVerified={isVerified}
              onStartPremium={startPremiumRound}
              onVerify={startVerifying}
            />
          )}

          {phase === "briefing" && preview && (
            <div className="rounded-[16px] bg-paper p-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)] py-10">
              <PreRoundBriefing
                familyLabel={preview.family_label}
                familyDescription={preview.family_description}
                exemplar={preview.exemplar}
                scamIcon={preview.exemplar_icon}
                onReady={handleStartPlay}
                isStarting={isBeginning}
              />
            </div>
          )}

          {phase === "playing" && preview && roundId && (
            <div className="rounded-[16px] bg-paper p-4 shadow-[0_2px_8px_rgba(31,58,110,0.05)] py-10 flex items-center justify-center">
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
          )}

          {phase === "ended" && preview && result && (
            <div className="rounded-[16px] bg-paper p-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)] py-10">
              <EndRoundModal
                result={result}
                passed={passed}
                mode={preview.mode}
                familyLabel={preview.family_label}
                familyDescription={preview.family_description}
                exemplar={preview.exemplar}
                rewardAmount={submitData?.reward_g_amount ?? 0}
                pointsAwarded={submitData?.points_awarded ?? 0}
                newPointsBalance={submitData?.new_points_balance ?? null}
                levelBefore={submitData?.level_before ?? 0}
                levelAfter={submitData?.level_after ?? 0}
                txPending={txPending}
                txHash={submitData?.onchain?.rewardTxHash ?? null}
                onPlayAgain={resetToTabSelect}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
