import type { EcosystemCategory } from "@/lib/themes/tones";

export type AppStatus = "available" | "coming-soon";

export type EcosystemApp = {
  slug: string;
  name: string;
  builder: string;
  category: EcosystemCategory;
  status: AppStatus;
  tagline: string;
  description: string;
  tutorialMinutes: number;
  reward: number;
  highlights: string[];
  isNew?: boolean;
  isFeatured?: boolean;
};