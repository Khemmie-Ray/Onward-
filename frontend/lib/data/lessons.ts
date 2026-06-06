import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LessonContent, LessonCard } from "@/lib/lessons/lesson-data";
import type { ChoiceCardContent, FlipCardContent, SpotterCardContent } from "@/lib/supabase/types";


export async function loadLessonContent(slug: string): Promise<LessonContent | null> {
  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!module) return null;

  const { data: cardRows } = await supabaseAdmin
    .from("module_cards")
    .select("*")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  const cards: LessonCard[] = (cardRows ?? []).map((row) => {
    if (row.type === "flip") {
      const c = row.content as FlipCardContent;
      return { type: "flip", front: c.front, hint: c.hint, back: c.back };
    }
    if (row.type === "choice") {
      const c = row.content as ChoiceCardContent;
      return {
        type: "choice",
        question: c.question,
        options: c.options,
        correctIndex: c.correct_index,
        explanation: c.explanation,
      };
    }
 
    const c = row.content as SpotterCardContent;
    return {
      type: "spotter",
      scenario: c.scenario,
      correctAnswer: c.correct_answer,
      teaching: c.teaching,
    };
  });

  return {
    module: {
      slug: module.slug,
      title: module.title,
      category: module.category as LessonContent["module"]["category"],
      minutes: module.estimated_minutes,
      reward: module.reward_g_amount,
      status: "available", 
      description: module.description ?? "",
      whatYouWillLearn: module.what_you_will_learn ?? [],
      firstCardTease: module.first_card_tease ?? "",
    },
    cards,
  };
}