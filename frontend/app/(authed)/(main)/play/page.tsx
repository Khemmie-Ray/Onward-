"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { keccak256, toBytes, type Address } from "viem";

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
import { useCeloBalance } from "@/hooks/useCeloBalance";
import { useIdentityContext } from "@/contexts/IdentityContext";

type Phase = "tab-select" | "briefing" | "playing" | "ended";

const PENDING_KEY = "premium_pending_uuid";
const PENDING_LIST_KEY = "premium_pending_uuids";

function rememberPendingUuid(uuid: string) {
  sessionStorage.setItem(PENDING_KEY, uuid);
  let list: string[] = [];
  try {
    list = JSON.parse(sessionStorage.getItem(PENDING_LIST_KEY) ?? "[]");
  } catch {
    list = [];
  }
  if (!list.includes(uuid)) list.push(uuid);
  sessionStorage.setItem(PENDING_LIST_KEY, JSON.stringify(list.slice(-10)));
}

function getPendingUuids(): string[] {
  const list: string[] = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_LIST_KEY) ?? "[]");
    if (Array.isArray(parsed)) list.push(...parsed);
  } catch {
    // ignore malformed storage
  }
  const single = sessionStorage.getItem(PENDING_KEY);
  if (single && !list.includes(single)) list.push(single);
  return list;
}

