import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ModuleWithProgress, DbUser } from "@/lib/supabase/types";
import { isModuleLockedInList } from "@/lib/modules/lock-check";

export async function loadModulesForUser(
  user: DbUser | null
): Promise<ModuleWithProgress[]> {
  const [{ data: modules }, { data: cardRows }] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select("*")
      .eq("status", "live")
      .order("category", { ascending: true })
      .order("order_in_category", { ascending: true }),
    supabaseAdmin.from("module_cards").select("module_id"),
  ]);

  const cardCounts: Record<string, number> = {};
  for (const c of cardRows ?? []) {
    cardCounts[c.module_id] = (cardCounts[c.module_id] ?? 0) + 1;
  }

  let completionsByModule: Record<string, true> = {};
  let progressByModule: Record<string, number> = {};

  if (user) {
    const [{ data: completions }, { data: progress }] = await Promise.all([
      supabaseAdmin
        .from("module_completions")
        .select("module_id")
        .eq("user_id", user.id),
      supabaseAdmin
        .from("module_progress")
        .select("module_id, current_card")
        .eq("user_id", user.id),
    ]);

    completionsByModule = Object.fromEntries(
      (completions ?? []).map((c) => [c.module_id, true as const])
    );
    progressByModule = Object.fromEntries(
      (progress ?? []).map((p) => [p.module_id, p.current_card])
    );
  }

  return (modules ?? []).map((m) => {
    const totalCards = cardCounts[m.id] ?? 5;
    const isLocked = isModuleLockedInList(
      m,
      modules ?? [],
      completionsByModule
    );

    let status_for_user: ModuleWithProgress["status_for_user"];
    let progress: ModuleWithProgress["progress"] | undefined;

    if (completionsByModule[m.id]) {
      status_for_user = "complete";
    } else if (progressByModule[m.id] != null) {
      status_for_user = "active";
      const currentCard = progressByModule[m.id];
      progress = {
        current_card: currentCard,
        total_cards: totalCards,
        percent: Math.round((currentCard / totalCards) * 100),
      };
    } else if (isLocked) {
      status_for_user = "locked";
    } else {
      status_for_user = "available";
    }

    return { ...m, status_for_user, progress };
  });
}