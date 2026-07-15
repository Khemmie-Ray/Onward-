export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  wallet_address: string | null;
  level: number;
  streak: number;
  correct_whacks: number;
  rounds_played: number;
  primary_mode: "free" | "premium";
  prize_points: number;
  is_viewer: boolean;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  viewer: LeaderboardEntry | null;
  pagination: {
    limit: number;
    offset: number;
    total_players: number;
    has_more: boolean;
  };
  period: {
    start: string;
    end: string;
    days: number;
  };
  prizes: {
    by_rank: Record<number, number>;
    top_paid_rank: number;
    total_pool_points: number;
  };
};

export type LeaderboardStats = {
  platform: {
    g_distributed: number;
  };
  lifetime: {
    points_awarded: number;
    weeks_paid: number;
  };
  this_week: {
    active_players: number;
    rounds_played: number;
    days: number;
  };
};