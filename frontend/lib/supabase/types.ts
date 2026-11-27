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
  | "leaderboard_quests"
  | "streak_milestone"
  | "contest_win"
  | "claim_redemption"
  | "manual_adjustment"
  | "daily_quest"
  | "monthly_quest"
  | "milestone"
  | "referral_quality";

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
  freeze_armed_on: string | null;
  total_g_earned: number;
  current_level: number;
  referral_code: string | null;
  referred_by_user_id: string | null;
  is_verified: boolean | null;
  verified_checked_at: string | null;
  verified_on_onward: boolean | null;
  onward_verified_at: string | null;
  onward_verify_checked_at: string | null;
  contest_qualified: boolean;
  contest_qualified_at: string | null;
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
  /** Order the pattern was added. Drives the daily rotation. */
  seq: number;
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
  difficulty: "easy" | "hard" | "superhard";
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

export type StreakDaySource = "played" | "freeze" | "restore" | "manual";

export type DbStreakDay = {
  user_id: string;
  day: string;
  passed: boolean;
  rounds_played: number;
  source: StreakDaySource;
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

export type DbChainTx = {
  hash: string;
  block_number: number;
  block_time: string;
  from_address: string;
  to_address: string | null;
  success: boolean;
};

export type DbChainGdTransfer = {
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_time: string;
  from_address: string;
  to_address: string;
  value: string;
};

export type DbChainWhitelistEvent = {
  tx_hash: string;
  log_index: number;
  address: string;
  block_time: string;
};

export type DbChainAddress = {
  address: string;
  is_contract: boolean | null;
  whitelist_checked_at: string | null;
};

export type DbChainSyncState = {
  key: string;
  last_block: number;
  updated_at: string;
};

export type StreakClaimStatus = "pending" | "paid" | "failed";

export type DbStreakRewardClaim = {
  id: string;
  user_id: string;
  milestone_day: number;
  amount_g: number;
  status: StreakClaimStatus;
  tx_hash: string | null;
  claimed_at: string;
  paid_at: string | null;
};

export type DbStreakRewardCache = {
  milestone_day: number;
  amount_g: number;
  refreshed_at: string;
};

// ─── Quests and milestones ──────────────────────────────────────────────────

export type QuestTier = "easy" | "medium" | "stretch";

export type QuestMetric =
  | "modules_completed"
  | "rounds_played"
  | "rounds_passed"
  | "correct_whacks"
  | "activity_points";

export type DbQuestDefinition = {
  id: string;
  title: string;
  tier: QuestTier;
  metric: QuestMetric;
  target: number;
  params: Record<string, unknown>;
  weight: number;
  active: boolean;
  created_at: string;
};

export type DbUserDailyQuest = {
  id: string;
  user_id: string;
  quest_day: string;
  tier: QuestTier;
  quest_id: string;
  target: number;
  progress: number;
  completed_at: string | null;
  created_at: string;
};

export type DbMonthlyQuest = {
  month: string;
  title: string;
  description: string | null;
  target_quest_points: number;
  reward_points: number;
  badge_slug: string | null;
  created_at: string;
};

export type DbUserMonthlyQuest = {
  user_id: string;
  month: string;
  completed_at: string;
  badge_tx_hash: string | null;
};

export type MilestoneCategory =
  | "getting_started"
  | "learning"
  | "quests"
  | "seasonal";

export type DbMilestoneMetric =
  | "verified"
  | "modules_completed"
  | "track_completed"
  | "full_clear_days"
  | "monthly_quests_completed"
  | "season_participant";

export type DbMilestoneDefinition = {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string | null;
  metric: DbMilestoneMetric;
  threshold: number;
  params: Record<string, unknown>;
  reward_points: number;
  badge_slug: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type DbUserMilestone = {
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  points_awarded: number;
  badge_tx_hash: string | null;
  /** When the user claimed the points. Null = earned, not yet claimed. */
  claimed_at: string | null;
};

export type DbDifficultyTier = {
  key: "easy" | "hard" | "superhard";
  label: string;
  rank: number;
  total_seconds: number;
  popup_duration_ms: number;
  base_spawn_delay: number;
  spawn_jitter: number;
  board_size: number;
  list_size: number;
  scam_ratio: number;
  min_pattern_difficulty: number;
  max_pattern_difficulty: number;
  min_precision: number | null;
  min_correct: number | null;
  min_recall: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
      streak_reward_claims: {
        Row: DbStreakRewardClaim;
        Insert: Partial<DbStreakRewardClaim> & {
          user_id: string;
          milestone_day: number;
          amount_g: number;
        };
        Update: Partial<DbStreakRewardClaim>;
        Relationships: [];
      };
      streak_reward_cache: {
        Row: DbStreakRewardCache;
        Insert: Partial<DbStreakRewardCache> & {
          milestone_day: number;
          amount_g: number;
        };
        Update: Partial<DbStreakRewardCache>;
        Relationships: [];
      };
      courses: {
        Row: DbCourse;
        Insert: Partial<DbCourse> & {
          slug: string;
          title: string;
          order_index: number;
        };
        Update: Partial<DbCourse>;
        Relationships: [];
      };
      course_enrollments: {
        Row: DbCourseEnrollment;
        Insert: Partial<DbCourseEnrollment> & {
          user_id: string;
          course_id: string;
        };
        Update: Partial<DbCourseEnrollment>;
        Relationships: [];
      };
      course_modules: {
        Row: DbCourseModule;
        Insert: Partial<DbCourseModule> & {
          course_id: string;
          slug: string;
          title: string;
          order_index: number;
        };
        Update: Partial<DbCourseModule>;
        Relationships: [];
      };
      course_sections: {
        Row: DbCourseSection;
        Insert: Partial<DbCourseSection> & {
          module_id: string;
          slug: string;
          title: string;
          order_in_module: number;
        };
        Update: Partial<DbCourseSection>;
        Relationships: [];
      };
      section_versions: {
        Row: DbSectionVersion;
        Insert: Partial<DbSectionVersion> & {
          section_id: string;
          version: number;
          items: unknown[];
        };
        Update: Partial<DbSectionVersion>;
        Relationships: [];
      };
      section_completions: {
        Row: DbSectionCompletion;
        Insert: Partial<DbSectionCompletion> & {
          user_id: string;
          section_id: string;
        };
        Update: Partial<DbSectionCompletion>;
        Relationships: [];
      };
      section_progress: {
        Row: DbSectionProgress;
        Insert: Partial<DbSectionProgress> & {
          user_id: string;
          section_id: string;
        };
        Update: Partial<DbSectionProgress>;
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
      quest_definitions: {
        Row: DbQuestDefinition;
        Insert: Partial<DbQuestDefinition> & {
          id: string;
          title: string;
          tier: QuestTier;
          metric: QuestMetric;
          target: number;
        };
        Update: Partial<DbQuestDefinition>;
        Relationships: [];
      };
      user_daily_quests: {
        Row: DbUserDailyQuest;
        Insert: Partial<DbUserDailyQuest> & {
          user_id: string;
          quest_day: string;
          tier: QuestTier;
          quest_id: string;
          target: number;
        };
        Update: Partial<DbUserDailyQuest>;
        Relationships: [];
      };
      monthly_quests: {
        Row: DbMonthlyQuest;
        Insert: Partial<DbMonthlyQuest> & {
          month: string;
          title: string;
        };
        Update: Partial<DbMonthlyQuest>;
        Relationships: [];
      };
      user_monthly_quests: {
        Row: DbUserMonthlyQuest;
        Insert: Partial<DbUserMonthlyQuest> & {
          user_id: string;
          month: string;
        };
        Update: Partial<DbUserMonthlyQuest>;
        Relationships: [];
      };
      milestone_definitions: {
        Row: DbMilestoneDefinition;
        Insert: Partial<DbMilestoneDefinition> & {
          id: string;
          category: MilestoneCategory;
          title: string;
          metric: DbMilestoneMetric;
        };
        Update: Partial<DbMilestoneDefinition>;
        Relationships: [];
      };
      user_milestones: {
        Row: DbUserMilestone;
        Insert: Partial<DbUserMilestone> & {
          user_id: string;
          milestone_id: string;
        };
        Update: Partial<DbUserMilestone>;
        Relationships: [];
      };
      difficulty_tiers: {
        Row: DbDifficultyTier;
        Insert: Partial<DbDifficultyTier> & {
          key: DbDifficultyTier["key"];
          label: string;
          rank: number;
        };
        Update: Partial<DbDifficultyTier>;
        Relationships: [];
      };
      chain_txs: {
        Row: DbChainTx;
        Insert: DbChainTx;
        Update: Partial<DbChainTx>;
        Relationships: [];
      };
      chain_gd_transfers: {
        Row: DbChainGdTransfer;
        Insert: DbChainGdTransfer;
        Update: Partial<DbChainGdTransfer>;
        Relationships: [];
      };
      chain_whitelist_events: {
        Row: DbChainWhitelistEvent;
        Insert: DbChainWhitelistEvent;
        Update: Partial<DbChainWhitelistEvent>;
        Relationships: [];
      };
      chain_addresses: {
        Row: DbChainAddress;
        Insert: Partial<DbChainAddress> & { address: string };
        Update: Partial<DbChainAddress>;
        Relationships: [];
      };
      chain_sync_state: {
        Row: DbChainSyncState;
        Insert: Partial<DbChainSyncState> & { key: string };
        Update: Partial<DbChainSyncState>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      copy_course_learn_history: {
        Args: { p_course_slug: string };
        Returns: {
          modules_added: number;
          sections_added: number;
          completions_added: number;
          progress_added: number;
        }[];
      };
      compare_course_learn_history: {
        Args: { p_course_slug: string };
        Returns: {
          user_id: string;
          old_completions: number;
          new_completions: number;
        }[];
      };
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
      chain_addresses_due: {
        Args: { p_limit: number };
        Returns: { address: string; is_contract: boolean | null }[];
      };
      analytics_daily_transactions: {
        Args: { p_start: string };
        Returns: {
          block_date: string | null;
          direct_tx_count: number;
          gd_token_transfers: number;
          gd_volume: number;
          gd_net_flow: number;
        }[];
      };
      analytics_whitelisted_users: {
        Args: { p_start: string };
        Returns: { block_date: string | null; dau_whitelisted: number }[];
      };
      analytics_onboarded_users: {
        Args: { p_start: string };
        Returns: { cohort_date: string | null; onboarded_users: number }[];
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

export type CourseStatus = "available" | "coming_soon";

export type DbCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  order_index: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollmentSource = "self" | "backfill";

export type DbCourseEnrollment = {
  user_id: string;
  course_id: string;
  enrolled_at: string;
  source: CourseEnrollmentSource;
};

/** A module of a course (was a learn_tracks row). */
export type DbCourseModule = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  order_index: number;
  status: "available" | "coming_soon" | "draft";
  icon: string | null;
  legacy_track_id: string | null;
  created_at: string;
  updated_at: string;
};

/** A section of a module (was a learn_modules row, same slug). */
export type DbCourseSection = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_module: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  status: "draft" | "live";
  legacy_module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SectionVersionStatus = "draft" | "published" | "retired";

/** One version of a section's exercises. items follow lib/learn/content-schema Item. */
export type DbSectionVersion = {
  id: string;
  section_id: string;
  version: number;
  status: SectionVersionStatus;
  items: unknown[];
  notes: string | null;
  created_at: string;
  published_at: string | null;
};

export type DbSectionCompletion = {
  id: string;
  user_id: string;
  section_id: string;
  version_id: string | null;
  completed_at: string;
  score: number | null;
  points_awarded: number;
  badge_token_id: string | null;
  badge_tx_hash: string | null;
  source: "live" | "copied";
  legacy_completion_id: string | null;
};

export type DbSectionProgress = {
  user_id: string;
  section_id: string;
  current_card: number;
  started_at: string;
  last_active_at: string;
};

export type LearnModuleStatus = "draft" | "live";
export type LearnCardType = "flip" | "choice" | "spotter" | "visual";

export type DbLearnTrack = {
  id: string;
  /** The course this track belongs to. */
  course_id: string | null;
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
