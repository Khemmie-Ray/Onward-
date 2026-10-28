"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Hole } from "./Hole";
import { GameStatsHeader } from "./GameStatsHeader";
import { BoardShell } from "./BoardShell";
import { SCORING } from "@/lib/scoring";
import type { DisplayItem, HoleState, WhackResult, Mode } from "./type";

const ROUND_SECONDS = 60;
const MAX_HOLES = 6;

type Props = {
  roundId: string;
  items: DisplayItem[];
  onComplete: (result: WhackResult) => void;
  mode: Mode;
  patternLabel: string;
  difficulty?: number | null;
  boardProgression?: number[];
  popupDurationMs?: number;
  baseSpawnDelay?: number;
  spawnJitter?: number;
};

export function WhackAScam({
  items,
  onComplete,
  mode,
  patternLabel,
  difficulty,
  boardProgression = [6],
  popupDurationMs = 2000,
  baseSpawnDelay = 400,
  spawnJitter = 250,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  // Live display mirrors of the stat refs (refs stay the source of truth).
  const [caught, setCaught] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [escaped, setEscaped] = useState(0);
  // Scams that have appeared so far (the "featured total" the header counts
  // against). Mirrors statsRef.appearedScams for render.
  const [appeared, setAppeared] = useState(0);

  const [holes, setHoles] = useState<(HoleState | null)[]>(() =>
    Array(MAX_HOLES).fill(null),
  );
  const [activeHoleCount, setActiveHoleCount] = useState(
    boardProgression[0] ?? 6,
  );

  const threshold = SCORING[mode].minCorrect;

  const secondsLeftRef = useRef(ROUND_SECONDS);
  const activeHoleCountRef = useRef(boardProgression[0] ?? 6);
  const finishedRef = useRef(false);
  const lastSpawnAtRef = useRef<number[]>(Array(MAX_HOLES).fill(0));
  const onCompleteRef = useRef(onComplete);
  const holesRef = useRef<(HoleState | null)[]>(Array(MAX_HOLES).fill(null));
  const itemQueueRef = useRef<DisplayItem[]>([]);
  const itemCursorRef = useRef(0);

  const statsRef = useRef({
    correctWhacks: 0,
    wrongWhacks: 0,
    appearedScams: 0,
    spawnedLegits: 0,
    missedScams: 0,
    whackedInstanceIds: new Set<number>(),
    missedInstanceIds: new Set<number>(),
    whacks: [] as string[],
  });

  const stageTransitionsRef = useRef<{ atSecond: number; holes: number }[]>(
    computeStageTransitions(boardProgression),
  );

  useEffect(() => {
    itemQueueRef.current = [...items].sort(() => Math.random() - 0.5);
    itemCursorRef.current = 0;
  }, [items]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    holesRef.current = holes;
  }, [holes]);

  const finishGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const s = statsRef.current;

    for (const h of holesRef.current) {
      if (
        h &&
        h.isScam &&
        !s.whackedInstanceIds.has(h.id) &&
        !s.missedInstanceIds.has(h.id)
      ) {
        s.missedScams++;
        s.missedInstanceIds.add(h.id);
      }
    }
    const missed = s.missedScams;
    const appeared = s.correctWhacks + missed;

    onCompleteRef.current({
      score: Math.max(0, s.correctWhacks - s.wrongWhacks),
      correctWhacks: s.correctWhacks,
      wrongWhacks: s.wrongWhacks,
      missedScams: missed,
      totalScams: appeared,
      whacks: s.whacks,
      appearedScams: appeared,
    });
  }, []);

  // ─── Timer ──────────────────────────────────────────────
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

  // ─── Spawn loop ─────────────────────────────────────────
  useEffect(() => {
    let spawnTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const nextItem = (): DisplayItem | null => {
      const queue = itemQueueRef.current;
      if (queue.length === 0) return null;
      // Ran through the list before the round ended: reshuffle and loop so the
      // board keeps spawning for the full timer instead of going quiet. Harder
      // tiers spawn fast enough to exhaust the list ~10s early otherwise.
      if (itemCursorRef.current >= queue.length) {
        itemQueueRef.current = [...queue].sort(() => Math.random() - 0.5);
        itemCursorRef.current = 0;
      }
      const item = itemQueueRef.current[itemCursorRef.current];
      itemCursorRef.current++;
      return item;
    };

    const attemptSpawn = () => {
      if (cancelled || secondsLeftRef.current <= 0) return;

      const prev = holesRef.current;
      const activeIndexes = Array.from(
        { length: activeHoleCountRef.current },
        (_, i) => i,
      );
      const emptyIndexes = activeIndexes.filter((i) => prev[i] === null);
      if (emptyIndexes.length === 0) return;

      const now = performance.now();
      const weights = emptyIndexes.map((i) =>
        Math.max(1, now - lastSpawnAtRef.current[i]),
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

      const item = nextItem();
      if (!item) return;

      lastSpawnAtRef.current[holeIdx] = now;
      if (item.is_scam) {
        statsRef.current.appearedScams++;
        setAppeared(statsRef.current.appearedScams);
      } else {
        statsRef.current.spawnedLegits++;
      }

      const newHoleState: HoleState = {
        id: Date.now() + Math.random(),
        patternId: item.pattern_id,
        isScam: item.is_scam,
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
  }, [popupDurationMs, baseSpawnDelay, spawnJitter]);

  // ─── Cleanup expired holes ──────────────────────────────
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = performance.now();
      setHoles((prev) => {
        let changed = false;
        const next = prev.map((h) => {
          if (h && now - h.appearedAt > h.durationMs) {
            changed = true;
            if (
              h.isScam &&
              !statsRef.current.whackedInstanceIds.has(h.id) &&
              !statsRef.current.missedInstanceIds.has(h.id)
            ) {
              statsRef.current.missedScams++;
              statsRef.current.missedInstanceIds.add(h.id);
              setEscaped(statsRef.current.missedScams);
            }
            return null;
          }
          return h;
        });
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  const handleWhack = useCallback((holeIdx: number) => {
    setHoles((prev) => {
      const hole = prev[holeIdx];
      if (!hole) return prev;
      if (statsRef.current.whackedInstanceIds.has(hole.id)) return prev;

      statsRef.current.whackedInstanceIds.add(hole.id);
      statsRef.current.whacks.push(hole.patternId);

      if (hole.isScam) {
        statsRef.current.correctWhacks++;
        setCaught(statsRef.current.correctWhacks);
        setScore((s) => s + 1);
      } else {
        statsRef.current.wrongWhacks++;
        setWrong(statsRef.current.wrongWhacks);
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

  const gridCols = activeHoleCount <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="flex w-full flex-col gap-4">
      <GameStatsHeader
        secondsLeft={secondsLeft}
        totalSeconds={ROUND_SECONDS}
        status={secondsLeft > 0 ? "Keep going" : "Round over"}
        caught={caught}
        threshold={threshold}
        totalScams={appeared}
        points={score}
        wrong={wrong}
        escaped={escaped}
      />

      <BoardShell patternLabel={patternLabel} difficulty={difficulty}>
        <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
          {Array.from({ length: activeHoleCount }).map((_, idx) => (
            <div key={idx} className="aspect-[4/3] w-full">
              <Hole state={holes[idx]} onWhack={() => handleWhack(idx)} />
            </div>
          ))}
        </div>
      </BoardShell>
    </div>
  );
}

function computeStageTransitions(
  progression: number[] | undefined,
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
