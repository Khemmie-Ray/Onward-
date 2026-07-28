export type PlayMode = "free" | "premium";

export const SCORING = {
  freeReward: 0,
  premiumBonus: 50,

  free: {
    minPrecision: 0.6,
    minCorrect: 7,
    minRecall: 0.5, 
  },
  premium: {
    minPrecision: 0.6,
    minCorrect: 12,
    minRecall: 0.7, 
  },

  maxTotalWhacks: 200,
  maxPerPatternWhacks: 20,
  maxSpawnedScamsReported: 100,

  maxLevel: 100,
} as const;

export type GradeInput = {
  mode: PlayMode;
  correctWhacks: number;
  wrongWhacks: number;
  missedScams: number;
};

export type GradeResult = {
  score: number;
  precision: number;
  precisionPercent: number;
  recall: number;
  recallPercent: number;
  passed: boolean;
  rewardAmount: number;
  threshold: {
    minPrecision: number;
    minPrecisionPercent: number;
    minCorrect: number;
    minRecall: number;
    minRecallPercent: number;
  };
};

export function gradeRound(input: GradeInput): GradeResult {
  const { mode, correctWhacks, wrongWhacks, missedScams } = input;
  const totalWhacks = correctWhacks + wrongWhacks;
  const precision = totalWhacks > 0 ? correctWhacks / totalWhacks : 0;

  const totalScams = correctWhacks + missedScams;
  const recall = totalScams > 0 ? correctWhacks / totalScams : 0;

  const config = mode === "premium" ? SCORING.premium : SCORING.free;
  const passed =
    precision >= config.minPrecision &&
    correctWhacks >= config.minCorrect &&
    recall >= config.minRecall;

  const score = Math.max(0, correctWhacks - wrongWhacks);
  const rewardAmount = passed
    ? mode === "free"
      ? SCORING.freeReward
      : SCORING.premiumBonus
    : 0;

  return {
    score,
    precision,
    precisionPercent: Math.round(precision * 100),
    recall,
    recallPercent: Math.round(recall * 100),
    passed,
    rewardAmount,
    threshold: {
      minPrecision: config.minPrecision,
      minPrecisionPercent: Math.round(config.minPrecision * 100),
      minCorrect: config.minCorrect,
      minRecall: config.minRecall,
      minRecallPercent: Math.round(config.minRecall * 100),
    },
  };
}

export function nextLevel(current: number, passed: boolean): number {
  if (!passed) return current;
  return Math.min(current + 1, SCORING.maxLevel);
}

export function passThresholdText(mode: PlayMode): string {
  const c = mode === "premium" ? SCORING.premium : SCORING.free;
  return `${Math.round(c.minPrecision * 100)}% accuracy, catch ${Math.round(
    c.minRecall * 100,
  )}% of scams, ${c.minCorrect}+ correct`;
}

export function rewardText(mode: PlayMode): string {
  const points = mode === "premium" ? 50 : 25;
  return `${points} points`;
}
