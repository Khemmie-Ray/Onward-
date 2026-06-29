import { supabaseAdmin } from "@/lib/supabase/admin";
import { ModuleCategory } from "../supabase/types";

export async function isModuleLocked(
  userId: string,
  moduleCategory: ModuleCategory,
  moduleOrder: number,
): Promise<boolean> {
  const { data: earlierModules } = await supabaseAdmin
    .from("modules")
    .select("id")
    .eq("category", moduleCategory)
    .eq("status", "live")
    .lt("order_in_category", moduleOrder);

  if (!earlierModules || earlierModules.length === 0) {
    return false;
  }

  const earlierIds = earlierModules.map((m) => m.id);
  const { data: completed } = await supabaseAdmin
    .from("module_completions")
    .select("module_id")
    .eq("user_id", userId)
    .in("module_id", earlierIds);

  const completedIds = new Set(completed?.map((c) => c.module_id) ?? []);
  return earlierModules.some((m) => !completedIds.has(m.id));
}

export function isModuleLockedInList(
  module: { id: string; category: string; order_in_category: number },
  allModules: Array<{ id: string; category: string; order_in_category: number }>,
  completionsByModule: Record<string, true>,
): boolean {
  return allModules.some(
    (other) =>
      other.category === module.category &&
      other.order_in_category < module.order_in_category &&
      other.id !== module.id &&
      !completionsByModule[other.id],
  );
}