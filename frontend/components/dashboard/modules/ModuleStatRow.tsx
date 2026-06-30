"use client";

import { BookOpen, Flame, Coins } from "lucide-react";

export function ModuleStatRow({
  modulesCompleted,
  modulesTotal,
  activityStreak,
  pointsEarned,
}: {
  modulesCompleted: number;
  modulesTotal: number;
  activityStreak: number;
  pointsEarned: number;
}) {
  const stats = [
    {
      label: "Done",
      value: `${modulesCompleted}/${modulesTotal}`,
      icon: <BookOpen size={13} strokeWidth={2.5} />,
      iconClass: "bg-forest text-paper",
    },
    {
      label: "Streak",
      value: `${activityStreak}d`,
      icon: <Flame size={13} strokeWidth={2.5} />,
      iconClass: "bg-terracotta text-paper",
    },
    {
      label: "Points",
      value: pointsEarned.toLocaleString(),
      icon: <Coins size={13} strokeWidth={2.5} />,
      iconClass: "bg-mustard text-indigo",
    },
  ];

  return (
    <div className="flex gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 rounded-[12px] bg-paper p-3 shadow-[0_2px_8px_rgba(31,58,110,0.05)]"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-[6px] ${stat.iconClass}`}
            >
              {stat.icon}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
              {stat.label}
            </span>
          </div>
          <div className="display text-[18px] font-bold text-indigo tabular-nums leading-none">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}