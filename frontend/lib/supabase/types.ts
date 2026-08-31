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

export type SpotterCardContent = {
  scenario: string;
  scenario_render?: {
    type: "dm" | "tweet" | "wallet_popup" | "page";
    [key: string]: unknown;
  };
  correct_answer: "scam" | "real";
  teaching: string;
};

export type VisualCardContent = {
  title: string;
  image: string;
  caption?: string;
  alt?: string;
};

export type CardContent =
  | FlipCardContent
  | ChoiceCardContent
  | VisualCardContent
  | SpotterCardContent;
export type CardType = "flip" | "choice" | "spotter" | "visual";
export type ModuleCategory =
  | "Foundations"
  | "Identity"
  | "Economics"
  | "Safety"
  | "Utility";
export type ModuleStatus = "draft" | "live" | "deprecated";

export type PointSource =
  | "free_round_pass"
  | "module_complete"
  | "daily_login"
  | "referral"
  | "leaderboard_weekly"
  | "streak_milestone"
  | "contest_win"
  | "claim_redemption"
  | "manual_adjustment";

export type ClaimStatus = "pending" | "submitted" | "confirmed" | "failed";

export type SpendCategory =
  | "power_up"
  | "cosmetic"
  | "streak_repair"
  | "raffle"
  | "contest_entry"
  | "premium_stake"
  | "module_retake";

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
  referral_code: string | null;
  referred_by_user_id: string | null;
  is_verified: boolean | null;
  verified_checked_at: string | null;
   verified_on_onward: boolean | null;
  onward_verified_at: string | null;
  onward_verify_checked_at: string | null;
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
  icon_id: string | null;
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
  last_heartbeat_at: string | null;
  mode: "free" | "premium";
  started_at: string;
  completed_at: string | null;
  appeared_scams: number | null;
  score: number | null;
  correct_whacks: number | null;
  wrong_whacks: number | null;
  missed_scams: number | null;
  passed: boolean | null;
  reward_g_amount: number;
  reward_tx_hash: string | null;
  stake_resolve_tx_hash: string | null;
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

export type DbLeaderboardPeriod = {
  id: string;
  period_start: string;
  period_end: string;
  week_slug: string;
  winners_count: number;
  points_awarded: number;
  created_at: string;
};

export type DbUserPoints = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_claimed: number;
  updated_at: string;
};

