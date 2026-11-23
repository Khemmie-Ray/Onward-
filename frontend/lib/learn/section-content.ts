import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Item } from "@/lib/learn/content-schema";
import { itemToCardRow } from "@/lib/learn/lesson-cards";

export const sectionContentEnabled = () =>
  process.env.LEARN_SECTION_CONTENT === "on";

export type SectionCardRow = {
  order_index: number;
  type: string;
  content: Record<string, unknown>;
};

export type SectionVersionCards = {
  versionId: string;
  cards: SectionCardRow[];
};

const Items = z.array(Item);

function toRows(items: unknown, versionId: string): SectionCardRow[] | null {
  const parsed = Items.safeParse(items);
  if (!parsed.success) {
    console.error(
      `[section-content] version ${versionId} doesn't match the schema`,
      parsed.error.issues[0],
    );
    return null;
  }
  return parsed.data.map((item, order_index) => ({
    order_index,
    ...itemToCardRow(item),
  }));
}

export async function getPublishedSection(
  slug: string,
): Promise<SectionVersionCards | null> {
  if (!sectionContentEnabled()) return null;
  try {
    const { data: section } = await supabaseAdmin
      .from("course_sections")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!section) return null;

    const { data: version } = await supabaseAdmin
      .from("section_versions")
      .select("id, items")
      .eq("section_id", section.id)
      .eq("status", "published")
      .maybeSingle();
    if (!version) return null;

    const cards = toRows(version.items, version.id);
    return cards ? { versionId: version.id, cards } : null;
  } catch (err) {
    console.error("[section-content] couldn't read published section", err);
    return null;
  }
}

export async function getServedSectionVersion(
  slug: string,
  versionId: string,
): Promise<SectionVersionCards | null> {
  if (!sectionContentEnabled()) return null;
  try {
    const { data: section } = await supabaseAdmin
      .from("course_sections")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!section) return null;

    const { data: version } = await supabaseAdmin
      .from("section_versions")
      .select("id, items, section_id")
      .eq("id", versionId)
      .maybeSingle();
    if (!version || version.section_id !== section.id) return null;

    const cards = toRows(version.items, version.id);
    return cards ? { versionId: version.id, cards } : null;
  } catch (err) {
    console.error("[section-content] couldn't read served version", err);
    return null;
  }
}

export async function recordSectionCompletion(input: {
  userId: string;
  legacyModuleId: string;
  versionId: string | null;
  score: number | null;
  pointsAwarded: number;
  badgeTokenId: string | null;
  badgeTxHash: string | null;
  legacyCompletionId: string;
}) {
  try {
    const { data: section } = await supabaseAdmin
      .from("course_sections")
      .select("id")
      .eq("legacy_module_id", input.legacyModuleId)
      .maybeSingle();
    if (!section) return;

    const { error } = await supabaseAdmin.from("section_completions").upsert(
      {
        user_id: input.userId,
        section_id: section.id,
        version_id: input.versionId,
        score: input.score,
        points_awarded: input.pointsAwarded,
        badge_token_id: input.badgeTokenId,
        badge_tx_hash: input.badgeTxHash,
        source: "live",
        legacy_completion_id: input.legacyCompletionId,
      },
      { onConflict: "user_id,section_id", ignoreDuplicates: true },
    );
    if (error)
      console.error(
        "[section-content] couldn't record completion",
        error.message,
      );
  } catch (err) {
    console.error("[section-content] couldn't record completion", err);
  }
}
