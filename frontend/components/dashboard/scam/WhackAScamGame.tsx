"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Trophy } from "lucide-react";
import { Hole, type HoleState } from "./Hole";
import type { WhackIcon } from "@/lib/scam/whackIcon";

const ROUND_SECONDS = 60;
const SCAM_RATIO = 0.6;
const MAX_HOLES = 6;

export type WhackResult = {
  score: number;
  correctWhacks: number;
  wrongWhacks: number;
  missedScams: number;
  totalScams: number;
};

type Props = {
  onComplete: (result: WhackResult) => void;
  boardProgression?: number[];
  popupDurationMs?: number;
  baseSpawnDelay?: number;
  spawnJitter?: number;
  scamIcon: WhackIcon;
  legitIcon: WhackIcon;
};

export function WhackAScamGame({
  onComplete,
  boardProgression = [6],
  popupDurationMs = 2000,
  baseSpawnDelay = 400,
  spawnJitter = 250,
  scamIcon,
  legitIcon,
}: Props) {
  // ─── Reactive state ──────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [holes, setHoles] = useState<(HoleState | null)[]>(() =>
    Array(MAX_HOLES).fill(null)
  );
  const [activeHoleCount, setActiveHoleCount] = useState(
    boardProgression[0] ?? 6
  );

  // ─── Refs ────────────────────────────────────────────────
  const secondsLeftRef = useRef(ROUND_SECONDS);
  const activeHoleCountRef = useRef(boardProgression[0] ?? 6);
  const finishedRef = useRef(false);
  const lastSpawnAtRef = useRef<number[]>(Array(MAX_HOLES).fill(0));
  const onCompleteRef = useRef(onComplete);
  const holesRef = useRef<(HoleState | null)[]>(Array(MAX_HOLES).fill(null));

  const statsRef = useRef({
    correctWhacks: 0,
    wrongWhacks: 0,
    spawnedScams: 0,
    spawnedLegits: 0,
    whackedIds: new Set<number>(),
  });

  const stageTransitionsRef = useRef<{ atSecond: number; holes: number }[]>(
    computeStageTransitions(boardProgression)
  );

  // ─── Sync refs with state ───────────────────────────────
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    holesRef.current = holes;
  }, [holes]);

  // ─── finishGame ─────────────────────────────────────────
  const finishGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const s = statsRef.current;
    const missedScams = Math.max(0, s.spawnedScams - s.correctWhacks);

    onCompleteRef.current({
      score: Math.max(0, s.correctWhacks - s.wrongWhacks),
      correctWhacks: s.correctWhacks,
      wrongWhacks: s.wrongWhacks,
      missedScams,
      totalScams: s.spawnedScams,
    });
  }, []);

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      secondsLeftRef.current -= 1;
      setSecondsLeft(secondsLeftRef.current);

      for (const stage of stageTransitionsRef.current) {
        if (secondsLeftRef.current === stage.atSecond - 1) {
          activeHoleCountRef.current = stage.holes;
          setActiveHoleCount(stage.holes);
        }
      }

      if (secondsLeftRef.current <= 0) {
        clearInterval(tick);
        finishGame();
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [finishGame]);

  useEffect(() => {
    let spawnTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const attemptSpawn = () => {
      if (cancelled || secondsLeftRef.current <= 0) return;

      const prev = holesRef.current;
      const activeIndexes = Array.from(
        { length: activeHoleCountRef.current },
        (_, i) => i
      );
      const emptyIndexes = activeIndexes.filter((i) => prev[i] === null);
      if (emptyIndexes.length === 0) return;

      const now = performance.now();
      const weights = emptyIndexes.map((i) =>
        Math.max(1, now - lastSpawnAtRef.current[i])
      );
      const total = weights.reduce((a, b) => a + b, 0);
      let pick = Math.random() * total;
      let holeIdx = emptyIndexes[0];
      for (let i = 0; i < emptyIndexes.length; i++) {
        pick -= weights[i];
        if (pick <= 0) {
          holeIdx = emptyIndexes[i];
          break;
        }
      }

      const isScam = Math.random() < SCAM_RATIO;
      const icon = isScam ? scamIcon : legitIcon;

      lastSpawnAtRef.current[holeIdx] = now;
      if (isScam) statsRef.current.spawnedScams++;
      else statsRef.current.spawnedLegits++;

      const newHoleState: HoleState = {
        id: Date.now() + Math.random(),
        icon,
        isScam,
        appearedAt: performance.now(),
        durationMs: popupDurationMs,
      };

      setHoles((p) => {
        if (p[holeIdx] !== null) return p;
        const next = [...p];
        next[holeIdx] = newHoleState;
        return next;
      });
    };

    const scheduleNextSpawn = () => {
      if (cancelled) return;
      const jitter = Math.random() * spawnJitter;
      const delay = baseSpawnDelay + jitter;

      spawnTimeout = setTimeout(() => {
        if (cancelled || secondsLeftRef.current <= 0) return;
        attemptSpawn();
        scheduleNextSpawn();
      }, delay);
    };

    scheduleNextSpawn();

    return () => {
      cancelled = true;
      if (spawnTimeout) clearTimeout(spawnTimeout);
    };
  }, [
    boardProgression,
    popupDurationMs,
    baseSpawnDelay,
    spawnJitter,
    scamIcon,
    legitIcon,
  ]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = performance.now();
      setHoles((prev) => {
        let changed = false;
        const next = prev.map((h) => {
          if (h && now - h.appearedAt > h.durationMs) {
            changed = true;
            return null;
          }
          return h;
        });
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  const handleWhack = useCallback((holeIdx: number, isScam: boolean) => {
    setHoles((prev) => {
      const hole = prev[holeIdx];
      if (!hole?.icon) return prev;
      if (statsRef.current.whackedIds.has(hole.id)) return prev;

      statsRef.current.whackedIds.add(hole.id);

      if (isScam) {
        statsRef.current.correctWhacks++;
        setScore((s) => s + 1);
      } else {
        statsRef.current.wrongWhacks++;
        setScore((s) => Math.max(0, s - 1));
      }

      setTimeout(() => {
        setHoles((p) => {
          if (p[holeIdx]?.id !== hole.id) return p;
          const next = [...p];
          next[holeIdx] = null;
          return next;
        });
      }, 250);

      return prev;
    });
  }, []);

  const gridCols =
    activeHoleCount <= 2
      ? "grid-cols-2"
      : activeHoleCount <= 4
      ? "grid-cols-2"
      : "grid-cols-3";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-between mb-6 px-2 max-w-[420px]">
        <div className="flex items-center gap-2">
          <Clock size={16} strokeWidth={2.5} className="text-terracotta" />
          <span className="display text-[24px] font-bold tabular-nums text-indigo">
            {secondsLeft}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy size={16} strokeWidth={2.5} className="text-mustard" />
          <span className="display text-[24px] font-bold tabular-nums text-indigo">
            {score}
          </span>
        </div>
      </div>

      <div
        className={`grid ${gridCols} gap-4 p-6 rounded-[24px] bg-aubergine/95 shadow-[0_12px_32px_rgba(91,46,92,0.30)]`}
      >
        {Array.from({ length: activeHoleCount }).map((_, idx) => (
          <Hole
            key={idx}
            state={holes[idx]}
            onWhack={(isScam) => handleWhack(idx, isScam)}
            size={activeHoleCount === 6 ? 96 : 110}
          />
        ))}
      </div>
    </div>
  );
}

function computeStageTransitions(
  progression: number[] | undefined
): { atSecond: number; holes: number }[] {
  if (!progression || progression.length <= 1) return [];
  if (progression.length === 2) {
    return [{ atSecond: 30, holes: progression[1] }];
  }
  return [
    { atSecond: 40, holes: progression[1] },
    { atSecond: 20, holes: progression[2] },
  ];
}