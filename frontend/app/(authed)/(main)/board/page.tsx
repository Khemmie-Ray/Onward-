"use client";

import { useState } from "react";
import { QuestBoard } from "@/components/dashboard/leaderboard/QuestBoard";
import { GameArenaBoard } from "@/components/dashboard/leaderboard/GameArenaBoard";

type Tab = "quest" | "arena";

const TABS: { key: Tab; label: string }[] = [
  { key: "quest", label: "Quest" },
  { key: "arena", label: "Game arena" },
];

export default function BoardPage() {
  const [tab, setTab] = useState<Tab>("quest");

  return (
    <div className="w-full">
      <div className="inline-flex gap-1  rounded-full bg-canvas-warm p-1 my-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              tab === t.key
                ? "bg-indigo text-cream"
                : "text-fg-soft hover:text-indigo"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "quest" ? <QuestBoard /> : <GameArenaBoard />}
    </div>
  );
}
