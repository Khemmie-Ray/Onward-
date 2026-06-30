import type { WhackIcon } from "@/lib/scam/whackIcon";

export type Mode = "free" | "premium";

export type FreeStep = "idle" | "starting";

export type PremiumStep =
  | "idle"
  | "init"
  | "approving"
  | "staking"
  | "starting";

export type DailyCapMessage = { kind: "cap"; message: string } | null;

export type DisplayItem = {
  pattern_id: string;
  icon: WhackIcon;
  is_scam: boolean;
  kind: string;
};

export type WhackResult = {
  score: number;
  correctWhacks: number;
  wrongWhacks: number;
  missedScams: number;
  totalScams: number;
  whacks: string[];
  spawnedScams: number;
};

export type HoleState = {
  id: number;
  patternId: string;
  icon: WhackIcon | null;
  isScam: boolean;
  appearedAt: number;
  durationMs: number;
};

export type RoundPreview = {
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

export type SubmitResponse = {
  mode: Mode;
  passed: boolean;
  reward_g_amount: number;
  level_before: number;
  level_after: number;
  precision_percent: number;
  points_awarded?: number;
  new_points_balance?: number | null;
  threshold: { minPrecisionPercent: number; minCorrect: number };
  onchain: {
    rewardTxHash: string | null;
    stakeResolveTxHash: string | null;
    onchainError: string | null;
  };
};

export type PlayStats = {
  current_streak: number;
  lifetime_points_from_play: number;
  scams_whacked_today: number; 
  weekly_rank: number | null;
};
