"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayActivity } from "@/lib/modules/activity";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


function toIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); 
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatShortDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getActivityCount(activity: DayActivity[], d: Date): number {
  const iso = toIsoDateLocal(d);
  return activity.find((a) => a.date === iso)?.count ?? 0;
}

export function ActivityCalendar({ activity }: { activity: DayActivity[] }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    getMondayOfWeek(today),
  );

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = weekDates[6];

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const weekActivityCount = weekDates.filter(
    (d) => getActivityCount(activity, d) > 0,
  ).length;

  const monthActivityDays = useMemo(() => {
    const year = weekStart.getFullYear();
    const month = weekStart.getMonth();
    return activity.filter((a) => {
      if (a.count === 0) return false;
      const [y, m] = a.date.split("-").map(Number);
      return y === year && m - 1 === month;
    }).length;
  }, [activity, weekStart]);

  const weekRangeLabel = `${formatShortDay(weekStart)} – ${formatShortDay(weekEnd)}`;

  return (
    <div className="rounded-[16px] bg-paper p-4 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold text-indigo leading-tight">
            {formatMonth(weekStart)}
          </p>
          {monthActivityDays > 0 ? (
            <p className="text-[10px] font-semibold text-forest mt-0.5">
              {monthActivityDays} day{monthActivityDays === 1 ? "" : "s"}{" "}
              learned
            </p>
          ) : (
            <p className="text-[10px] font-medium text-fg-faint mt-0.5">
              No activity yet
            </p>
          )}
        </div>

      {weekActivityCount === 0 && (
        <p className="text-[11px] text-center text-fg-soft mt-3">
          No activity yet for this week
        </p>
      )}
      </div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrev}
          aria-label="Previous week"
          className="flex h-7 w-7 items-center justify-center rounded-full text-fg-soft hover:bg-canvas-warm hover:text-indigo transition"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <span className="text-[11px] font-semibold text-fg-soft">
          {weekRangeLabel}
        </span>
        <button
          onClick={goNext}
          aria-label="Next week"
          className="flex h-7 w-7 items-center justify-center rounded-full text-fg-soft hover:bg-canvas-warm hover:text-indigo transition"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex gap-1 justify-between">
        {weekDates.map((d, i) => {
          const count = getActivityCount(activity, d);
          const hasActivity = count > 0;
          const isToday = isSameDay(d, today);
          const isFuture = d > today;

          return (
            <div
              key={i}
              title={`${d.toDateString()} · ${count} card${count === 1 ? "" : "s"}`}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[10px] transition ${
                hasActivity
                  ? "bg-mustard text-indigo"
                  : isToday
                    ? "bg-canvas-warm text-indigo"
                    : "text-fg-soft"
              } ${isToday && !hasActivity ? "ring-1 ring-terracotta" : ""} ${
                isFuture ? "opacity-40" : ""
              }`}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wide">
                {DAY_NAMES[i]}
              </span>
              <span className="text-[14px] font-bold tabular-nums leading-none">
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
