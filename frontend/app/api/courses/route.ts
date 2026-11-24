import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { getCourses } from "@/lib/data/courses";

/** Courses with lesson counts, plus this user's enrolment and progress. */
export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    return NextResponse.json(await getCourses(user.id as string));
  } catch (err) {
    console.error("[courses] load failed", err);
    return NextResponse.json(
      { error: "We couldn't load courses. Please try again." },
      { status: 500 },
    );
  }
}
