import type { ModulePreview } from "@/lib/modules/types";

export type FlipCard = {
  type: "flip";
  front: string;
  hint: string;
  back: string;
};

export type ChoiceCard = {
  type: "choice";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type VisualCard = {
  type: "visual";
  title: string;
  image: string;
  caption?: string;
  alt?: string;
};

export type SpotterCard = {
  type: "spotter";
  scenario: string;
  correctAnswer: "scam" | "real";
  teaching: string;
};

export type LessonCard = FlipCard | ChoiceCard | VisualCard | SpotterCard;

export type LessonContent = {
  module: ModulePreview;
  cards: LessonCard[];
};