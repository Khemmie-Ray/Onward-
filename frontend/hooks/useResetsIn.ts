"use client";

import { useEffect, useState } from "react";

/** "5h 42m" until the next UTC midnight, when daily quests reset. */
export function useResetsIn(): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(formatUntilUtcMidnight(new Date()));
    // Computed after mount so server and client render the same markup.
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, []);

  return label;
}

function formatUntilUtcMidnight(now: Date): string {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const minutes = Math.max(
    0,
    Math.floor((next.getTime() - now.getTime()) / 60_000),
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
