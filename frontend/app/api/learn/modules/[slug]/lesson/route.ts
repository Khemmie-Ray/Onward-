import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertModulePlayable } from "@/lib/learn/lock";
import type { LessonContent, LessonCard } from "@/lib/lessons/lesson-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;

  const playable = await assertModulePlayable(slug, user.id);
  if (!playable.ok) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { data: module } = await supabaseAdmin
    .from("learn_modules")
    .select(
      "id, slug, title, description, estimated_minutes, points_reward, first_card_tease, what_you_will_learn, track_id",
    )
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const { data: track } = await supabaseAdmin
    .from("learn_tracks")
    .select("title")
    .eq("id", module.track_id)
    .maybeSingle();

  const { data: cards } = await supabaseAdmin
    .from("learn_cards")
    .select("order_index, type, content")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  const lessonCards: LessonCard[] = (cards ?? []).map((card) => {
    if (card.type === "flip") {
      const c = card.content as {
        front: string;
        hint: string;
        back: string;
        icon?: string;
      };
      return {
        type: "flip",
        front: c.front,
        hint: c.hint,
        back: c.back,
        icon: c.icon,
      };
    }
    if (card.type === "choice") {
      const c = card.content as {
        question: string;
        options: string[];
        correct_index: number;
        explanation: string;
      };
      return {
        type: "choice",
        question: c.question,
        options: c.options,
        correctIndex: c.correct_index,
        explanation: c.explanation,
      };
    }
    
    if (card.type === "visual") {
      const c = card.content as {
        title: string;
        image: string;
        caption?: string;
        alt?: string;
      };
      return {
        type: "visual",
        title: c.title,
        image: c.image,
        caption: c.caption,
        alt: c.alt,
      };
    }

    const c = card.content as {
      scenario: string;
      correct_answer: "scam" | "real";
      teaching: string;
    };
    return {
      type: "spotter",
      scenario: c.scenario,
      correctAnswer: c.correct_answer,
      teaching: c.teaching,
    };
  });

  const lesson: LessonContent = {
    module: {
      slug: module.slug,
      title: module.title,
      category: (track?.title ?? "Learn") as LessonContent["module"]["category"],
      minutes: module.estimated_minutes,
      reward: module.points_reward,
      status: "available",
      description: module.description ?? "",
      whatYouWillLearn: module.what_you_will_learn ?? [],
      firstCardTease: module.first_card_tease ?? "",
    },
    cards: lessonCards,
  };

  return NextResponse.json(lesson);
}