"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/useAuthFetch";

let firedThisSession = false;

export function useDailyLoginBonus() {
  const authFetch = useAuthFetch();
  const localFired = useRef(false);

  useEffect(() => {
    if (firedThisSession || localFired.current) return;
    firedThisSession = true;
    localFired.current = true;

    (async () => {
      try {
        const res = await authFetch("/api/points/daily-login", {
          method: "POST",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          awarded: boolean;
          points: number;
          newBalance: number | null;
        };

        if (data.awarded && data.points > 0) {
          toast.success(`+${data.points} points`, {
            description: "Daily login bonus. Welcome back!",
          });
        }
      } catch {
        // Silent — a missed daily bonus toast is not worth surfacing an error
      }
    })();
  }, [authFetch]);
}
