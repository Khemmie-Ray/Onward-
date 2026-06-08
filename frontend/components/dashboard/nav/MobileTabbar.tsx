"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TONE_MAP } from "@/lib/themes/tones";
import {
  NAV_DESTINATIONS,
  isActiveDestination,
  type NavDestination,
} from "@/lib/nav/destinations";


export function MobileTabBar({
  destinations = NAV_DESTINATIONS,
}: {
  destinations?: NavDestination[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-shadow pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-2">
        {destinations.map((dest) => {
          const active = isActiveDestination(pathname, dest.href);
          const t = TONE_MAP[dest.tone];
          const Icon = dest.icon;

          return (
            <li key={dest.href} className="flex-1">
              <Link
                href={dest.href}
                aria-current={active ? "page" : undefined}
                className={`group flex flex-col items-center gap-1 rounded-2xl py-2 px-1 transition-all ${
                  active ? t.bg : ""
                }`}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2.2}
                    className={active ? t.fg : "text-fg-soft"}
                  />
                  {dest.badge?.pulse && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-terracotta animate-pulse"
                      aria-label="New activity"
                    />
                  )}
                  {dest.badge?.text && !dest.badge.pulse && (
                    <span
                      className={`absolute -top-1 -right-2 text-[8px] font-bold tabular-nums px-1 py-0.5 rounded-full leading-none ${
                        active ? "bg-paper text-indigo" : "bg-terracotta text-paper"
                      }`}
                    >
                      {dest.badge.text}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold leading-none ${
                    active ? t.fg : "text-fg-soft"
                  }`}
                >
                  {dest.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}