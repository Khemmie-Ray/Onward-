"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { BookOpen, Clock, Lock, Bell, ArrowRight } from "lucide-react";

// ── Integration points ──────────────────────────────
const LEARN_ROUTE = "/learn"; // ← your learn page route

type CourseStatus = "available" | "coming-soon";
type Course = {
  id: string;
  title: string;
  description: string;
  lessons: number;
  minutesEach: number;
  status: CourseStatus;
};

const COURSES: Course[] = [
  {
    id: "web3",
    title: "Web3 & Blockchain",
    description:
      "Wallets, tokens, networks and how to stay safe while you use them.",
    lessons: 36,
    minutesEach: 5,
    status: "available",
  },
  {
    id: "coming-1",
    title: "New course",
    description:
      "Another subject is on the way. We will tell you the moment it opens.",
    lessons: 0,
    minutesEach: 0,
    status: "coming-soon",
  },
];

// Per-user progress returned by the backend, keyed by course id.
type Progress = {
  lessonsThisWeek: number;
  courses: Record<string, { enrolled: boolean; completed: number }>;
};

export default function CoursesPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();

  const { data } = useQuery({
    queryKey: ["courses", "progress"],
    queryFn: async () => {
      const res = await authFetch("/api/courses/progress"); // ← your endpoint
      if (!res.ok) throw new Error("Failed to load progress");
      return (await res.json()) as Progress;
    },
    staleTime: 60_000,
    retry: false,
  });

  const lessonsThisWeek = data?.lessonsThisWeek ?? 0;

  const startCourse = async (course: Course, enrolled: boolean) => {
    if (!enrolled) {
      // Enrol the new user, then send them into the lessons.
      try {
        await authFetch("/api/courses/enrol", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: course.id }),
        });
      } catch {
        // non-blocking: still route them in
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
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-[#77C082]" />
            {lessonsThisWeek} lessons done this week
          </span>
        </div>
        <img
          src="/images/courses-banner-art.png"
          alt=""
          className="hidden w-[180px] shrink-0 sm:block lg:w-[220px]"
        />
      </section>

      {/* Course grid */}
      <div className="mt-5 flex flex-wrap gap-x-[2%] gap-y-4">
        {COURSES.map((course) => {
          if (course.status === "coming-soon")
            return <ComingSoonCard key={course.id} course={course} />;
          const p = data?.courses?.[course.id];
          return (
            <ActiveCourseCard
              key={course.id}
              course={course}
              enrolled={p?.enrolled ?? false}
              completed={p?.completed ?? 0}
              onStart={() => startCourse(course, p?.enrolled ?? false)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ActiveCourseCard({
  course,
  enrolled,
  completed,
  onStart,
}: {
  course: Course;
  enrolled: boolean;
  completed: number;
  onStart: () => void;
}) {
  const pct = course.lessons
    ? Math.min(100, Math.round((completed / course.lessons) * 100))
    : 0;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-fg-soft/10 bg-white p-6 md:w-[48%] lg:w-[48%]">
      <div className="flex items-start justify-between gap-3">
        {enrolled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#77C082]/15 px-3 py-1 text-[12px] font-bold text-[#2E5237]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#77C082]" /> Your course
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-indigo/10 px-3 py-1 text-[12px] font-bold text-indigo">
            Available now
          </span>
        )}
        <img src="/images/course-web3-art.png" alt="" className="w-[110px] shrink-0" />
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
          <Clock size={14} /> {course.minutesEach} min each
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
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#77C082] py-3.5 font-bold text-[#1B133B] transition duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.99]"
        >
          {enrolled ? "Continue learning" : "Enrol"}
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ComingSoonCard({ course }: { course: Course }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-dashed border-fg-soft/25 bg-paper/40 p-6 md:w-[48%] lg:w-[48%]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Lock size={18} className="text-indigo" />
        </div>
        <img
          src="/images/course-coming-soon-art.png"
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