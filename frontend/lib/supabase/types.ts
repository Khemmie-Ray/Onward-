export type FlipCardContent = {
  front: string;
  hint: string;
  back: string;
};

export type ChoiceCardContent = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
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

export type CardContent = FlipCardContent | ChoiceCardContent | SpotterCardContent;
export type CardType = "flip" | "choice" | "spotter";
export type ModuleCategory = "Foundations" | "Identity" | "Economics" | "Safety";
export type ModuleStatus = "draft" | "live" | "deprecated";

export type DbUser = {
  id: string;
  wallet_address: string;
  display_name: string | null;
  display_name_normalized: string | null;
  avatar_id: string | null;
  created_at: string;
  last_active_at: string;
  current_streak: number;
  longest_streak: number;
  total_g_earned: number;
  current_level: number;
};

export type DbModule = {
  id: string;
  slug: string;
  title: string;
  category: ModuleCategory;
  order_in_category: number;
  description: string | null;
  estimated_minutes: number;
  reward_g_amount: number;
  status: ModuleStatus;
  prerequisite_slug: string | null;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbModuleCard = {
  id: string;
  module_id: string;
  order_index: number;
  type: CardType;
  content: CardContent;
};

export type DbModuleProgress = {
  user_id: string;
  module_id: string;
  current_card: number;
  started_at: string;
  last_active_at: string;
};

export type DbModuleCompletion = {
  id: string;
  user_id: string;
  module_id: string;
  completed_at: string;
  quiz_score: number | null;
  reward_tx_hash: string | null;
  badge_token_id: string | null;
};

export type DbScamPattern = {
  id: string;
  family: string;
  family_label: string;
  family_description: string;
  is_scam: boolean;
  is_exemplar: boolean;
  difficulty: number;
  kind: "dm" | "tweet" | "wallet_popup" | "page";
  content: Record<string, unknown>;
  teaching: string;
  created_at: string;
};

export type DbGameSession = {
  id: string;
  user_id: string;
  featured_family: string;
  items: { pattern_id: string; is_scam: boolean }[];
  popup_duration_ms: number;
  total_seconds: number;
  status: "pending" | "active" | "submitted" | "expired";
  mode: "free" | "premium";
  started_at: string;
  completed_at: string | null;
  score: number | null;
  correct_whacks: number | null;
  wrong_whacks: number | null;
  missed_scams: number | null;
  passed: boolean | null;
  reward_g_amount: number;
  reward_tx_hash: string | null;
  level_badge_tx_hash: string | null;
  level_before: number | null;
  level_after: number | null;
};

export type DbStreakDay = {
  user_id: string;
  day: string;
  passed: boolean;
  rounds_played: number;
};

export type DbLeaderboardPayout = {
  id: string;
  user_id: string;
  rank: number;
  period_start: string;
  period_end: string;
  amount_g: number;
  tx_hash: string | null;
  paid_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: Partial<DbUser> & { wallet_address: string };
        Update: Partial<DbUser>;
        Relationships: [];
      };
      modules: {
        Row: DbModule;
        Insert: Partial<DbModule>;
        Update: Partial<DbModule>;
        Relationships: [];
      };
      module_cards: {
        Row: DbModuleCard;
        Insert: Partial<DbModuleCard>;
        Update: Partial<DbModuleCard>;
        Relationships: [];
      };
      module_progress: {
        Row: DbModuleProgress;
        Insert: Partial<DbModuleProgress>;
        Update: Partial<DbModuleProgress>;
        Relationships: [];
      };
      module_completions: {
        Row: DbModuleCompletion;
        Insert: Partial<DbModuleCompletion>;
        Update: Partial<DbModuleCompletion>;
        Relationships: [];
      };
      scam_patterns: {
        Row: DbScamPattern;
        Insert: Partial<DbScamPattern> & {
          family: string;
          family_label: string;
          family_description: string;
          is_scam: boolean;
          kind: DbScamPattern["kind"];
          content: Record<string, unknown>;
          teaching: string;
        };
        Update: Partial<DbScamPattern>;
        Relationships: [];
      };
      game_sessions: {
        Row: DbGameSession;
        Insert: Partial<DbGameSession> & {
          user_id: string;
          featured_family: string;
          items: DbGameSession["items"];
        };
        Update: Partial<DbGameSession>;
        Relationships: [];
      };
      streak_days: {
        Row: DbStreakDay;
        Insert: Partial<DbStreakDay> & { user_id: string; day: string };
        Update: Partial<DbStreakDay>;
        Relationships: [];
      };
      leaderboard_payouts: {
        Row: DbLeaderboardPayout;
        Insert: Partial<DbLeaderboardPayout> & {
          user_id: string;
          rank: number;
          period_start: string;
          period_end: string;
          amount_g: number;
        };
        Update: Partial<DbLeaderboardPayout>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type ModuleWithProgress = DbModule & {
  status_for_user: "complete" | "active" | "available" | "locked";
  progress?: { current_card: number; total_cards: number; percent: number };
};

export type ModuleDetail = DbModule & {
  cards: DbModuleCard[];
};