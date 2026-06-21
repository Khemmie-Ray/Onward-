"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { ModulePreview } from "@/lib/modules/types";
import type { ModuleWithProgress } from "@/lib/supabase/types";
import { getMockActivity } from "@/lib/modules/activity";
import { ModulesPanel } from "@/components/dashboard/modules/ModulesPanel";
import { LessonPanel } from "@/components/dashboard/lesson/LessonPanel";

function selectDefaultModule(modules: ModulePreview[]): ModulePreview | null {
  return (
    modules.find((m) => m.status === "active") ??
    modules.find((m) => m.status === "available") ??
    [...modules].reverse().find((m) => m.status === "complete") ??
    null
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

export default function ModulesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const slugFromUrl = searchParams.get("lesson");

  const [chooseNextMode, setChooseNextMode] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await authFetch("/api/modules");
      if (!res.ok) throw new Error("Failed to load modules");
      return res.json() as Promise<{ modules: ModuleWithProgress[] }>;
    },
  });

  const activity = useMemo(() => getMockActivity(90), []);

  if (isLoading || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const modules: ModulePreview[] = data.modules.map(toModulePreview);
  const defaultSlug = selectDefaultModule(modules)?.slug ?? null;
  const activeSlug = chooseNextMode ? null : (slugFromUrl ?? defaultSlug);

  const handleSelectModule = (slug: string) => {
    setChooseNextMode(false);
    router.replace(`/modules?lesson=${slug}`);
  };

  const handleChooseNext = () => {
    setChooseNextMode(true);
    router.replace("/modules");
  };

  return (
    <div className="my-4">
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <main className="w-full lg:w-1/2 order-1 lg:order-2">
          <LessonPanel slug={activeSlug} onChooseNext={handleChooseNext} />
        </main>

        <aside className="w-full lg:w-1/2 order-2 lg:order-1">
          <ModulesPanel
            modules={modules}
            selectedSlug={activeSlug}
            onSelect={handleSelectModule}
            activity={activity}
          />
        </aside>
      </div>
    </div>
  );
}