function clearPendingUuid(uuid: string) {
  if (sessionStorage.getItem(PENDING_KEY) === uuid) {
    sessionStorage.removeItem(PENDING_KEY);
  }
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_LIST_KEY) ?? "[]");
    if (Array.isArray(parsed)) {
      sessionStorage.setItem(
        PENDING_LIST_KEY,
        JSON.stringify(parsed.filter((u: string) => u !== uuid)),
      );
    }
  } catch {
    // ignore malformed storage
  }
}

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

  const [resumeInfo, setResumeInfo] = useState<{
    resumable: boolean;
    round_id?: string;
    round_id_hash?: string;
    needsForfeit?: boolean;
    message?: string;
  } | null>(null);
  const [checkingResume, setCheckingResume] = useState(false);
  const [forfeiting, setForfeiting] = useState(false);

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

  useEffect(() => {
    if (activeTab !== "premium" || !address) return;
    let cancelled = false;
    (async () => {
      setCheckingResume(true);
      try {
        const res = await authFetch("/api/play/premium-resume", {
          method: "GET",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();

        if (data?.needsForfeit && data?.round_id_hash) {
          const onchainHash = String(data.round_id_hash).toLowerCase();
          const localMatch = getPendingUuids().find(
            (u) => keccak256(toBytes(u)).toLowerCase() === onchainHash,
          );
          if (localMatch) {
            if (!cancelled) {
              setResumeInfo({ resumable: true, round_id: localMatch });
            }
            return;
          }
        }

        if (!cancelled) setResumeInfo(data);
      } catch {
        // non-fatal: fall back to normal stake flow
      } finally {
        setCheckingResume(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, address, authFetch]);
  const { stakeAmount } = useStakeAmount(isPremiumTab);
  const { balance, refetch: refetchBalance } = useGDollarBalance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { allowance, refetch: refetchAllowance } = useStakeAllowance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { celoWei, refetch: refetchCelo } = useCeloBalance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { approve, stake, approveState, stakeState } = useWhackStake();

  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);
  
  const handledStakeTxRef = useRef<`0x${string}` | null>(null);

  const hasEnoughBalance = balance >= stakeAmount;
  const needsApproval = allowance < stakeAmount;
 
  const MIN_GAS_CELO_WEI = 10_000_000_000_000_000n; 
  const hasEnoughGas = celoWei >= MIN_GAS_CELO_WEI;

  const startPremiumRound = async () => {
    if (!address) return;
    if (premiumStep !== "idle") return;

    const freshCelo = await refetchCelo();
    const freshCeloWei = freshCelo?.data?.value ?? celoWei;
    if (freshCeloWei < MIN_GAS_CELO_WEI) {
      setPremiumError(
        "You need a small amount of CELO to cover the network fee for staking. Top up a little CELO, then try again.",
      );
      return;
    }

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
      rememberPendingUuid(initData.round_id);

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
    if (premiumStep !== "approving") return;

    if (approveState.isSuccess && pendingHash) {
      refetchAllowance();
      setPremiumStep("staking");
      stake(pendingHash);
      return;
    }

    // Error or rejection -> release the user instead of spinning forever.
    if (approveState.error) {
      const msg = approveState.errorMessage ?? "";
      setPremiumError(
        /user rejected|denied|rejected the request/i.test(msg)
          ? "You cancelled the approval. Tap to try again when you're ready."
          : `Approval failed: ${msg || "please try again"}. No stake was placed.`,
      );
      setPremiumStep("idle");
      approveState.reset();
    }
  }, [
    approveState.isSuccess,
    approveState.error,
    approveState.errorMessage,
    premiumStep,
    pendingHash,
    stake,
    refetchAllowance,
  ]);

  useEffect(() => {
    if (premiumStep !== "staking") return;

    if (stakeState.error) {
      const msg = stakeState.errorMessage ?? "";
      setPremiumError(
        /user rejected|denied|rejected the request/i.test(msg)
          ? "You cancelled the stake. Tap to try again when you're ready."
          : /insufficient|gas|funds|exceeds balance/i.test(msg)
            ? "The stake couldn't go through. This is usually not enough CELO for the network fee. Top up a little CELO and try again."
            : `Stake failed: ${msg || "please try again"}.`,
      );
      setPremiumStep("idle");
      stakeState.reset();
      return;
    }

    if (!stakeState.isSuccess || !stakeState.txHash) return;
    if (handledStakeTxRef.current === stakeState.txHash) return;
    handledStakeTxRef.current = stakeState.txHash;

    const pendingUuid = sessionStorage.getItem(PENDING_KEY);
    if (!pendingUuid) {
      setPremiumError("Lost track of pending round. Try again.");
      setPremiumStep("idle");
      return;
    }

    setPremiumStep("starting");
    refetchBalance();

    (async () => {
      let lastError = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const res = await authFetch("/api/play/start", {
            method: "POST",
            body: JSON.stringify({ mode: "premium", round_id: pendingUuid }),
          });
          if (res.ok) {
            const data: RoundPreview = await res.json();
            setPreview(data);
            setPhase("briefing");
            setPremiumStep("idle");
            clearPendingUuid(pendingUuid);
            return;
          }
          const d = await res.json().catch(() => ({}));

          if (res.status === 429) {
            setPremiumCapMessage({
              kind: "cap",
              message: d?.error ?? "All premium rounds used today.",
            });
            setPremiumStep("idle");
            return;
          }
          lastError = d?.error ?? `Status ${res.status}`;
        } catch (e) {
          lastError = e instanceof Error ? e.message : "Network error";
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      setPremiumError(
        `${lastError} Your stake is safe. Reopen the premium tab to resume this round.`,
      );
      setPremiumStep("idle");
    })();
  }, [
    stakeState.isSuccess,
    stakeState.txHash,
    stakeState.error,
    stakeState.errorMessage,
    premiumStep,
    authFetch,
    refetchBalance,
  ]);

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
          missed_scams: r.missedScams,
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

  const handleResumeStake = async () => {
    if (!resumeInfo?.round_id) return;
    setPremiumError(null);
    setPremiumStep("starting");
    try {
      const res = await authFetch("/api/play/start", {
        method: "POST",
        body: JSON.stringify({
          mode: "premium",
          round_id: resumeInfo.round_id,
        }),
      });
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        setPremiumCapMessage({
          kind: "cap",
          message: d?.error ?? "All premium rounds used today.",
        });
        setPremiumStep("idle");
        return;
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: RoundPreview = await res.json();
      setPreview(data);
      setPhase("briefing");
      setPremiumStep("idle");
      setResumeInfo(null);
      if (resumeInfo.round_id) clearPendingUuid(resumeInfo.round_id);
    } catch (e) {
      setPremiumError(
        e instanceof Error ? e.message : "Could not resume your staked round",
      );
      setPremiumStep("idle");
    }
  };

  const handleForfeitStake = async () => {
    const roundId = resumeInfo?.round_id;
    const roundIdHash = resumeInfo?.round_id_hash;
    if (!roundId && !roundIdHash) return;

    setPremiumError(null);
    setForfeiting(true);
    try {
      const res = await authFetch("/api/play/premium-recover", {
        method: "POST",
        body: JSON.stringify({
          round_id: roundId,
          round_id_hash: roundIdHash,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? `Status ${res.status}`);
      }
      setResumeInfo(null);
      refetchBalance();
    } catch (e) {
      setPremiumError(
        e instanceof Error ? e.message : "Could not recover the stake",
      );
    } finally {
      setForfeiting(false);
    }
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
              resumeInfo={resumeInfo}
              checkingResume={checkingResume}
              onResumeStake={handleResumeStake}
              onForfeitStake={handleForfeitStake}
              forfeiting={forfeiting}
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
                onClose={resetToTabSelect}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
