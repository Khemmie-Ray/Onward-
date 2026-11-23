import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { course_slug?: string };

/** Enrols the user in a course. Enrolling twice is fine and changes nothing. */
export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as Body | null;
  const slug = body?.course_slug?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Missing course_slug" }, { status: 400 });
  }

  const { data: course, error: courseErr } = await supabaseAdmin
    .from("courses")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (courseErr) {
    console.error("[courses/enrol] course load failed", courseErr);
    return NextResponse.json(
      { error: "We couldn't enrol you. Please try again." },
      { status: 500 },
    );
  }
  if (!course) {
    return NextResponse.json({ error: "This course doesn't exist." }, { status: 404 });
  }
  if (course.status !== "available") {
    return NextResponse.json(
      { error: "This course isn't open yet." },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin.from("course_enrollments").upsert(
    { user_id: user.id as string, course_id: course.id, source: "self" },
    { onConflict: "user_id,course_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[courses/enrol] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't enrol you. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ enrolled: true });
}