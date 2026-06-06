"use client";

import { tintForCategory, type ModuleCategory } from "@/lib/themes/tones";
import { ModuleRow } from "./ModuleRows";
import type { ModulePreview } from "@/lib/modules/types";

export function CategorySection({
  category,
  modules,
  openSlug,
  onToggle,
}: {
  category: ModuleCategory;
  modules: ModulePreview[];
  openSlug: string | null;
  onToggle: (slug: string) => void;
}) {
  if (modules.length === 0) return null;
  const t = tintForCategory(category);

  return (
    <section className="mb-10 animate-[fade-up_0.8s_ease_both]">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="display text-[20px] font-semibold tracking-[-0.015em] text-indigo">
          {category}
        </h2>
        <div className={`h-2 w-2 rounded-full ${t.accentBg}`} />
        <span className="text-[11px] font-medium uppercase tracking-widest text-fg-soft">
          {modules.length} module{modules.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {modules.map((module) => (
          <ModuleRow
            key={module.slug}
            module={module}
            isOpen={openSlug === module.slug}
            onToggle={() => onToggle(module.slug)}
          />
        ))}
      </div>
    </section>
  );
}