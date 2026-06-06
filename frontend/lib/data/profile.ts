import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser, ModuleCategory } from "@/lib/supabase/types";
import { EXPLORER_BASE } from "@/constants/contracts/address";
import { getBadgeImageIpfs } from "@/lib/badges/badgeImage";

export type ProfileBadge = {
  moduleSlug: string;
  moduleTitle: string;
  category: ModuleCategory;
  imageUrl: string | null;
  earned: boolean;
  earnedAt: string | null;
  rewardAmount: number;
  txHash: string | null;
  explorerUrl: string | null;
};

export type ProfileData = {
  displayName: string;
  walletAddress: string;
  joinedAt: string;
  daysOnOnward: number;

  totalGEarned: number;
  modulesCompleted: number;
  modulesTotal: number;
  currentLevel: number;
  longestStreak: number;
  currentStreak: number;

  badges: ProfileBadge[];
};

export async function loadProfileData(user: DbUser): Promise<ProfileData> {
  const [{ data: modules }, { data: completions }] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select("*")
      .eq("status", "live")
      .order("category", { ascending: true })
      .order("order_in_category", { ascending: true }),

    supabaseAdmin
      .from("module_completions")
      .select("module_id, completed_at, reward_tx_hash, badge_token_id")
      .eq("user_id", user.id),
  ]);

  const completionByModule = new Map(
    (completions ?? []).map((c) => [c.module_id, c])
  );

  const badges: ProfileBadge[] = (modules ?? []).map((m) => {
    const completion = completionByModule.get(m.id);
    const txHash = completion?.reward_tx_hash ?? null;

    return {
      moduleSlug: m.slug,
      moduleTitle: m.title,
      category: m.category,
      imageUrl: getBadgeImageIpfs(m.slug),
      earned: Boolean(completion),
      earnedAt: completion?.completed_at ?? null,
      rewardAmount: m.reward_g_amount,
      txHash,
      explorerUrl: txHash ? `${EXPLORER_BASE}/tx/${txHash}` : null,
    };
  });

  const joinedDate = new Date(user.created_at);
  const now = Date.now();
  const daysOnOnward = Math.max(
    1,
    Math.floor((now - joinedDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    displayName: user.display_name ?? "there",
    walletAddress: user.wallet_address,
    joinedAt: user.created_at,
    daysOnOnward,
    totalGEarned: Number(user.total_g_earned),
    modulesCompleted: badges.filter((b) => b.earned).length,
    modulesTotal: badges.length,
    currentLevel: user.current_level,
    longestStreak: user.longest_streak,
    currentStreak: user.current_streak,
    badges,
  };
}