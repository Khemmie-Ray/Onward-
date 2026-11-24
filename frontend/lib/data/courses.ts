import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPeriodStart } from "@/lib/leaderboard-period";
import type { CourseStatus } from "@/lib/supabase/types";
import { sectionContentEnabled } from "@/lib/learn/section-content";
import { getDailyState } from "@/lib/learn/course-store";

export type CourseCard = {
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: CourseStatus;
  lessons: number;
  minutes_each: number;
  enrolled: boolean;
  completed: number;
};

export type CoursesData = {
  lessons_this_week: number;
  today_done?: boolean;
  courses: CourseCard[];
};

export async function getCourses(userId: string): Promise<CoursesData> {
  if (sectionContentEnabled()) return getCoursesFromSections(userId);
  const [coursesRes, tracksRes, modulesRes, enrolRes, doneRes] =
    await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id, slug, title, description, image_url, status, order_index")
        .order("order_index", { ascending: true }),
      supabaseAdmin.from("learn_tracks").select("id, course_id"),
      supabaseAdmin
        .from("learn_modules")
        .select("id, track_id, estimated_minutes")
        .eq("status", "live"),
      supabaseAdmin
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId),
      supabaseAdmin
        .from("learn_completions")
        .select("module_id, completed_at")
        .eq("user_id", userId),
    ]);

  for (const r of [coursesRes, tracksRes, modulesRes, enrolRes, doneRes]) {
    if (r.error) throw new Error(`courses load failed: ${r.error.message}`);
  }

  const courseByTrack = new Map(
    (tracksRes.data ?? []).map((t) => [t.id, t.course_id]),
  );
  const courseByModule = new Map<string, string>();
  const modulesByCourse = new Map<string, { count: number; minutes: number }>();
  for (const m of modulesRes.data ?? []) {
    const courseId = courseByTrack.get(m.track_id);
    if (!courseId) continue;
    courseByModule.set(m.id, courseId);
    const agg = modulesByCourse.get(courseId) ?? { count: 0, minutes: 0 };
    agg.count += 1;
    agg.minutes += m.estimated_minutes;
    modulesByCourse.set(courseId, agg);
  }

  const completedByCourse = new Map<string, number>();
  const weekStart = getPeriodStart().getTime();
  let lessonsThisWeek = 0;
  for (const c of doneRes.data ?? []) {
    if (new Date(c.completed_at).getTime() >= weekStart) lessonsThisWeek++;
    const courseId = courseByModule.get(c.module_id);
    if (courseId) {
      completedByCourse.set(
        courseId,
        (completedByCourse.get(courseId) ?? 0) + 1,
      );
    }
  }

  const enrolled = new Set((enrolRes.data ?? []).map((e) => e.course_id));

  return {
    lessons_this_week: lessonsThisWeek,
    courses: (coursesRes.data ?? []).map((c) => {
      const agg = modulesByCourse.get(c.id);
      return {
        slug: c.slug,
        title: c.title,
        description: c.description,
        image_url: c.image_url,
        status: c.status,
        lessons: agg?.count ?? 0,
        minutes_each:
          agg && agg.count > 0 ? Math.round(agg.minutes / agg.count) : 0,
        enrolled: enrolled.has(c.id),
        completed: completedByCourse.get(c.id) ?? 0,
      };
    }),
  };
}

async function getCoursesFromSections(userId: string): Promise<CoursesData> {
  const [coursesRes, modulesRes, sectionsRes, enrolRes, doneRes] =
    await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id, slug, title, description, image_url, status, order_index")
        .order("order_index", { ascending: true }),
      supabaseAdmin
        .from("course_modules")
        .select("id, course_id")
        .eq("status", "available"),
      supabaseAdmin
        .from("course_sections")
        .select("id, module_id, estimated_minutes")
        .eq("status", "live"),
      supabaseAdmin
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId),
      supabaseAdmin
        .from("section_completions")
        .select("section_id, completed_at")
        .eq("user_id", userId),
    ]);

  for (const r of [coursesRes, modulesRes, sectionsRes, enrolRes, doneRes]) {
    if (r.error) throw new Error(`courses load failed: ${r.error.message}`);
  }

  const courseByModule = new Map(
    (modulesRes.data ?? []).map((m) => [m.id, m.course_id]),
  );
  const courseBySection = new Map<string, string>();
  const sectionsByCourse = new Map<
    string,
    { count: number; minutes: number }
  >();
  for (const sec of sectionsRes.data ?? []) {
    const courseId = courseByModule.get(sec.module_id);
    if (!courseId) continue;
    courseBySection.set(sec.id, courseId);
    const agg = sectionsByCourse.get(courseId) ?? { count: 0, minutes: 0 };
    agg.count += 1;
    agg.minutes += sec.estimated_minutes;
    sectionsByCourse.set(courseId, agg);
  }

  const completedByCourse = new Map<string, number>();
  const weekStart = getPeriodStart().getTime();
  let lessonsThisWeek = 0;
  for (const c of doneRes.data ?? []) {
    if (new Date(c.completed_at).getTime() >= weekStart) lessonsThisWeek++;
    const courseId = courseBySection.get(c.section_id);
    if (courseId)
      completedByCourse.set(
        courseId,
        (completedByCourse.get(courseId) ?? 0) + 1,
      );
  }

  const enrolled = new Set((enrolRes.data ?? []).map((e) => e.course_id));
  const daily = await getDailyState(userId);

  return {
    lessons_this_week: lessonsThisWeek,
    today_done: daily.done_today,
    courses: (coursesRes.data ?? []).map((c) => {
      const agg = sectionsByCourse.get(c.id);
      return {
        slug: c.slug,
        title: c.title,
        description: c.description,
        image_url: c.image_url,
        status: c.status,
        lessons: agg?.count ?? 0,
        minutes_each:
          agg && agg.count > 0 ? Math.round(agg.minutes / agg.count) : 0,
        enrolled: enrolled.has(c.id),
        completed: completedByCourse.get(c.id) ?? 0,
      };
    }),
  };
}
