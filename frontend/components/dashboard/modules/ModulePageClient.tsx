"use client";

import { useState } from "react";
import type { ModuleCategory } from "@/lib/themes/tones";
import type { ModulePreview } from "@/lib/modules/types";
import { CategorySection } from "./CategorySection";

const CATEGORIES: ModuleCategory[] = [
  "Foundations",
  "Identity",
  "Economics",
  "Safety",
];

export function ModulesPageClient({ modules }: { modules: ModulePreview[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const handleToggle = (slug: string) => {
    setOpenSlug((current) => (current === slug ? null : slug));
  };

  return (
    <>
      {CATEGORIES.map((category) => (
        <CategorySection
          key={category}
          category={category}
          modules={modules.filter((m) => m.category === category)}
          openSlug={openSlug}
          onToggle={handleToggle}
        />
      ))}
    </>
  );
}