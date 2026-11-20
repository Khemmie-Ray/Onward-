"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useConnection } from "wagmi";
import { keccak256, toBytes, type Address } from "viem";

import { PreRoundBriefing } from "@/components/dashboard/play/PreRoundBriefing";
import { WhackAScam } from "@/components/dashboard/play/WhackAScamGame";
import { EndRoundModal } from "@/components/dashboard/play/EndRoundModal";
import { GameStatsHeader } from "@/components/dashboard/play/GameStatsHeader";
import { BoardShell } from "@/components/dashboard/play/BoardShell";
import { Hole } from "@/components/dashboard/play/Hole";
import { AbandonConfirmModal } from "@/components/dashboard/play/AbandonConfirmModal";
import { SCORING } from "@/lib/scoring";
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

type Phase = "intro" | "playing" | "ended";

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
  const router = useRouter();
  const { address } = useConnection();
  const { isVerified, startVerifying } = useIdentityContext();

  const [activeTab] = useState<Mode>("free");
  const [phase, setPhase] = useState<Phase>("intro");
  const [showQuit, setShowQuit] = useState(false);
  const [endDismissed, setEndDismissed] = useState(false);
  const [freeSpent, setFreeSpent] = useState(false);

  const { data: today } = useQuery<{
    family_label: string;
    family_description: string;
    difficulty: number;
    exemplar: { kind: string; content: Record<string, unknown>; teaching: string };
    free_available: boolean;
  }>({
    queryKey: ["play", "today-pattern"],
    queryFn: async () => {
      const res = await authFetch("/api/play/today");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const freeAvailable = (today?.free_available ?? true) && !freeSpent;

  const [freeStep, setFreeStep] = useState<FreeStep>("idle");
  const [premiumStep, setPremiumStep] = useState<PremiumStep>("idle");
  const [isBeginning, setIsBeginning] = useState(false);

  const [preview, setPreview] = useState<RoundPreview | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [result, setResult] = useState<WhackResult | null>(null);
  const queryClient = useQueryClient();
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
  const [, setCheckingResume] = useState(false);
  const [forfeiting, setForfeiting] = useState(false);

  const resetToTabSelect = useCallback(() => {
    setPhase("intro");
    setPreview(null);
    setRoundId(null);
    setResult(null);
    setSubmitData(null);
    setFreeError(null);
    setPremiumError(null);
    setFreeStep("idle");
    setPremiumStep("idle");
    setEndDismissed(false);
  }, []);

  const goBackToPlay = useCallback(() => {
    const inFlight = phase === "playing";
    const isPremiumRound =
      preview?.mode === "premium" || (!preview && activeTab === "premium");

    if (inFlight && isPremiumRound) {
      const ok = window.confirm(
        "You have a premium round in progress. Leaving now abandons this staked round. Go back anyway?",
      );
      if (!ok) return;
    }
    router.push("/play");
  }, [phase, preview, activeTab, router]);

  const beginPlay = useCallback(
    async (previewData: RoundPreview) => {
      setIsBeginning(true);
      try {
        const res = await authFetch("/api/play/begin", {
          method: "POST",
          body: JSON.stringify({ preview_id: previewData.preview_id }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = (await res.json()) as { round_id: string };
        setPreview(previewData);
        setRoundId(data.round_id);
        setPhase("playing");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to start round";
        if (previewData.mode === "free") setFreeError(msg);
        else setPremiumError(msg);
        setPhase("intro");
      } finally {
        setIsBeginning(false);
      }
    },
    [authFetch],
  );

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
        setFreeSpent(true);
        setFreeCapMessage({
          kind: "cap",
          message: d?.error ?? "Today's free round is done.",
        });
        setFreeStep("idle");
        return;
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: RoundPreview = await res.json();
      setFreeStep("idle");
      await beginPlay(data);
    } catch (e) {
      setFreeError(e instanceof Error ? e.message : "Failed to load round");
      setFreeStep("idle");
    }
  };

  const isPremiumTab = activeTab === "premium" || !freeAvailable;

  useEffect(() => {
    if (!isPremiumTab || !address) return;
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
  }, [isPremiumTab, address, authFetch]);
  const { stakeAmount } = useStakeAmount(isPremiumTab);
  const { refetch: refetchBalance } = useGDollarBalance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { allowance, refetch: refetchAllowance } = useStakeAllowance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { refetch: refetchCelo } = useCeloBalance(
    address as Address | undefined,
    isPremiumTab,
  );
  const { approve, stake, approveState, stakeState } = useWhackStake();

  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);

  const handledStakeTxRef = useRef<`0x${string}` | null>(null);

  const needsApproval = allowance < stakeAmount;

  const startPremiumRound = async () => {
    if (!address) return;
    if (premiumStep !== "idle") return;

    setPremiumStep("init");
    try {
      const gasRes = await authFetch("/api/gas/prepare", { method: "POST" });
      const gas = (await gasRes.json()) as { ready?: boolean; reason?: string };
      if (!gas?.ready) {
        setPremiumError(
          gas?.reason === "faucet_declined"
            ? "We couldn't top up the network fee for you right now (daily limit reached). Please try again later."
            : "We couldn't set up the small network fee needed to stake. Please try again in a moment.",
        );
        setPremiumStep("idle");
        return;
      }
    } catch {
      setPremiumError(
        "We couldn't set up the small network fee needed to stake. Please try again in a moment.",
      );
      setPremiumStep("idle");
      return;
    }
    await refetchCelo();

    setPremiumError(null);
    setPremiumCapMessage(null);

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
            setPremiumStep("idle");
            clearPendingUuid(pendingUuid);
            await beginPlay(data);
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
    beginPlay,
  ]);

  const handleIntroStart = () => {
    if (freeAvailable) {
      startFreeRound();
      return;
    }

    if (!isVerified) {
      startVerifying();
      return;
    }
    startPremiumRound();
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

        queryClient.invalidateQueries({ queryKey: ["me", "status"] });
        queryClient.invalidateQueries({ queryKey: ["play", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["modules"] });
        queryClient.invalidateQueries({ queryKey: ["play", "today-pattern"] });
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
      setPremiumStep("idle");
      setResumeInfo(null);
      if (resumeInfo.round_id) clearPendingUuid(resumeInfo.round_id);
      await beginPlay(data);
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

  const settleTxHash =
    submitData?.onchain?.rewardTxHash ??
    submitData?.onchain?.stakeResolveTxHash ??
    null;

  const txPending =
    passed === true && !settleTxHash && !submitData?.onchain?.onchainError;

  const roundMode: Mode = preview?.mode ?? activeTab;
  const threshold = SCORING[roundMode].minCorrect;
  const difficulty = preview?.difficulty ?? today?.difficulty ?? 1;
  const patternLabel =
    preview?.family_label ?? today?.family_label ?? "Whack-a-Scam";

  const starting =
    isBeginning || freeStep === "starting" || premiumStep !== "idle";
  const ctaLabel = freeAvailable
    ? "Got it, start the round"
    : !isVerified
      ? "Verify to play"
      : "Stake to play";
  const startError = freeError ?? premiumError;
  const capMessage = (freeCapMessage ?? premiumCapMessage)?.message ?? null;

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goBackToPlay}
            aria-label="Back to Play"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo shadow-[0_2px_8px_rgba(31,58,110,0.08)] transition hover:bg-canvas-warm"
          >
            <ArrowLeft size={16} strokeWidth={2.6} />
          </button>
          <h1 className="display text-[26px] font-bold tracking-[-0.015em] text-indigo">
            Whack-a-Scam
          </h1>
        </div>
        {phase === "playing" && (
          <button
            onClick={() => setShowQuit(true)}
            className="rounded-full border border-indigo/20 px-4 py-2 text-[13px] font-bold text-indigo transition hover:bg-canvas-warm"
          >
            Quit round
          </button>
        )}
      </div>
      {phase === "playing" && preview && roundId ? (
        <WhackAScam
          roundId={roundId}
          items={preview.display_items}
          onComplete={handleGameComplete}
          mode={preview.mode}
          patternLabel={patternLabel}
          difficulty={difficulty}
          boardProgression={preview.board_progression}
          popupDurationMs={preview.popup_duration_ms}
          baseSpawnDelay={preview.base_spawn_delay}
          spawnJitter={preview.spawn_jitter}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <GameStatsHeader
            secondsLeft={phase === "ended" ? 0 : 60}
            totalSeconds={60}
            status={phase === "ended" ? "Round over" : "Starts on tap"}
            caught={phase === "ended" ? (result?.correctWhacks ?? 0) : 0}
            threshold={threshold}
            totalScams={phase === "ended" ? (result?.totalScams ?? 0) : 0}
            points={phase === "ended" ? (result?.score ?? 0) : 0}
            wrong={phase === "ended" ? (result?.wrongWhacks ?? 0) : 0}
            escaped={phase === "ended" ? (result?.missedScams ?? 0) : 0}
          />

          <BoardShell
            patternLabel={patternLabel}
            difficulty={difficulty}
            dim={phase !== "playing"}
            overlay={
              phase === "intro" && today ? (
                resumeInfo?.resumable ? (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-forest">
                      Staked round waiting
                    </div>
                    <h2 className="display mt-1 text-[22px] font-bold leading-tight text-indigo">
                      Pick up where you left off
                    </h2>
                    <p className="mt-2 text-[13px] leading-snug text-fg-soft">
                      You already staked for a premium round. Resume it, or
                      forfeit the stake to start fresh.
                    </p>
                    <button
                      type="button"
                      onClick={handleResumeStake}
                      disabled={premiumStep !== "idle"}
                      className="mt-4 w-full rounded-full bg-forest py-3 text-[14px] font-bold text-paper transition hover:brightness-105 disabled:opacity-60"
                    >
                      {premiumStep !== "idle" ? "Resuming…" : "Resume staked round"}
                    </button>
                    <button
                      type="button"
                      onClick={handleForfeitStake}
                      disabled={forfeiting}
                      className="mt-2 w-full rounded-full border border-indigo/15 py-2.5 text-[13px] font-bold text-indigo transition hover:bg-canvas-warm disabled:opacity-60"
                    >
                      {forfeiting ? "Forfeiting…" : "Forfeit stake"}
                    </button>
                    {startError && (
                      <p className="mt-3 text-[12px] font-medium text-terracotta">
                        {startError}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <PreRoundBriefing
                      familyLabel={today.family_label}
                      familyDescription={today.family_description}
                      exemplar={today.exemplar}
                      onReady={handleIntroStart}
                      isStarting={starting}
                      ctaLabel={ctaLabel}
                    />
                    {!freeAvailable && (
                      <p className="mt-3 text-center text-[12px] font-medium text-fg-soft">
                        {capMessage ??
                          "Your free round today is used. Stake G$ to keep playing."}
                      </p>
                    )}
                    {startError && (
                      <p className="mt-3 text-[12px] font-medium text-terracotta">
                        {startError}
                      </p>
                    )}
                  </>
                )
              ) : phase === "ended" && preview && result && !endDismissed ? (
                <EndRoundModal
                  result={result}
                  passed={passed}
                  mode={preview.mode}
                  familyLabel={preview.family_label}
                  rewardAmount={submitData?.reward_g_amount ?? 0}
                  pointsAwarded={submitData?.points_awarded ?? 0}
                  txPending={txPending}
                  txHash={settleTxHash}
                  onSeeMissed={() => setEndDismissed(true)}
                  onPlayAgain={resetToTabSelect}
                />
              ) : undefined
            }
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] w-full">
                  <Hole state={null} onWhack={() => {}} />
                </div>
              ))}
            </div>
          </BoardShell>
        </div>
      )}

      {showQuit && (
        <AbandonConfirmModal
          onCancel={() => setShowQuit(false)}
          onConfirm={() => {
            setShowQuit(false);
            handleAbandon();
          }}
        />
      )}
    </div>
  );
}