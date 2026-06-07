"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { ModulesPageHeader } from "@/components/dashboard/modules/ModulesPageHeader";
import { ContinueLearningStrip } from "@/components/dashboard/modules/ContinueLearningStrip";
import { ModulesPageClient } from "@/components/dashboard/modules/ModulePageClient";
import type { ModulePreview } from "@/lib/modules/types";
import type { ModuleWithProgress } from "@/lib/supabase/types";

export default function ModulesPage() {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await authFetch("/api/modules");
      if (!res.ok) throw new Error("Failed to load modules");
      return res.json() as Promise<{ modules: ModuleWithProgress[] }>;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
          Loading modules…
        </div>
      </div>
    );
  }

  const modules: ModulePreview[] = data.modules.map(toModulePreview);
  const inProgress = modules.find((m) => m.status === "active");
  const totalComplete = modules.filter((m) => m.status === "complete").length;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[8%] h-[400px] w-[400px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(91,46,92,0.30)_0%,transparent_70%)]"
      />

      <ModulesPageHeader
        totalComplete={totalComplete}
        totalModules={modules.length}
      />

      {inProgress && <ContinueLearningStrip module={inProgress} />}

      <ModulesPageClient modules={modules} />
    </>
  );
}

function toModulePreview(dbModule: ModuleWithProgress): ModulePreview {
  return {
    slug: dbModule.slug,
    title: dbModule.title,
    category: dbModule.category as ModulePreview["category"],
    minutes: dbModule.estimated_minutes,
    reward: dbModule.reward_g_amount,
    status: dbModule.status_for_user,
    progress: dbModule.progress?.percent,
    description: dbModule.description ?? "",
    whatYouWillLearn: dbModule.what_you_will_learn ?? [],
    firstCardTease: dbModule.first_card_tease ?? "",
  };
}