export type DbPointTransaction = {
  id: string;
  user_id: string;
  delta: number;
  source: PointSource;
  reference_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type DbPointClaim = {
  id: string;
  user_id: string;
  points_claimed: number;
  g_amount: number;
  tx_hash: string | null;
  status: ClaimStatus;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
  claim_id: string | null;
};

export type DbSpendEvent = {
  id: string;
  user_id: string;
  g_amount: number;
  category: SpendCategory;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  tx_hash: string | null;
  created_at: string;
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
      leaderboard_periods: {
        Row: DbLeaderboardPeriod;
        Insert: Partial<DbLeaderboardPeriod> & {
          period_start: string;
          period_end: string;
          week_slug: string;
        };
        Update: Partial<DbLeaderboardPeriod>;
        Relationships: [];
      };
      user_points: {
        Row: DbUserPoints;
        Insert: Partial<DbUserPoints> & { user_id: string };
        Update: Partial<DbUserPoints>;
        Relationships: [];
      };
      point_transactions: {
        Row: DbPointTransaction;
        Insert: Partial<DbPointTransaction> & {
          user_id: string;
          delta: number;
          source: PointSource;
          reference_id: string;
        };
        Update: Partial<DbPointTransaction>;
        Relationships: [];
      };
      point_claims: {
        Row: DbPointClaim;
        Insert: Partial<DbPointClaim> & {
          user_id: string;
          points_claimed: number;
          g_amount: number;
        };
        Update: Partial<DbPointClaim>;
        Relationships: [];
      };
      spend_events: {
        Row: DbSpendEvent;
        Insert: Partial<DbSpendEvent> & {
          user_id: string;
          g_amount: number;
          category: SpendCategory;
        };
        Update: Partial<DbSpendEvent>;
        Relationships: [];
      };
      learn_tracks: {
        Row: DbLearnTrack;
        Insert: Partial<DbLearnTrack> & {
          slug: string;
          title: string;
          order_index: number;
        };
        Update: Partial<DbLearnTrack>;
        Relationships: [];
      };
      learn_modules: {
        Row: DbLearnModule;
        Insert: Partial<DbLearnModule> & {
          track_id: string;
          slug: string;
          title: string;
          order_in_track: number;
        };
        Update: Partial<DbLearnModule>;
        Relationships: [];
      };
      learn_cards: {
        Row: DbLearnCard;
        Insert: Partial<DbLearnCard> & {
          module_id: string;
          order_index: number;
          type: LearnCardType;
          content: CardContent;
        };
        Update: Partial<DbLearnCard>;
        Relationships: [];
      };
      learn_progress: {
        Row: DbLearnProgress;
        Insert: Partial<DbLearnProgress> & {
          user_id: string;
          module_id: string;
        };
        Update: Partial<DbLearnProgress>;
        Relationships: [];
      };
      learn_completions: {
        Row: DbLearnCompletion;
        Insert: Partial<DbLearnCompletion> & {
          user_id: string;
          module_id: string;
        };
        Update: Partial<DbLearnCompletion>;
        Relationships: [];
      };
      contest_payouts: {
        Row: DbContestPayout;
        Insert: Partial<DbContestPayout> & {
          contest_slug: string;
          board: string;
          wallet_address: string;
          amount_g: string;
          batch_ref: string;
        };
        Update: Partial<DbContestPayout>;
        Relationships: [];
      };
      contest_snapshot: {
        Row: DbContestSnapshot;
        Insert: Partial<DbContestSnapshot> & {
          contest_slug: string;
          board: string;
          rank: number;
          user_id: string;
          display_name: string;
          wallet_address: string;
          total_points: number;
        };
        Update: Partial<DbContestSnapshot>;
        Relationships: [];
      };
      contest_config: {
        Row: DbContestConfig;
        Insert: Partial<DbContestConfig> & {
          slug: string;
          seq: number;
          type: string;
          title: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<DbContestConfig>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      award_points: {
        Args: {
          p_user_id: string;
          p_delta: number;
          p_source: PointSource;
          p_reference_id: string;
          p_metadata?: Record<string, unknown> | null;
        };
        Returns: {
          new_balance: number;
          was_new: boolean;
        }[];
      };
    };
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

export type LearnTrackStatus = "available" | "coming_soon";
export type LearnModuleStatus = "draft" | "live";
export type LearnCardType = "flip" | "choice" | "spotter" | "visual";

export type DbLearnTrack = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_index: number;
  status: LearnTrackStatus;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type DbLearnModule = {
  id: string;
  track_id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  status: LearnModuleStatus;
  created_at: string;
  updated_at: string;
};

export type DbLearnCard = {
  id: string;
  module_id: string;
  order_index: number;
  type: LearnCardType;
  content: CardContent;
};

export type DbLearnProgress = {
  user_id: string;
  module_id: string;
  current_card: number;
  started_at: string;
  last_active_at: string;
};

export type DbLearnCompletion = {
  id: string;
  user_id: string;
  module_id: string;
  completed_at: string;
  quiz_score: number | null;
  points_awarded: number;
  badge_token_id: string | null;
  badge_tx_hash: string | null;
};

export type DbContestPayout = {
  id: string;
  contest_slug: string;
  board: string;
  user_id: string | null;
  wallet_address: string;
  rank: number | null;
  amount_g: string;
  batch_ref: string;
  tx_hash: string | null;
  paid_at: string;
  created_at: string;
};

export type DbContestSnapshot = {
  contest_slug: string;
  board: string;
  rank: number;
  user_id: string;
  display_name: string;
  wallet_address: string;
  quality_referrals: number;
  total_invited: number;
  lessons: number;
  rounds: number;
  rounds_passed: number;
  claims: number;
  referrals: number;
  verified_points: number;
  lesson_points: number;
  round_points: number;
  claim_points: number;
  referral_points: number;
  bonus_points: number;
  total_points: number;
  snapshot_at: string;
};

export type DbContestConfig = {
  id: string;
  slug: string;
  seq: number;
  type: string;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: string;
};