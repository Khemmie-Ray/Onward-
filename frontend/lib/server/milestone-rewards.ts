import { getAddress } from "viem";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { isVerifiedCached } from "@/lib/server/verification-cache";
import {
  countUserCompletions,
  hasFinishedModule,
} from "@/lib/learn/learn-stats";
import type {
  DbMilestoneDefinition,
  DbMilestoneMetric,
  MilestoneCategory,
} from "@/lib/supabase/types";

type MilestoneParams = {
  track_slug?: string; 
  starts_on?: string; 
  ends_on?: string; 
};

export type MilestoneView = {
  id: string;
  category: MilestoneCategory;
  metric: DbMilestoneMetric;
  title: string;
  description: string | null;
  threshold: number;
  reward_points: number;
  value: number;
  achieved_at: string | null;
  points_awarded: number | null;
  claimed_at: string | null;
  claimable: boolean;
};

export async function evaluateMilestones(
  userId: string,
): Promise<MilestoneView[]> {
  const [defsRes, achievedRes] = await Promise.all([
    supabaseAdmin
      .from("milestone_definitions")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("user_milestones")
      .select("milestone_id, achieved_at, points_awarded, claimed_at")
      .eq("user_id", userId),
  ]);
  if (defsRes.error) {
    throw new Error(
      `milestone definitions load failed: ${defsRes.error.message}`,
    );
  }
  if (achievedRes.error) {
    throw new Error(
      `user milestones load failed: ${achievedRes.error.message}`,
    );
  }

  const definitions = (defsRes.data ?? []) as DbMilestoneDefinition[];
  const achieved = new Map(
    (achievedRes.data ?? []).map((m) => [
      m.milestone_id,
      { at: m.achieved_at, points: m.points_awarded, claimedAt: m.claimed_at },
    ]),
  );

  // Several milestones share a metric (10, 25, 50 lessons), so measure once.
  const measured = new Map<string, Promise<number>>();
  const measure = (def: DbMilestoneDefinition, params: MilestoneParams) => {
    const key = `${def.metric}:${JSON.stringify(params)}`;
    if (!measured.has(key)) {
      measured.set(key, measureMilestone(userId, def.metric, params));
    }
    return measured.get(key)!;
  };

  const views: MilestoneView[] = [];

  for (const def of definitions) {
    let at = achieved.get(def.id)?.at ?? null;
    let pointsAwarded = achieved.get(def.id)?.points ?? null;
    let claimedAt = achieved.get(def.id)?.claimedAt ?? null;
    let value = def.threshold;

    if (!at) {
      value = await measure(def, parseMilestoneParams(def.params));

      if (value >= def.threshold) {
        const now = new Date().toISOString();
        // Badge-only milestones have nothing to claim, so they're done now.
        const nothingToClaim = def.reward_points <= 0;
        const { error } = await supabaseAdmin.from("user_milestones").upsert(
          {
            user_id: userId,
            milestone_id: def.id,
            points_awarded: 0,
            claimed_at: nothingToClaim ? now : null,
          },
          { onConflict: "user_id,milestone_id", ignoreDuplicates: true },
        );
        if (error) throw new Error(`milestone record failed: ${error.message}`);
        at = now;
        pointsAwarded = 0;
        claimedAt = nothingToClaim ? now : null;
      }
    }

    views.push({
      id: def.id,
      category: def.category,
      metric: def.metric,
      title: def.title,
      description: def.description,
      threshold: def.threshold,
      reward_points: def.reward_points,
      value: Math.min(value, def.threshold),
      achieved_at: at,
      points_awarded: pointsAwarded,
      claimed_at: claimedAt,
      claimable: Boolean(at) && !claimedAt && def.reward_points > 0,
    });
  }

  return views;
}

async function measureMilestone(
  userId: string,
  metric: DbMilestoneMetric,
  params: MilestoneParams,
): Promise<number> {
  switch (metric) {
    case "verified": {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("wallet_address")
        .eq("id", userId)
        .single();
      if (error || !user?.wallet_address) return 0;
      try {
        const wallet = getAddress(user.wallet_address.split(":").pop()!);
        return (await isVerifiedCached(userId, wallet)) ? 1 : 0;
      } catch {
        return 0;
      }
    }

    case "modules_completed":
      return countUserCompletions(userId);

    case "track_completed":
      return (await hasFinishedModule(userId, params.track_slug)) ? 1 : 0;

    case "full_clear_days": {
      const { count, error } = await supabaseAdmin
        .from("point_transactions")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("source", "daily_quest");
      if (error) throw new Error(`full clear count failed: ${error.message}`);
      return count ?? 0;
    }

    case "monthly_quests_completed": {
      const { count, error } = await supabaseAdmin
        .from("user_monthly_quests")
        .select("user_id", { head: true, count: "exact" })
        .eq("user_id", userId);
      if (error) throw new Error(`monthly count failed: ${error.message}`);
      return count ?? 0;
    }

    case "season_participant": {
      if (!params.starts_on) return 0;
      let query = supabaseAdmin
        .from("streak_days")
        .select("day", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("passed", true)
        .gte("day", params.starts_on);
      if (params.ends_on) query = query.lte("day", params.ends_on);
      const { count, error } = await query;
      if (error) throw new Error(`season activity failed: ${error.message}`);
      return (count ?? 0) > 0 ? 1 : 0;
    }
  }
}

function parseMilestoneParams(raw: unknown): MilestoneParams {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    track_slug: str(r.track_slug),
    starts_on: str(r.starts_on),
    ends_on: str(r.ends_on),
  };
}

export type ClaimMilestoneResult =
  | { ok: true; points: number }
  | { ok: false; status: 404 | 409; error: string };


export async function claimMilestone(
  userId: string,
  milestoneId: string,
): Promise<ClaimMilestoneResult> {
  const [defRes, rowRes] = await Promise.all([
    supabaseAdmin
      .from("milestone_definitions")
      .select("id, metric, threshold, reward_points")
      .eq("id", milestoneId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_milestones")
      .select("claimed_at")
      .eq("user_id", userId)
      .eq("milestone_id", milestoneId)
      .maybeSingle(),
  ]);
  if (defRes.error)
    throw new Error(`milestone load failed: ${defRes.error.message}`);
  if (rowRes.error)
    throw new Error(`user milestone load failed: ${rowRes.error.message}`);

  const def = defRes.data;
  if (!def)
    return { ok: false, status: 404, error: "This milestone doesn't exist." };
  if (!rowRes.data) {
    return {
      ok: false,
      status: 409,
      error: "You haven't earned this milestone yet.",
    };
  }
  if (rowRes.data.claimed_at) {
    return {
      ok: false,
      status: 409,
      error: "You've already claimed this milestone.",
    };
  }

  if (def.reward_points > 0) {
    await awardPoints({
      userId,
      delta: def.reward_points,
      source: "milestone",
      referenceId: `milestone:${def.id}`,
      metadata: { metric: def.metric, threshold: def.threshold },
    });
  }

  const { error } = await supabaseAdmin
    .from("user_milestones")
    .update({
      claimed_at: new Date().toISOString(),
      points_awarded: def.reward_points,
    })
    .eq("user_id", userId)
    .eq("milestone_id", milestoneId)
    .is("claimed_at", null);
  if (error) throw new Error(`milestone claim record failed: ${error.message}`);

  return { ok: true, points: def.reward_points };
}
