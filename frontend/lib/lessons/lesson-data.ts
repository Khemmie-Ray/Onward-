import type { ModulePreview } from "@/lib/modules/types";

export type ChoiceCard = {
  type: "choice";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  optionFeedback?: string[];
};

export type ConceptCard = {
  type: "concept";
  title: string;
  body: string;
  image?: string;
  alt?: string;
  icon?: string | string[];
};

export type MatchPairsCard = {
  type: "match_pairs";
  prompt: string;
  pairs: { left: string; right: string }[];
  explanation: string;
};

export type SortBucketsCard = {
  type: "sort_buckets";
  prompt: string;
  buckets: { id: string; label: string }[];
  cards: { text: string; bucket: string }[];
  explanation: string;
};

export type OrderStepsCard = {
  type: "order_steps";
  prompt: string;
  steps: string[];
  explanation: string;
};

export type FillGapCard = {
  type: "fill_gap";
  sentence: string;
  answer: string;
  choices: string[];
  explanation: string;
};

export type ScamChannel =
  | "situation"
  | "dm"
  | "whatsapp"
  | "sms"
  | "tweet"
  | "email"
  | "wallet_popup"
  | "web_page"
  | "in_person";

export type SpotScamCard = {
  type: "spot_scam";
  channel: ScamChannel;
  sender?: string;
  body: string;
  answer: "scam" | "real";
  teaching: string;
};

export type RecapTerm = { meaning: string; word: string; accept: string[] };

export type RecapCard = {
  type: "recap";
  terms: RecapTerm[];
};

export type LessonCard =
  | ChoiceCard
  | ConceptCard
  | MatchPairsCard
  | SortBucketsCard
  | OrderStepsCard
  | FillGapCard
  | SpotScamCard
  | RecapCard;

export type CardAnswer = number | string | number[] | string[];

export type LessonContent = {
  module: ModulePreview;
  cards: LessonCard[];
  versionId?: string;
  review?: boolean;
};
