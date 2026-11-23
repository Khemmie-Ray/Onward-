import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTrackModulesWithLock } from "@/lib/learn/lock";
import { getEnrolledCourseIds } from "@/lib/server/enrollment";
import { sectionContentEnabled } from "@/lib/learn/section-content";
import { getModuleDetail } from "@/lib/learn/course-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;

  if (sectionContentEnabled()) {
    const detail = await getModuleDetail(slug, user.id as string);
    if (detail === "not_found") {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    if (detail === "not_enrolled") {
      return NextResponse.json(
        { error: "Enrol in this course to see its lessons." },
        { status: 403 },
      );
    }
    return NextResponse.json(detail);
  }

  const { data: track } = await supabaseAdmin
    .from("learn_tracks")
    .select("slug, title, description, status, course_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const enrolled = await getEnrolledCourseIds(user.id as string);
  if (!track.course_id || !enrolled.has(track.course_id)) {
    return NextResponse.json(
      { error: "Enrol in this course to see its lessons." },
      { status: 403 },
    );
  }

  const modules = await getTrackModulesWithLock(slug, user.id);

  return NextResponse.json({
    track: {
      slug: track.slug,
      title: track.title,
      description: track.description,
      status: track.status,
    },
    modules: modules ?? [],
  });
}
