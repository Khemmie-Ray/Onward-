import type { ModuleCategory } from "../themes/tones";

export type ModuleStatus = "complete" | "active" | "available" | "tomorrow" | "locked";

export type ModulePreview = {
  slug: string;
  title: string;
  category: ModuleCategory;
  minutes: number;
  reward: number;
  status: ModuleStatus;
  progress?: number;
  description: string;
  whatYouWillLearn: string[];
  firstCardTease: string;
};