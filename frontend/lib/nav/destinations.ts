import { Folder, BookOpen, Target, Globe, User } from "lucide-react";
import type { Tone } from "../themes/tones";

export type NavBadge = {
  text?: string;
  pulse?: boolean;
};

export type NavDestination = {
  href: string;
  label: string;
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
  >;
  tone: Tone;
  badge?: NavBadge;
};

export const NAV_DESTINATIONS: NavDestination[] = [
  { href: "/overview", label: "Overview", icon: Folder, tone: "indigo" },
  { href: "/modules", label: "Modules", icon: BookOpen, tone: "mustard" },
  { href: "/play", label: "Play", icon: Target, tone: "terracotta" },
  { href: "/ecosystem", label: "Ecosystem", icon: Globe, tone: "forest" },
  { href: "/profile", label: "Profile", icon: User, tone: "aubergine" },
];

/**
 * Decide whether a destination matches the current pathname.
 * Exact match for /dashboard, prefix match for everything else so
 * /modules/[slug] still highlights the Modules tab.
 */
export function isActiveDestination(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}