"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TONE_MAP } from "@/lib/themes/tones";
import {
  NAV_DESTINATIONS,
  isActiveDestination,
  type NavDestination,
} from "@/lib/nav/destinations";

export function TopTabs({
  destinations = NAV_DESTINATIONS,
}: {
  destinations?: NavDestination[];
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block md:block w-full my-6" aria-label="Primary">
      <ul className="flex items-center gap-1 rounded-full bg-paper p-2.5 shadow-[0_4px_14px_rgba(31,58,110,0.06)] w-fit">
        {destinations.map((dest) => {
          const active = isActiveDestination(pathname, dest.href);
          const t = TONE_MAP[dest.tone];
          const Icon = dest.icon;

          return (
            <li key={dest.href}>
              <Link
                href={dest.href}
                aria-current={active ? "page" : undefined}
                className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? `${t.bg} ${t.fg} shadow-sm`
                    : `text-fg-soft ${t.hoverTint}`
                }`}
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2.5 : 2.2}
                  className="shrink-0"
                />
                <span>{dest.label}</span>
                {dest.badge?.text && (
                  <span
                    className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                      active ? "bg-white/20" : "bg-canvas-warm text-fg-soft"
                    }`}
                  >
                    {dest.badge.text}
                  </span>
                )}
                {dest.badge?.pulse && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                      active ? "bg-paper" : "bg-terracotta"
                    }`}
                    aria-label="New activity"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}