import { supabaseAdmin } from "@/lib/supabase/admin";

/** Ids of the courses this user is enrolled in. */
export async function getEnrolledCourseIds(
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("course_enrollments")
    .select("course_id")
    .eq("user_id", userId);
  if (error) throw new Error(`enrolment load failed: ${error.message}`);
  return new Set((data ?? []).map((e) => e.course_id));
}

export async function isEnrolledForTrack(
  userId: string,
  trackId: string,
): Promise<boolean> {
  const { data: track, error } = await supabaseAdmin
    .from("learn_tracks")
    .select("course_id")
    .eq("id", trackId)
    .maybeSingle();
  if (error) throw new Error(`track load failed: ${error.message}`);
  if (!track?.course_id) return false;

  const { data: row, error: enrolErr } = await supabaseAdmin
    .from("course_enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", track.course_id)
    .maybeSingle();
  if (enrolErr) throw new Error(`enrolment load failed: ${enrolErr.message}`);
  return Boolean(row);
}
