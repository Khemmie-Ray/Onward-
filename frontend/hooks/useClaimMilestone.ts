"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function useClaimMilestone() {
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneId: string) => {
      const res = await authFetch("/api/milestones/claim", {
        method: "POST",
        body: JSON.stringify({ milestone_id: milestoneId }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        points?: number;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "We couldn't claim this milestone. Please try again.");
      }
      return json;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["points"] });
    },
  });
}