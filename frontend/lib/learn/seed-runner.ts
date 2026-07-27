import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeedTrack } from "./seed-types";

export async function runSeed(
  supabase: SupabaseClient,
  tracks: SeedTrack[],
): Promise<void> {
  for (const track of tracks) {
    const { data: trackRow, error: trackErr } = await supabase
      .from("learn_tracks")
      .upsert(
        {
          slug: track.slug,
          title: track.title,
          description: track.description,
          order_index: track.order_index,
          status: track.status,
          icon: track.icon ?? null,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (trackErr || !trackRow) {
      throw new Error(
        `Failed to upsert track ${track.slug}: ${trackErr?.message}`,
      );
    }
    const trackId = trackRow.id;

    for (const mod of track.modules) {
      const { data: modRow, error: modErr } = await supabase
        .from("learn_modules")
        .upsert(
          {
            track_id: trackId,
            slug: mod.slug,
            title: mod.title,
            description: mod.description,
            order_in_track: mod.order_in_track,
            estimated_minutes: mod.estimated_minutes,
            points_reward: mod.points_reward,
            first_card_tease: mod.first_card_tease,
            what_you_will_learn: mod.what_you_will_learn,
            status: mod.status ?? "live",
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single();

      if (modErr || !modRow) {
        throw new Error(
          `Failed to upsert module ${mod.slug}: ${modErr?.message}`,
        );
      }
      const moduleId = modRow.id;

      const { error: delErr } = await supabase
        .from("learn_cards")
        .delete()
        .eq("module_id", moduleId);
      if (delErr) {
        throw new Error(
          `Failed clearing cards for ${mod.slug}: ${delErr.message}`,
        );
      }

      const cardRows = mod.cards.map((card, i) => ({
        module_id: moduleId,
        order_index: i,
        type: card.type,
        content: card.content,
      }));

      const { error: cardErr } = await supabase
        .from("learn_cards")
        .insert(cardRows);
      if (cardErr) {
        throw new Error(
          `Failed inserting cards for ${mod.slug}: ${cardErr.message}`,
        );
      }

      console.log(`  seeded ${mod.slug} (${mod.cards.length} cards)`);
    }

    console.log(`seeded track ${track.slug} (${track.modules.length} modules)`);
  }
}
