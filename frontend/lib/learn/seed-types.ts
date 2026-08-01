export type FlipCardContent = {
  front: string;
  hint: string;
  back: string;
  icon?: string;
};

export type ChoiceCardContent = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type VisualCardContent = {
  title: string;
  image: string; 
  caption?: string;
  alt?: string;
};

export type SpotterCardContent = {
  scenario: string;
  scenario_render?: {
    type: "dm" | "tweet" | "wallet_popup" | "page";
    [key: string]: unknown;
  };
  correct_answer: "scam" | "real";
  teaching: string;
};

export type SeedCard =
  | { type: "flip"; content: FlipCardContent }
  | { type: "choice"; content: ChoiceCardContent }
  | { type: "visual"; content: VisualCardContent }
  | { type: "spotter"; content: SpotterCardContent };

export type SeedModule = {
  slug: string;
  title: string;
  order_in_track: number;
  description: string;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string;
  what_you_will_learn: string[];
  status?: "draft" | "live";
  cards: SeedCard[];
};

export type SeedTrack = {
  slug: string;
  title: string;
  description: string;
  order_index: number;
  status: "available" | "coming_soon";
  icon?: string;
  modules: SeedModule[];
};
