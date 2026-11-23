// frontend/app/(authed)/(main)/courses/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useCourses } from "@/hooks/useCourses";
import type { CourseCard } from "@/lib/data/courses";
import { BookOpen, Clock, Lock, Bell, ArrowRight, Loader2 } from "lucide-react";

const LEARN_ROUTE = "/learn";

/** Shown when no upcoming course has been added to the courses table yet. */
const PLACEHOLDER: CourseCard = {
  slug: "coming-soon",
  title: "New course",
  description:
    "Another subject is on the way. We will tell you the moment it opens.",
  image_url: null,
  status: "coming_soon",
  lessons: 0,
  minutes_each: 0,
  enrolled: false,
  completed: 0,
};

export default function CoursesPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useCourses();
  const [starting, setStarting] = useState<string | null>(null);
  const [enrolError, setEnrolError] = useState<string | null>(null);

  const lessonsThisWeek = data?.lessons_this_week ?? 0;
  const courses = data?.courses ?? [];
  const available = courses.filter((c) => c.status === "available");
  const upcoming = courses.filter((c) => c.status === "coming_soon");

  const startCourse = async (course: CourseCard) => {
    setEnrolError(null);
    if (!course.enrolled) {
      setStarting(course.slug);
      try {
        const res = await authFetch("/api/courses/enrol", {
          method: "POST",
          body: JSON.stringify({ course_slug: course.slug }),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setEnrolError(d.error ?? "We couldn't enrol you. Please try again.");
          setStarting(null);
          return;
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["courses"] }),
          queryClient.invalidateQueries({ queryKey: ["learn"] }),
        ]);
      } catch {
        setEnrolError("We couldn't reach the server. Check your connection.");
        setStarting(null);
        return;
      }
    }
    router.push(LEARN_ROUTE);
  };

  return (
    <div className="w-full">
      <section className="mt-6 flex items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1F57] to-[#1B133B] p-7 md:p-9">
        <div className="max-w-md">
          <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
            Pick a course.
            <br />
            <span className="text-[#77C082]">Grow a skill.</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#CBC4F7]">
            Short lessons on things worth knowing, at your own pace. New courses
            appear here as they launch.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-bold text-white">
              <span className="h-2 w-2 rounded-full bg-[#77C082]" />
              {lessonsThisWeek} lessons done this week
            </span>
            {data?.today_done !== undefined && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-bold text-white">
                <span
                  className={`h-2 w-2 rounded-full ${data.today_done ? "bg-[#CDC4FB]" : "bg-mustard"}`}
                />
                {data.today_done
                  ? "Today's section done. Next one tomorrow"
                  : "Today's section is ready"}
              </span>
            )}
          </div>
        </div>
        <img
          src="/images/courses-banner-art.png"
          alt=""
          className="hidden w-[180px] shrink-0 sm:block lg:w-[220px]"
        />
      </section>

      {enrolError && (
        <p className="mt-4 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-[13px] font-semibold text-terracotta">
          {enrolError}
        </p>
      )}

      {/* Course grid */}
      {isLoading ? (
        <div className="mt-5 flex flex-wrap gap-x-[2%] gap-y-4" aria-hidden>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-80 w-full animate-pulse rounded-3xl bg-paper md:w-[48%]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-5 rounded-3xl bg-paper p-6 text-center text-[14px] text-fg-soft">
          We couldn&apos;t load courses. Refresh the page to try again.
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-x-[2%] gap-y-4">
          {available.map((course) => (
            <ActiveCourseCard
              key={course.slug}
              course={course}
              starting={starting === course.slug}
              onStart={() => startCourse(course)}
            />
          ))}
          {(upcoming.length > 0 ? upcoming : [PLACEHOLDER]).map((course) => (
            <ComingSoonCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveCourseCard({
  course,
  starting,
  onStart,
}: {
  course: CourseCard;
  starting: boolean;
  onStart: () => void;
}) {
  const { enrolled, completed } = course;
  const pct = course.lessons
    ? Math.min(100, Math.round((completed / course.lessons) * 100))
    : 0;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-fg-soft/10 bg-white p-6 md:w-[48%] lg:w-[48%]">
      <div className="flex items-start justify-between gap-3">
        {enrolled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#77C082]/15 px-3 py-1 text-[12px] font-bold text-[#2E5237]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#77C082]" /> Your
            course
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-indigo/10 px-3 py-1 text-[12px] font-bold text-indigo">
            Available now
          </span>
        )}
        {course.image_url && (
          <img src={course.image_url} alt="" className="w-[110px] shrink-0" />
        )}
      </div>

      <h3 className="mt-2 text-[26px] font-extrabold tracking-[-0.03em] text-[#1B133B]">
        {course.title}
      </h3>
      <p className="mt-2 text-[15px] leading-snug text-fg-dim">
        {course.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo/5 px-3 py-1.5 text-[13px] font-semibold text-[#1B133B]">
          <BookOpen size={14} /> {course.lessons} lessons
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo/5 px-3 py-1.5 text-[13px] font-semibold text-[#1B133B]">
          <Clock size={14} /> {course.minutes_each} min each
        </span>
      </div>

      {enrolled && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[13px] font-semibold">
            <span className="text-[#1B133B]">Your progress</span>
            <span className="text-fg-dim">
              {completed} of {course.lessons} lessons
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo/10">
            <div
              className="h-full rounded-full bg-[#77C082]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto pt-6">
        <button
          onClick={onStart}
          disabled={starting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#77C082] py-3.5 font-bold text-[#1B133B] transition duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {starting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {enrolled ? "Continue learning" : "Enrol"}
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ComingSoonCard({ course }: { course: CourseCard }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-dashed border-fg-soft/25 bg-paper/40 p-6 md:w-[48%] lg:w-[48%]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Lock size={18} className="text-indigo" />
        </div>
        <img
          src={course.image_url ?? "/images/course-coming-soon-art.png"}
          alt=""
          className="w-[110px] shrink-0 opacity-40 grayscale"
        />
      </div>

      <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo/10 px-3 py-1 text-[12px] font-bold text-indigo">
        <Lock size={12} /> Coming soon
      </span>

      <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.03em] text-fg-faint">
        {course.title}
      </h3>
      <p className="mt-2 text-[15px] leading-snug text-fg-dim">
        {course.description}
      </p>

      <div className="mt-auto pt-6">
        <button className="flex w-full items-center justify-center gap-2 rounded-full border border-fg-soft/20 bg-white py-3.5 font-semibold text-fg-dim transition hover:border-indigo/30 hover:text-indigo">
          <Bell size={16} /> Notify me
        </button>
      </div>
    </div>
  );
}
