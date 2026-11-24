import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertModulePlayable } from "@/lib/learn/lock";
import type { LessonContent, LessonCard } from "@/lib/lessons/lesson-data";
import { toLessonCard } from "@/lib/learn/lesson-cards";
import {
  getPublishedSection,
  sectionContentEnabled,
} from "@/lib/learn/section-content";
import {
  checkSectionAccess,
  touchSectionProgress,
} from "@/lib/learn/course-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;

  if (sectionContentEnabled()) return sectionLesson(slug, user.id as string);

  const playable = await assertModulePlayable(slug, user.id);
  if (!playable.ok) {
    if (playable.reason === "not_enrolled") {
      return NextResponse.json(
        { error: "Enrol in this course to start its lessons." },
        { status: 403 },
      );
    }
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

  // A rewritten section, when this app reads them; otherwise learn_cards.
  const rewritten = await getPublishedSection(slug);

  const { data: cards } = rewritten
    ? { data: rewritten.cards }
    : await supabaseAdmin
        .from("learn_cards")
        .select("order_index, type, content")
        .eq("module_id", module.id)
        .order("order_index", { ascending: true });

  const lessonCards: LessonCard[] = (cards ?? []).map((card) =>
    toLessonCard(card.type, card.content as Record<string, unknown>),
  );

  const lesson: LessonContent = {
    module: {
      slug: module.slug,
      title: module.title,
      category: (track?.title ??
        "Learn") as LessonContent["module"]["category"],
      minutes: module.estimated_minutes,
      reward: module.points_reward,
      status: "available",
      description: module.description ?? "",
      whatYouWillLearn: module.what_you_will_learn ?? [],
      firstCardTease: module.first_card_tease ?? "",
    },
    cards: lessonCards,
    versionId: rewritten?.versionId,
  };

  return NextResponse.json(lesson);
}

async function sectionLesson(slug: string, userId: string) {
  const access = await checkSectionAccess(slug, userId);
  if (!access.ok) {
    if (access.reason === "not_enrolled") {
      return NextResponse.json(
        { error: "Enrol in this course to start its lessons." },
        { status: 403 },
      );
    }
    if (access.reason === "daily_limit") {
      return NextResponse.json(
        {
          error:
            "You've finished today's section. The next one opens tomorrow.",
          resets_at: access.resets_at,
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const published = await getPublishedSection(slug);
  if (!published) {
    return NextResponse.json(
      { error: "This section isn't ready yet" },
      { status: 404 },
    );
  }

  const review = access.completion !== null;
  if (!review) await touchSectionProgress(userId, access.section.id);

  const { section, module } = access;
  const lesson: LessonContent = {
    module: {
      slug: section.slug,
      title: section.title,
      category: module.title as LessonContent["module"]["category"],
      minutes: section.estimated_minutes,
      reward: review ? 0 : section.points_reward,
      status: review ? "complete" : "available",
      description: section.description ?? "",
      whatYouWillLearn: section.what_you_will_learn ?? [],
      firstCardTease: section.first_card_tease ?? "",
    },
    cards: published.cards.map((card) => toLessonCard(card.type, card.content)),
    versionId: published.versionId,
    review,
  };

  return NextResponse.json(lesson);
}
