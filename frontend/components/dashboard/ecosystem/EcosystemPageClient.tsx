"use client";

import { useState } from "react";
import {
  tintForEcosystemCategory,
  type EcosystemCategory,
} from "@/lib/themes/tones";
import { AppRow } from "./AppRow";
import type { EcosystemApp } from "@/lib/ecosystem/type";

const CATEGORIES: EcosystemCategory[] = [
  "Earn",
  "Spend",
  "Connect",
  "Governance",
];

export function EcosystemPageClient({ apps }: { apps: EcosystemApp[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const handleToggle = (slug: string) =>
    setOpenSlug((current) => (current === slug ? null : slug));

  return (
    <>
      {CATEGORIES.map((category) => {
        const appsInCategory = apps.filter((a) => a.category === category);
        if (appsInCategory.length === 0) return null;
        const t = tintForEcosystemCategory(category);

        return (
          <section
            key={category}
            className="mb-10 animate-[fade-up_0.8s_ease_both]"
          >
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="display text-[20px] font-semibold tracking-[-0.015em] text-indigo">
                {category}
              </h2>
              <div className={`h-2 w-2 rounded-full ${t.accentBg}`} />
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-fg-soft">
                {appsInCategory.length} app
                {appsInCategory.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {appsInCategory.map((app) => (
                <AppRow
                  key={app.slug}
                  app={app}
                  isOpen={openSlug === app.slug}
                  onToggle={() => handleToggle(app.slug)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
